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
-- instead of querying public.user_roles (avoiding RLS
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
    FROM public.user_roles
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
    ON TABLE public.user_roles
    TO supabase_auth_admin;

REVOKE ALL
    ON TABLE public.user_roles
    FROM anon, public;

-- Note: authenticated remains granted for admin role management via API
-- RLS policies on user_roles further restrict to admins only

-- Auth admin needs to read user_roles — dedicated permissive policy
CREATE POLICY "Allow auth admin to read user roles"
    ON public.user_roles
    AS PERMISSIVE
    FOR SELECT
    TO supabase_auth_admin
    USING (true);

-- ================================================
-- STEP 1: ENABLE RLS ON ALL TABLES
-- ================================================

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lease_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

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
    FROM public.tenants
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
    FROM public.lease_agreements
    WHERE tenant_id = (
        SELECT id FROM public.tenants WHERE user_id = auth.uid()
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
    FROM public.lease_agreements
    WHERE tenant_id = (
        SELECT id FROM public.tenants WHERE user_id = auth.uid()
    )
    AND lease_status = 'active';
$$;

-- ================================================
-- STEP 3: USER ROLES POLICIES
-- ================================================

-- Consolidated SELECT policy for all authenticated users
CREATE POLICY "Authenticated users can read user roles"
    ON public.user_roles
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
    ON public.user_roles
    FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

-- Admins can update roles
CREATE POLICY "Admins can update roles"
    ON public.user_roles
    FOR UPDATE
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- Admins can delete roles
CREATE POLICY "Admins can delete roles"
    ON public.user_roles
    FOR DELETE
    TO authenticated
    USING (is_admin());

-- ================================================
-- STEP 4: PROPERTIES POLICIES
-- ================================================

-- Policy for landlords and admins: see all properties (no subquery on lease_agreements)
CREATE POLICY "Landlords can read all properties"
    ON public.properties
    FOR SELECT
    TO authenticated
    USING (is_landlord());

-- Policy for tenants: see properties they are currently leasing
-- Uses SECURITY DEFINER wrapper to avoid permission errors on lease_agreements
CREATE POLICY "Tenants can read their leased properties"
    ON public.properties
    FOR SELECT
    TO authenticated
    USING (id = ANY(get_tenant_visible_property_ids()));

-- Landlords can insert properties
CREATE POLICY "Landlords can insert properties"
    ON public.properties
    FOR INSERT
    TO authenticated
    WITH CHECK (is_landlord());

-- Landlords can update properties
CREATE POLICY "Landlords can update properties"
    ON public.properties
    FOR UPDATE
    TO authenticated
    USING (is_landlord())
    WITH CHECK (is_landlord());

-- Landlords can delete properties
CREATE POLICY "Landlords can delete properties"
    ON public.properties
    FOR DELETE
    TO authenticated
    USING (is_landlord());

-- ================================================
-- STEP 5: TENANTS POLICIES
-- ================================================

-- Consolidated SELECT policy for all authenticated users
CREATE POLICY "Authenticated users can read tenants"
    ON public.tenants
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
    ON public.tenants
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
    ON public.tenants
    FOR INSERT
    TO authenticated
    WITH CHECK (is_landlord());

-- Landlords can delete tenants
CREATE POLICY "Landlords can delete tenants"
    ON public.tenants
    FOR DELETE
    TO authenticated
    USING (is_landlord());

-- ================================================
-- STEP 6: LEASE AGREEMENTS POLICIES
-- ================================================

-- Consolidated SELECT policy for all authenticated users
CREATE POLICY "Authenticated users can read leases"
    ON public.lease_agreements
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
    ON public.lease_agreements
    FOR INSERT
    TO authenticated
    WITH CHECK (is_landlord());

-- Landlords can update leases
CREATE POLICY "Landlords can update leases"
    ON public.lease_agreements
    FOR UPDATE
    TO authenticated
    USING (is_landlord())
    WITH CHECK (is_landlord());

-- Landlords can delete leases
CREATE POLICY "Landlords can delete leases"
    ON public.lease_agreements
    FOR DELETE
    TO authenticated
    USING (is_landlord());

-- ================================================
-- STEP 7: ATTACHMENTS POLICIES
-- ================================================

-- Consolidated SELECT policy for all authenticated users
CREATE POLICY "Authenticated users can read attachments"
    ON public.attachments
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
    ON public.attachments
    FOR INSERT
    TO authenticated
    WITH CHECK (is_landlord());

-- Landlords can update attachments
CREATE POLICY "Landlords can update attachments"
    ON public.attachments
    FOR UPDATE
    TO authenticated
    USING (is_landlord())
    WITH CHECK (is_landlord());

-- Landlords can delete attachments
CREATE POLICY "Landlords can delete attachments"
    ON public.attachments
    FOR DELETE
    TO authenticated
    USING (is_landlord());

-- ================================================
-- STEP 8: TRANSACTIONS POLICIES
-- ================================================

-- Consolidated SELECT policy for all authenticated users
-- Tenants see transactions linked to any of their leases (past or present).
-- Property-level transactions (lease_id IS NULL) are landlord-only — no tenant access.
CREATE POLICY "Authenticated users can read transactions"
    ON public.transactions
    FOR SELECT
    TO authenticated
    USING (
        is_landlord()
        OR
        lease_id = ANY(get_tenant_lease_ids())
    );

-- Landlords can insert transactions
CREATE POLICY "Landlords can insert transactions"
    ON public.transactions
    FOR INSERT
    TO authenticated
    WITH CHECK (is_landlord());

-- Landlords can update transactions
CREATE POLICY "Landlords can update transactions"
    ON public.transactions
    FOR UPDATE
    TO authenticated
    USING (is_landlord())
    WITH CHECK (is_landlord());

-- Landlords can delete transactions
CREATE POLICY "Landlords can delete transactions"
    ON public.transactions
    FOR DELETE
    TO authenticated
    USING (is_landlord());

-- ================================================
-- STEP 9: TABLE PRIVILEGES (GRANTS)
-- ================================================
-- DML privileges for PostgREST (authenticated / anon roles).
-- RLS policies still enforce row-level access — these grants only
-- allow PostgREST to attempt the query; RLS decides which rows are visible.

-- ── Domain tables: full DML for authenticated ──────
-- anon is granted alongside authenticated for consistency with Supabase
-- defaults; all RLS policies are TO authenticated, so anon sees no rows.
GRANT SELECT, INSERT, UPDATE, DELETE
    ON public.properties,
           public.tenants,
           public.lease_agreements,
           public.attachments,
           public.transactions
    TO authenticated, anon;

-- ── user_roles: DML for authenticated only ─────────
-- anon is explicitly revoked above; authenticated needs DML for admin
-- role management via API.
GRANT SELECT, INSERT, UPDATE, DELETE
    ON public.user_roles
    TO authenticated;

