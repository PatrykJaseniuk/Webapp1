-- ================================================
-- RENTAL MANAGEMENT SYSTEM - AUTHORIZATION
-- ================================================
-- Row Level Security (RLS) setup with helper functions and policies
-- Defines access control for landlords, tenants, and admins

-- ================================================
-- STEP 0: CUSTOM ACCESS TOKEN HOOK
-- ================================================
-- Runs before a JWT is issued. Embeds user_role claim
-- so RLS policies can read auth.jwt() ->> 'user_role'
-- instead of querying public.user_role (avoiding RLS
-- recursion and permission-check side-effects).

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $$
DECLARE
    claims jsonb;
    user_role text;
BEGIN
    SELECT role INTO user_role
    FROM public.user_role
    WHERE user_id = (event ->> 'user_id')::uuid;

    claims := event -> 'claims';

    IF user_role IS NOT NULL THEN
        claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
    ELSE
        claims := jsonb_set(claims, '{user_role}', 'null');
    END IF;

    event := jsonb_set(event, '{claims}', claims);

    RETURN event;
END;
$$;

-- Grants for the auth hook
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;

GRANT EXECUTE
    ON FUNCTION public.custom_access_token_hook
    TO supabase_auth_admin;

REVOKE EXECUTE
    ON FUNCTION public.custom_access_token_hook
    FROM authenticated, anon, public;

GRANT ALL
    ON TABLE public.user_role
    TO supabase_auth_admin;

REVOKE ALL
    ON TABLE public.user_role
    FROM anon, public;

-- Note: authenticated remains granted for admin role management via API
-- RLS policies on user_roles further restrict to admins only

-- Auth admin needs to read user_roles — dedicated permissive policy
CREATE POLICY "Allow auth admin to read user roles"
    ON public.user_role
    AS PERMISSIVE
    FOR SELECT
    TO supabase_auth_admin
    USING (true);

-- ================================================
-- STEP 1: ENABLE RLS ON ALL TABLES
-- ================================================

ALTER TABLE public.user_role ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lease_agreement ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treasury ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_entry ENABLE ROW LEVEL SECURITY;

-- ================================================
-- STEP 2: HELPER FUNCTIONS FOR RLS
-- ================================================

-- Get current user's role from the JWT (set by custom_access_token_hook)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
    SELECT auth.jwt() ->> 'user_role';
$$;

-- Check if current user is admin (reads JWT claim, no DB query)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
    SELECT COALESCE(auth.jwt() ->> 'user_role' = 'admin', false);
$$;

-- Check if current user is landlord or admin (reads JWT claim, no DB query)
CREATE OR REPLACE FUNCTION public.is_landlord()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
    SELECT COALESCE(auth.jwt() ->> 'user_role' IN ('admin', 'landlord'), false);
$$;

-- Get tenant_id for current user
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    tenant_uuid uuid;
BEGIN
    SELECT id INTO tenant_uuid
    FROM public.tenant
    WHERE user_id = auth.uid();
    
    RETURN tenant_uuid;
END;
$$;

-- Returns all lease IDs for the current tenant (SECURITY DEFINER — bypasses RLS on lease_agreements)
CREATE OR REPLACE FUNCTION public.get_tenant_lease_ids()
RETURNS uuid[]
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
    SELECT COALESCE(
        array_agg(id),
        ARRAY[]::uuid[]
    )
    FROM public.lease_agreement
    WHERE tenant_id = (
        SELECT id FROM public.tenant WHERE user_id = auth.uid()
    );
$$;

-- Returns property IDs from active leases for the current tenant (SECURITY DEFINER — bypasses RLS on lease_agreements)
CREATE OR REPLACE FUNCTION public.get_tenant_visible_property_ids()
RETURNS uuid[]
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
    SELECT COALESCE(
        array_agg(property_id),
        ARRAY[]::uuid[]
    )
    FROM public.lease_agreement
    WHERE tenant_id = (
        SELECT id FROM public.tenant WHERE user_id = auth.uid()
    )
    AND lease_status = 'active';
$$;

-- ================================================
-- STEP 3: USER ROLES POLICIES
-- ================================================

