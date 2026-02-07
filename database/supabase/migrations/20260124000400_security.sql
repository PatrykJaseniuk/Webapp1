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
ALTER TABLE public.billing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meter_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utility_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utility_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_expenses ENABLE ROW LEVEL SECURITY;

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

-- Users can read their own role
CREATE POLICY "Users can read own role"
    ON public.user_roles
    FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- Admins can read all roles
CREATE POLICY "Admins can read all roles"
    ON public.user_roles
    FOR SELECT
    TO authenticated
    USING (is_admin());

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

-- Landlords have full access to properties
CREATE POLICY "Landlords full access to properties"
    ON public.properties
    FOR ALL
    TO authenticated
    USING (is_landlord())
    WITH CHECK (is_landlord());

-- Tenants can read properties they are currently leasing
CREATE POLICY "Tenants can read their leased properties"
    ON public.properties
    FOR SELECT
    TO authenticated
    USING (
        id IN (
            SELECT property_id 
            FROM public.lease_agreements 
            WHERE tenant_id = get_current_tenant_id() 
            AND status = 'active'
        )
    );

-- ================================================
-- STEP 5: TENANTS POLICIES
-- ================================================

-- Landlords have full access to tenants
CREATE POLICY "Landlords full access to tenants"
    ON public.tenants
    FOR ALL
    TO authenticated
    USING (is_landlord())
    WITH CHECK (is_landlord());

-- Tenants can read their own data
CREATE POLICY "Tenants can read own data"
    ON public.tenants
    FOR SELECT
    TO authenticated
    USING (user_id = (SELECT auth.uid()));

-- Tenants can update their own contact information
CREATE POLICY "Tenants can update own contact"
    ON public.tenants
    FOR UPDATE
    TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- ================================================
-- STEP 6: LEASE AGREEMENTS POLICIES
-- ================================================

-- Landlords have full access to leases
CREATE POLICY "Landlords full access to leases"
    ON public.lease_agreements
    FOR ALL
    TO authenticated
    USING (is_landlord())
    WITH CHECK (is_landlord());

-- Tenants can read their own leases
CREATE POLICY "Tenants can read own leases"
    ON public.lease_agreements
    FOR SELECT
    TO authenticated
    USING (tenant_id = get_current_tenant_id());

-- ================================================
-- STEP 7: ATTACHMENTS POLICIES
-- ================================================

-- Landlords have full access to attachments
CREATE POLICY "Landlords full access to attachments"
    ON public.attachments
    FOR ALL
    TO authenticated
    USING (is_landlord())
    WITH CHECK (is_landlord());

-- Tenants can read attachments related to their leases
CREATE POLICY "Tenants can read lease attachments"
    ON public.attachments
    FOR SELECT
    TO authenticated
    USING (
        related_to_type = 'lease' AND
        related_to_id IN (
            SELECT id FROM public.lease_agreements 
            WHERE tenant_id = get_current_tenant_id()
        )
    );

-- Tenants can read meter reading attachments for their properties
CREATE POLICY "Tenants can read meter reading attachments"
    ON public.attachments
    FOR SELECT
    TO authenticated
    USING (
        related_to_type = 'meter_reading' AND
        related_to_id IN (
            SELECT mr.id 
            FROM public.meter_readings mr
            JOIN public.meters m ON mr.meter_id = m.id
            JOIN public.lease_agreements la ON m.property_id = la.property_id
            WHERE la.tenant_id = get_current_tenant_id() 
            AND la.status = 'active'
        )
    );

-- ================================================
-- STEP 8: BILLING ITEMS POLICIES
-- ================================================

-- Landlords have full access to billing items
CREATE POLICY "Landlords full access to billing"
    ON public.billing_items
    FOR ALL
    TO authenticated
    USING (is_landlord())
    WITH CHECK (is_landlord());

-- Tenants can read their own billing items
CREATE POLICY "Tenants can read own billing"
    ON public.billing_items
    FOR SELECT
    TO authenticated
    USING (
        lease_id IN (
            SELECT id FROM public.lease_agreements 
            WHERE tenant_id = get_current_tenant_id()
        )
    );

-- ================================================
-- STEP 9: PAYMENTS POLICIES
-- ================================================

-- Landlords have full access to payments
CREATE POLICY "Landlords full access to payments"
    ON public.payments
    FOR ALL
    TO authenticated
    USING (is_landlord())
    WITH CHECK (is_landlord());

-- Tenants can read their own payments
CREATE POLICY "Tenants can read own payments"
    ON public.payments
    FOR SELECT
    TO authenticated
    USING (
        billing_item_id IN (
            SELECT bi.id FROM public.billing_items bi
            JOIN public.lease_agreements la ON bi.lease_id = la.id
            WHERE la.tenant_id = get_current_tenant_id()
        )
    );

-- ================================================
-- STEP 10: METERS POLICIES
-- ================================================

-- Landlords have full access to meters
CREATE POLICY "Landlords full access to meters"
    ON public.meters
    FOR ALL
    TO authenticated
    USING (is_landlord())
    WITH CHECK (is_landlord());

-- Tenants can read meters for their leased properties
CREATE POLICY "Tenants can read property meters"
    ON public.meters
    FOR SELECT
    TO authenticated
    USING (
        property_id IN (
            SELECT property_id FROM public.lease_agreements 
            WHERE tenant_id = get_current_tenant_id() 
            AND status = 'active'
        )
    );

-- ================================================
-- STEP 11: METER READINGS POLICIES
-- ================================================

-- Landlords have full access to meter readings
CREATE POLICY "Landlords full access to meter readings"
    ON public.meter_readings
    FOR ALL
    TO authenticated
    USING (is_landlord())
    WITH CHECK (is_landlord());

-- Tenants can read meter readings for their properties
CREATE POLICY "Tenants can read own meter readings"
    ON public.meter_readings
    FOR SELECT
    TO authenticated
    USING (
        meter_id IN (
            SELECT m.id FROM public.meters m
            JOIN public.lease_agreements la ON m.property_id = la.property_id
            WHERE la.tenant_id = get_current_tenant_id() 
            AND la.status = 'active'
        )
    );

-- ================================================
-- STEP 12: UTILITY BILLS POLICIES
-- ================================================

-- Landlords have full access to utility bills
CREATE POLICY "Landlords full access to utility bills"
    ON public.utility_bills
    FOR ALL
    TO authenticated
    USING (is_landlord())
    WITH CHECK (is_landlord());

-- Tenants can read their own utility bills
CREATE POLICY "Tenants can read own utility bills"
    ON public.utility_bills
    FOR SELECT
    TO authenticated
    USING (
        lease_id IN (
            SELECT id FROM public.lease_agreements 
            WHERE tenant_id = get_current_tenant_id()
        )
    );

-- ================================================
-- STEP 13: UTILITY PRICES POLICIES
-- ================================================

-- Landlords can manage utility prices
CREATE POLICY "Landlords full access to utility prices"
    ON public.utility_prices
    FOR ALL
    TO authenticated
    USING (is_landlord())
    WITH CHECK (is_landlord());

-- Tenants can read utility prices (transparency)
CREATE POLICY "Tenants can read utility prices"
    ON public.utility_prices
    FOR SELECT
    TO authenticated
    USING (true);

-- ================================================
-- STEP 14: PROPERTY EXPENSES POLICIES
-- ================================================

-- Landlords have full access to property expenses
CREATE POLICY "Landlords full access to expenses"
    ON public.property_expenses
    FOR ALL
    TO authenticated
    USING (is_landlord())
    WITH CHECK (is_landlord());

-- Tenants cannot see expenses (private landlord data)
