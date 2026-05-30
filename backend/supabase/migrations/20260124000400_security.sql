-- ================================================
-- RENTAL MANAGEMENT SYSTEM - SECURITY
-- ================================================
-- Row Level Security (RLS) setup with helper functions and policies
-- Defines access control for landlords, tenants, and admins

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

-- Get current user's role
-- SECURITY DEFINER bypasses RLS to prevent infinite recursion
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role text;
BEGIN
    SELECT role INTO user_role
    FROM public.user_roles
    WHERE user_id = auth.uid();
    
    RETURN user_role;
END;
$$;

-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN get_user_role() = 'admin';
END;
$$;

-- Check if current user is landlord (moderator role or admin)
CREATE OR REPLACE FUNCTION public.is_landlord()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN get_user_role() IN ('landlord', 'admin');
END;
$$;

-- Get tenant_id for current user
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Consolidated SELECT policy for all authenticated users
CREATE POLICY "Authenticated users can read properties"
    ON public.properties
    FOR SELECT
    TO authenticated
    USING (
        -- Landlords see all properties
        is_landlord()
        OR
        -- Tenants see properties they are currently leasing
        id IN (
            SELECT property_id 
            FROM public.lease_agreements 
            WHERE tenant_id = get_current_tenant_id() 
            AND lease_status = 'active'
        )
    );

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
        -- Landlords see all attachments
        is_landlord()
        OR
        -- Tenants see lease attachments
        (
            related_to_type = 'lease' AND
            related_to_id IN (
                SELECT id FROM public.lease_agreements 
                WHERE tenant_id = get_current_tenant_id()
            )
        )
        OR
        -- Tenants see property attachments for their leased properties
        (
            related_to_type = 'property' AND
            related_to_id IN (
                SELECT property_id FROM public.lease_agreements 
                WHERE tenant_id = get_current_tenant_id() 
                AND lease_status = 'active'
            )
        )
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
CREATE POLICY "Authenticated users can read transactions"
    ON public.transactions
    FOR SELECT
    TO authenticated
    USING (
        -- Landlords see all transactions
        is_landlord()
        OR
        -- Tenants see transactions related to their leases
        (lease_id IN (
            SELECT id FROM public.lease_agreements 
            WHERE tenant_id = get_current_tenant_id()
        ))
        OR
        -- Tenants see property-level transactions for their leased properties
        (lease_id IS NULL AND property_id IN (
            SELECT property_id FROM public.lease_agreements 
            WHERE tenant_id = get_current_tenant_id() 
            AND lease_status = 'active'
        ))
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