-- Consolidated SELECT policy for all authenticated users
CREATE POLICY "Authenticated users can read user roles"
    ON public.user_role
    FOR SELECT
    TO authenticated
    USING (
        -- Users see their own role
        (SELECT auth.uid()) = user_id
        OR
        -- Admins see all roles
        is_admin()
    );

-- Admins can insert roles
CREATE POLICY "Admins can insert roles"
    ON public.user_role
    FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

-- Admins can update roles
CREATE POLICY "Admins can update roles"
    ON public.user_role
    FOR UPDATE
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- Admins can delete roles
CREATE POLICY "Admins can delete roles"
    ON public.user_role
    FOR DELETE
    TO authenticated
    USING (is_admin());

-- ================================================
-- STEP 4: PROPERTIES POLICIES
-- ================================================

-- Policy for landlords and admins: see all properties (no subquery on lease_agreements)
CREATE POLICY "Landlords can read all properties"
    ON public.property
    FOR SELECT
    TO authenticated
    USING (is_landlord());

-- Policy for tenants: see properties they are currently leasing
-- Uses SECURITY DEFINER wrapper to avoid permission errors on lease_agreements
CREATE POLICY "Tenants can read their leased properties"
    ON public.property
    FOR SELECT
    TO authenticated
    USING (id = ANY(get_tenant_visible_property_ids()));

-- Landlords can insert properties
CREATE POLICY "Landlords can insert properties"
    ON public.property
    FOR INSERT
    TO authenticated
    WITH CHECK (is_landlord());

-- Landlords can update properties
CREATE POLICY "Landlords can update properties"
    ON public.property
    FOR UPDATE
    TO authenticated
    USING (is_landlord())
    WITH CHECK (is_landlord());

-- Landlords can delete properties
CREATE POLICY "Landlords can delete properties"
    ON public.property
    FOR DELETE
    TO authenticated
    USING (is_landlord());

-- ================================================
-- STEP 5: TENANTS POLICIES
-- ================================================

-- Consolidated SELECT policy for all authenticated users
CREATE POLICY "Authenticated users can read tenants"
    ON public.tenant
    FOR SELECT
    TO authenticated
    USING (
        -- Landlords see all tenants
        is_landlord()
        OR
        -- Tenants see their own data
        user_id = (SELECT auth.uid())
    );

-- Consolidated UPDATE policy for authenticated users
CREATE POLICY "Authenticated users can update tenants"
    ON public.tenant
    FOR UPDATE
    TO authenticated
    USING (
        -- Landlords can update all tenants
        is_landlord()
        OR
        -- Tenants can update their own contact information
        user_id = (SELECT auth.uid())
    )
    WITH CHECK (
        is_landlord()
        OR
        user_id = (SELECT auth.uid())
    );

-- Landlords can insert tenants
CREATE POLICY "Landlords can insert tenants"
    ON public.tenant
    FOR INSERT
    TO authenticated
    WITH CHECK (is_landlord());

-- Landlords can delete tenants
CREATE POLICY "Landlords can delete tenants"
    ON public.tenant
    FOR DELETE
    TO authenticated
    USING (is_landlord());

-- ================================================
-- STEP 6: LEASE AGREEMENTS POLICIES
-- ================================================

-- Consolidated SELECT policy for all authenticated users
CREATE POLICY "Authenticated users can read leases"
    ON public.lease_agreement
    FOR SELECT
    TO authenticated
    USING (
        -- Landlords see all leases
        is_landlord()
        OR
        -- Tenants see their own leases
        tenant_id = get_current_tenant_id()
    );

-- Landlords can insert leases
CREATE POLICY "Landlords can insert leases"
    ON public.lease_agreement
    FOR INSERT
    TO authenticated
    WITH CHECK (is_landlord());

-- Landlords can update leases
CREATE POLICY "Landlords can update leases"
    ON public.lease_agreement
    FOR UPDATE
    TO authenticated
    USING (is_landlord())
    WITH CHECK (is_landlord());

-- Landlords can delete leases
CREATE POLICY "Landlords can delete leases"
    ON public.lease_agreement
    FOR DELETE
    TO authenticated
    USING (is_landlord());

