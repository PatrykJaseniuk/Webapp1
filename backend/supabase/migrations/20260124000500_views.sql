-- ================================================
-- RENTAL MANAGEMENT SYSTEM - VIEWS
-- ================================================
-- Computed views for common queries and aggregations
-- Simplifies complex queries for the application layer

-- ================================================
-- VIEW 1: ACTIVE LEASES WITH DETAILS
-- ================================================
-- Shows active leases with tenant and property information
-- SECURITY INVOKER: Respects RLS policies of querying user

CREATE VIEW public.active_leases 
WITH (security_invoker = true) AS
SELECT 
    la.*,
    t.first_name || ' ' || t.last_name as tenant_name,
    t.email as tenant_email,
    t.phone as tenant_phone,
    p.name as property_name,
    p.address as property_address,
    p.property_type,
    CURRENT_DATE - la.start_date as days_active,
    CASE 
        WHEN la.end_date IS NOT NULL 
        THEN la.end_date - CURRENT_DATE 
        ELSE NULL 
    END as days_until_end
FROM public.lease_agreements la
JOIN public.tenants t ON la.tenant_id = t.id
JOIN public.properties p ON la.property_id = p.id
WHERE la.lease_status = 'active';

-- ================================================
-- VIEW 2: PROPERTY OCCUPANCY STATUS
-- ================================================
-- Shows property status with current lease information
-- SECURITY INVOKER: Respects RLS policies of querying user

CREATE VIEW public.property_occupancy 
WITH (security_invoker = true) AS
SELECT 
    p.*,
    la.id as current_lease_id,
    la.tenant_id,
    t.first_name || ' ' || t.last_name as current_tenant_name,
    la.start_date as lease_start,
    la.end_date as lease_end,
    la.monthly_rent as current_rent
FROM public.properties p
LEFT JOIN public.lease_agreements la ON p.id = la.property_id AND la.lease_status = 'active'
LEFT JOIN public.tenants t ON la.tenant_id = t.id;

-- ================================================
-- VIEW 3: LEASE BALANCE SUMMARY
-- ================================================
-- Shows outstanding balance per active lease.
-- Derived from the signed ledger: charges (negative) offset by payments (positive).
-- SECURITY INVOKER: Respects RLS policies of querying user

CREATE VIEW public.unpaid_transactions_summary 
WITH (security_invoker = true) AS
SELECT 
    la.id as lease_id,
    la.tenant_id,
    la.property_id,
    t.first_name || ' ' || t.last_name as tenant_name,
    p.name as property_name,
    COALESCE(SUM(tr.amount), 0) as balance,
    GREATEST(0, -COALESCE(SUM(tr.amount), 0)) as total_unpaid_amount,
    MIN(tr.due_date) as earliest_due_date,
    COUNT(CASE WHEN tr.amount < 0 AND tr.due_date < CURRENT_DATE THEN 1 END) as overdue_items_count
FROM public.lease_agreements la
JOIN public.tenants t ON la.tenant_id = t.id
JOIN public.properties p ON la.property_id = p.id
LEFT JOIN public.transactions tr ON la.id = tr.lease_id
WHERE la.lease_status = 'active'
GROUP BY la.id, la.tenant_id, la.property_id, t.first_name, t.last_name, p.name;

-- ================================================
-- VIEW 4: PROPERTY FINANCIAL SUMMARY
-- ================================================
-- Shows income and expenses per property, derived from the signed ledger.
-- SECURITY INVOKER: Respects RLS policies of querying user
-- Income = positive amounts (payments/income); expenses = negative amounts.

CREATE VIEW public.property_financial_summary 
WITH (security_invoker = true) AS
SELECT 
    p.id as property_id,
    p.name as property_name,
    p.address,
    COALESCE(SUM(CASE WHEN tr.amount > 0 THEN tr.amount ELSE 0 END), 0) as total_income,
    COALESCE(SUM(CASE WHEN tr.amount < 0 THEN ABS(tr.amount) ELSE 0 END), 0) as total_expenses,
    COALESCE(SUM(tr.amount), 0) as net_profit,
    p.property_status,
    p.monthly_rent
FROM public.properties p
LEFT JOIN public.transactions tr ON p.id = tr.property_id
GROUP BY p.id;

-- ================================================
-- VIEW PRIVILEGES (GRANTS)
-- ================================================
-- Views are security_invoker = true, so RLS policies of the
-- querying user apply. Grant SELECT to authenticated / anon so
-- PostgREST can attempt the query; RLS decides which rows are visible.
GRANT SELECT
    ON public.active_leases,
           public.property_occupancy,
           public.unpaid_transactions_summary,
           public.property_financial_summary
    TO authenticated, anon;

