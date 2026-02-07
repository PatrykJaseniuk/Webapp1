-- ================================================
-- RENTAL MANAGEMENT SYSTEM - VIEWS
-- ================================================
-- Computed views for common queries and aggregations
-- Simplifies complex queries for the application layer

-- ================================================
-- VIEW 1: BILLING WITH PAYMENTS
-- ================================================
-- Shows billing items with payment status and balance
-- SECURITY INVOKER: Respects RLS policies of querying user

CREATE VIEW public.billing_with_payments 
WITH (security_invoker = true) AS
SELECT 
    bi.*,
    COALESCE(SUM(p.amount), 0) as total_paid,
    bi.amount - COALESCE(SUM(p.amount), 0) as balance,
    CASE 
        WHEN bi.amount - COALESCE(SUM(p.amount), 0) <= 0 THEN true
        ELSE false
    END as is_fully_paid
FROM public.billing_items bi
LEFT JOIN public.payments p ON p.billing_item_id = bi.id
GROUP BY bi.id;

-- ================================================
-- VIEW 2: ACTIVE LEASES WITH DETAILS
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
WHERE la.status = 'active';

-- ================================================
-- VIEW 3: PROPERTY OCCUPANCY STATUS
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
LEFT JOIN public.lease_agreements la ON p.id = la.property_id AND la.status = 'active'
LEFT JOIN public.tenants t ON la.tenant_id = t.id;

-- ================================================
-- VIEW 4: UNPAID BILLING SUMMARY
-- ================================================
-- Shows unpaid and overdue billing items per lease
-- SECURITY INVOKER: Respects RLS policies of querying user

CREATE VIEW public.unpaid_billing_summary 
WITH (security_invoker = true) AS
SELECT 
    la.id as lease_id,
    la.tenant_id,
    la.property_id,
    t.first_name || ' ' || t.last_name as tenant_name,
    p.name as property_name,
    COUNT(bi.id) as unpaid_items_count,
    SUM(bi.amount) as total_unpaid_amount,
    MIN(bi.due_date) as earliest_due_date,
    COUNT(CASE WHEN bi.status = 'overdue' THEN 1 END) as overdue_items_count,
    SUM(CASE WHEN bi.status = 'overdue' THEN bi.amount ELSE 0 END) as total_overdue_amount
FROM public.lease_agreements la
JOIN public.tenants t ON la.tenant_id = t.id
JOIN public.properties p ON la.property_id = p.id
LEFT JOIN public.billing_items bi ON la.id = bi.lease_id AND bi.status IN ('pending', 'overdue')
WHERE la.status = 'active'
GROUP BY la.id, la.tenant_id, la.property_id, t.first_name, t.last_name, p.name;

-- ================================================
-- VIEW 5: LATEST METER READINGS
-- ================================================
-- Shows the most recent meter reading for each meter
-- SECURITY INVOKER: Respects RLS policies of querying user

CREATE VIEW public.latest_meter_readings 
WITH (security_invoker = true) AS
SELECT DISTINCT ON (mr.meter_id)
    mr.*,
    m.meter_type,
    m.meter_number,
    m.unit,
    m.property_id,
    p.name as property_name
FROM public.meter_readings mr
JOIN public.meters m ON mr.meter_id = m.id
JOIN public.properties p ON m.property_id = p.id
ORDER BY mr.meter_id, mr.reading_date DESC, mr.created_at DESC;

-- ================================================
-- VIEW 6: PROPERTY FINANCIAL SUMMARY
-- ================================================
-- Shows income and expenses per property
-- SECURITY INVOKER: Respects RLS policies of querying user

CREATE VIEW public.property_financial_summary 
WITH (security_invoker = true) AS
SELECT 
    p.id as property_id,
    p.name as property_name,
    p.address,
    -- Income from rent
    COALESCE(SUM(CASE WHEN py.payment_date IS NOT NULL THEN py.amount ELSE 0 END), 0) as total_income,
    -- Expenses
    COALESCE(SUM(pe.amount), 0) as total_expenses,
    -- Net profit/loss
    COALESCE(SUM(CASE WHEN py.payment_date IS NOT NULL THEN py.amount ELSE 0 END), 0) - COALESCE(SUM(pe.amount), 0) as net_profit,
    -- Current lease status
    p.status,
    p.monthly_rent
FROM public.properties p
LEFT JOIN public.lease_agreements la ON p.id = la.property_id
LEFT JOIN public.billing_items bi ON la.id = bi.lease_id
LEFT JOIN public.payments py ON bi.id = py.billing_item_id
LEFT JOIN public.property_expenses pe ON p.id = pe.property_id
GROUP BY p.id;