-- ================================================
-- STEP 7: ATTACHMENTS POLICIES
-- ================================================

-- Consolidated SELECT policy for all authenticated users
CREATE POLICY "Authenticated users can read attachments"
    ON public.attachment
    FOR SELECT
    TO authenticated
    USING (
        is_landlord()
        OR
        (related_to_type = 'lease' AND related_to_id = ANY(get_tenant_lease_ids()))
        OR
        (related_to_type = 'property' AND related_to_id = ANY(get_tenant_visible_property_ids()))
    );

-- Landlords can insert attachments
CREATE POLICY "Landlords can insert attachments"
    ON public.attachment
    FOR INSERT
    TO authenticated
    WITH CHECK (is_landlord());

-- Landlords can update attachments
CREATE POLICY "Landlords can update attachments"
    ON public.attachment
    FOR UPDATE
    TO authenticated
    USING (is_landlord())
    WITH CHECK (is_landlord());

-- Landlords can delete attachments
CREATE POLICY "Landlords can delete attachments"
    ON public.attachment
    FOR DELETE
    TO authenticated
    USING (is_landlord());

-- ================================================
-- STEP 8: TREASURIES POLICIES
-- ================================================
-- Cash accounts are landlord/admin only — tenants must never see them.

CREATE POLICY "Landlords can read treasuries"
    ON public.treasury
    FOR SELECT
    TO authenticated
    USING (is_landlord());

CREATE POLICY "Landlords can insert treasuries"
    ON public.treasury
    FOR INSERT
    TO authenticated
    WITH CHECK (is_landlord());

CREATE POLICY "Landlords can update treasuries"
    ON public.treasury
    FOR UPDATE
    TO authenticated
    USING (is_landlord())
    WITH CHECK (is_landlord());

CREATE POLICY "Landlords can delete treasuries"
    ON public.treasury
    FOR DELETE
    TO authenticated
    USING (is_landlord());

-- ================================================
-- STEP 9: FINANCIAL ENTRIES POLICIES
-- ================================================

-- Consolidated SELECT policy for all authenticated users
-- Tenants see entries linked to any of their leases (past or present).
-- Property-level and treasury-level entries (lease_id IS NULL) are landlord-only.
CREATE POLICY "Authenticated users can read financial entries"
    ON public.financial_entry
    FOR SELECT
    TO authenticated
    USING (
        is_landlord()
        OR
        lease_id = ANY(get_tenant_lease_ids())
    );

-- Landlords can insert financial entries
CREATE POLICY "Landlords can insert financial entries"
    ON public.financial_entry
    FOR INSERT
    TO authenticated
    WITH CHECK (is_landlord());

-- Landlords can update financial entries
CREATE POLICY "Landlords can update financial entries"
    ON public.financial_entry
    FOR UPDATE
    TO authenticated
    USING (is_landlord())
    WITH CHECK (is_landlord());

-- Landlords can delete financial entries
CREATE POLICY "Landlords can delete financial entries"
    ON public.financial_entry
    FOR DELETE
    TO authenticated
    USING (is_landlord());

-- ================================================
-- STEP 10: TABLE PRIVILEGES (GRANTS)
-- ================================================
-- DML privileges for PostgREST (authenticated / anon roles).
-- RLS policies still enforce row-level access — these grants only
-- allow PostgREST to attempt the query; RLS decides which rows are visible.

-- ── Domain tables: full DML for authenticated ──────
-- anon is granted alongside authenticated for consistency with Supabase
-- defaults; all RLS policies are TO authenticated, so anon sees no rows.
GRANT SELECT, INSERT, UPDATE, DELETE
    ON public.property,
           public.tenant,
           public.lease_agreement,
           public.attachment,
           public.treasury,
           public.financial_entry
    TO authenticated, anon;

-- ── user_roles: DML for authenticated only ─────────
-- anon is explicitly revoked above; authenticated needs DML for admin
-- role management via API.
GRANT SELECT, INSERT, UPDATE, DELETE
    ON public.user_role
    TO authenticated;

