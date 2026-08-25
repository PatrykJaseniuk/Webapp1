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
FROM public.lease_agreement la
JOIN public.tenant t ON la.tenant_id = t.id
JOIN public.property p ON la.property_id = p.id
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
FROM public.property p
LEFT JOIN public.lease_agreement la ON p.id = la.property_id AND la.lease_status = 'active'
LEFT JOIN public.tenant t ON la.tenant_id = t.id;

-- ================================================
-- VIEW 3: LEASE BALANCE
-- ================================================
-- Outstanding balance per lease (ALL statuses — debt of an ended lease must not
-- disappear from reporting). Derived from the signed ledger: charges (negative)
-- offset by payments (positive).
--
-- Ageing uses FIFO allocation over value_date instead of a stored paid flag:
-- credits are applied to the oldest charges first, so a charge stops being
-- counted as overdue as soon as enough credit has arrived.
-- SECURITY INVOKER: Respects RLS policies of querying user

CREATE VIEW public.lease_balance
WITH (security_invoker = true) AS
WITH charge_ageing AS (
    SELECT
        fe.lease_id,
        fe.value_date,
        SUM(-fe.amount) OVER (
            PARTITION BY fe.lease_id
            ORDER BY fe.value_date, fe.id
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS cumulative_charged
    FROM public.financial_entry fe
    WHERE fe.lease_id IS NOT NULL
      AND fe.amount < 0
),
lease_credits AS (
    SELECT
        fe.lease_id,
        COALESCE(SUM(fe.amount), 0) AS total_credited
    FROM public.financial_entry fe
    WHERE fe.lease_id IS NOT NULL
      AND fe.amount > 0
    GROUP BY fe.lease_id
),
uncovered_charges AS (
    SELECT
        ca.lease_id,
        MIN(ca.value_date) AS earliest_unpaid_value_date,
        COUNT(*) FILTER (WHERE ca.value_date < CURRENT_DATE) AS overdue_items_count
    FROM charge_ageing ca
    LEFT JOIN lease_credits lc ON lc.lease_id = ca.lease_id
    WHERE ca.cumulative_charged > COALESCE(lc.total_credited, 0)
    GROUP BY ca.lease_id
)
SELECT
    la.id as lease_id,
    la.tenant_id,
    la.property_id,
    la.lease_status,
    t.first_name || ' ' || t.last_name as tenant_name,
    p.name as property_name,
    COALESCE(SUM(fe.amount), 0) as balance,
    GREATEST(0, -COALESCE(SUM(fe.amount), 0)) as total_unpaid_amount,
    -- Deposit cash still in hand: lease cash legs that are NOT income
    -- (treasury set, property unset) — deposits in minus deposits returned.
    COALESCE(SUM(fe.amount) FILTER (
        WHERE fe.treasury_id IS NOT NULL AND fe.property_id IS NULL), 0) as deposit_held,
    uc.earliest_unpaid_value_date,
    COALESCE(uc.overdue_items_count, 0) as overdue_items_count
FROM public.lease_agreement la
JOIN public.tenant t ON la.tenant_id = t.id
JOIN public.property p ON la.property_id = p.id
LEFT JOIN public.financial_entry fe ON la.id = fe.lease_id
LEFT JOIN uncovered_charges uc ON uc.lease_id = la.id
GROUP BY la.id, t.first_name, t.last_name, p.name,
         uc.earliest_unpaid_value_date, uc.overdue_items_count;

-- ================================================
-- VIEW 4: LEASE CLOSING STATEMENT
-- ================================================
-- Everything needed to settle a lease:
--   deposit_charged     — contractual amount (linked entry: deposit_entry_id)
--   deposit_paid        — deposit cash actually received
--   deposit_held        — deposit cash received minus deposit cash returned
--   deposit_released    — part returned to the tenant   (set at settlement)
--   deposit_retained    — part granted to the property  (set at settlement)
--   deposit_outstanding — still owed back to the tenant (held minus retained)
-- SECURITY INVOKER: Respects RLS policies of querying user

CREATE VIEW public.lease_closing_statement
WITH (security_invoker = true) AS
SELECT
    la.id as lease_id,
    la.tenant_id,
    la.property_id,
    la.lease_status,
    la.deposit_entry_id,
    t.first_name || ' ' || t.last_name as tenant_name,
    p.name as property_name,
    la.deposit_amount as deposit_charged,
    COALESCE(SUM(fe.amount) FILTER (
        WHERE fe.treasury_id IS NOT NULL AND fe.property_id IS NULL AND fe.amount > 0), 0) as deposit_paid,
    COALESCE(SUM(fe.amount) FILTER (
        WHERE fe.treasury_id IS NOT NULL AND fe.property_id IS NULL), 0) as deposit_held,
    la.deposit_released,
    la.deposit_retained,
    COALESCE(SUM(fe.amount) FILTER (
        WHERE fe.treasury_id IS NOT NULL AND fe.property_id IS NULL), 0)
        - COALESCE(la.deposit_retained, 0) as deposit_outstanding,
    GREATEST(0, -COALESCE(SUM(fe.amount), 0)) as arrears,
    COALESCE(SUM(fe.amount), 0) as lease_balance
FROM public.lease_agreement la
JOIN public.tenant t ON la.tenant_id = t.id
JOIN public.property p ON la.property_id = p.id
LEFT JOIN public.financial_entry fe ON la.id = fe.lease_id
GROUP BY la.id, t.first_name, t.last_name, p.name;

-- ================================================
-- VIEW 5: DEPOSIT OBLIGATION
-- ================================================
-- Deposits still owed on leases that are no longer active — the operational
-- "who do we still have to pay back" list.

CREATE VIEW public.deposit_obligation
WITH (security_invoker = true) AS
SELECT
    lease_id,
    tenant_id,
    tenant_name,
    property_name,
    lease_status,
    deposit_charged,
    deposit_held,
    deposit_retained,
    deposit_outstanding
FROM public.lease_closing_statement
WHERE lease_status <> 'active'
  AND deposit_outstanding <> 0;

-- ================================================
-- VIEW 6: PROPERTY FINANCIAL SUMMARY
-- ================================================
-- Income and expenses per property, derived from the signed ledger.
-- Income = positive amounts; expenses = negative amounts.
-- Rent reaches the property because a rent payment is tagged
-- (lease + property + treasury); deposits never carry property_id and are
-- therefore correctly excluded from income.
-- SECURITY INVOKER: Respects RLS policies of querying user

CREATE VIEW public.property_financial_summary
WITH (security_invoker = true) AS
SELECT
    p.id as property_id,
    p.name as property_name,
    p.address,
    COALESCE(SUM(CASE WHEN fe.amount > 0 THEN fe.amount ELSE 0 END), 0) as total_income,
    COALESCE(SUM(CASE WHEN fe.amount < 0 THEN ABS(fe.amount) ELSE 0 END), 0) as total_expenses,
    COALESCE(SUM(fe.amount), 0) as net_profit,
    p.property_status,
    p.monthly_rent
FROM public.property p
LEFT JOIN public.financial_entry fe ON p.id = fe.property_id
GROUP BY p.id;

-- ================================================
-- VIEW 7: TREASURY BALANCE
-- ================================================
-- Cash on hand per treasury — reconcilable against a bank statement.
-- SECURITY INVOKER: Respects RLS policies of querying user

CREATE VIEW public.treasury_balance
WITH (security_invoker = true) AS
SELECT
    tr.id as treasury_id,
    tr.name as treasury_name,
    tr.is_active,
    COALESCE(SUM(fe.amount), 0) as balance,
    COUNT(fe.id) as entry_count,
    MAX(fe.value_date) as last_value_date
FROM public.treasury tr
LEFT JOIN public.financial_entry fe ON tr.id = fe.treasury_id
GROUP BY tr.id;

-- ================================================
-- VIEW 8: FINANCIAL ENTRY REVIEW
-- ================================================
-- Data-quality worklist. The posting rule cannot be fully enforced by
-- constraints (intent is not stored), so shapes that are legal but frequently
-- indicate a mistake are surfaced for review instead of being forbidden.

CREATE VIEW public.financial_entry_review
WITH (security_invoker = true) AS
SELECT *
FROM (
    SELECT
        fe.id,
        fe.lease_id,
        fe.property_id,
        fe.treasury_id,
        fe.description,
        fe.amount,
        fe.value_date,
        CASE
            WHEN fe.lease_id IS NOT NULL AND fe.treasury_id IS NOT NULL
                 AND fe.property_id IS NULL AND fe.amount > 0
                THEN 'lease cash-in without property: deposit receipt, or a rent payment missing property_id'
            WHEN fe.lease_id IS NULL AND fe.property_id IS NULL
                THEN 'treasury-only movement: not attributed to a property or a lease'
            WHEN fe.property_id IS NOT NULL AND fe.treasury_id IS NULL
                THEN 'property reclassification without cash movement'
            ELSE NULL
        END as review_reason
    FROM public.financial_entry fe
) flagged
WHERE flagged.review_reason IS NOT NULL;

-- ================================================
-- VIEW 9: DASHBOARD SUMMARY
-- ================================================
-- Single-row aggregate for the dashboards. Money is summed in SQL (numeric),
-- never accumulated as floating point in the client.
-- SECURITY INVOKER: every subquery is filtered by the caller's RLS, so a tenant
-- sees only their own leases and no treasury rows at all.

CREATE VIEW public.dashboard_summary
WITH (security_invoker = true) AS
SELECT
    (SELECT COUNT(*) FROM public.property) as total_properties,
    (SELECT COUNT(*) FROM public.property WHERE property_status = 'occupied') as occupied_properties,
    (SELECT COUNT(*) FROM public.tenant) as total_tenants,
    (SELECT COUNT(*) FROM public.tenant WHERE tenant_status = 'active') as active_tenants,
    (SELECT COUNT(*) FROM public.lease_agreement WHERE lease_status = 'active') as active_leases,
    (SELECT COALESCE(SUM(total_unpaid_amount), 0) FROM public.lease_balance) as total_unpaid_amount,
    (SELECT COALESCE(SUM(overdue_items_count), 0) FROM public.lease_balance) as overdue_items,
    (SELECT COALESCE(SUM(balance), 0) FROM public.treasury_balance) as cash_on_hand;

-- ================================================
-- VIEW PRIVILEGES (GRANTS)
-- ================================================
-- Views are security_invoker = true, so RLS policies of the
-- querying user apply. Grant SELECT to authenticated / anon so
-- PostgREST can attempt the query; RLS decides which rows are visible.
GRANT SELECT
    ON public.active_leases,
           public.property_occupancy,
           public.lease_balance,
           public.lease_closing_statement,
           public.deposit_obligation,
           public.property_financial_summary,
           public.treasury_balance,
           public.financial_entry_review,
           public.dashboard_summary
    TO authenticated, anon;

