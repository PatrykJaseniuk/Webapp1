-- ================================================
-- RENTAL MANAGEMENT SYSTEM - CONSTRAINTS
-- ================================================
-- Data validation constraints to ensure data integrity
-- Business rule enforcement at database level

-- PROPERTIES CONSTRAINTS
-- Ensure rent and deposit amounts are positive
ALTER TABLE public.properties 
    ADD CONSTRAINT check_positive_rent 
    CHECK (monthly_rent > 0);

ALTER TABLE public.properties 
    ADD CONSTRAINT check_positive_deposit 
    CHECK (deposit_amount >= 0);

-- TENANTS CONSTRAINTS
-- Ensure unique email addresses
ALTER TABLE public.tenants 
    ADD CONSTRAINT unique_tenant_email 
    UNIQUE (email);

-- LEASE AGREEMENTS CONSTRAINTS
-- Ensure end date is after or equal to start date
ALTER TABLE public.lease_agreements 
    ADD CONSTRAINT check_lease_dates 
    CHECK (end_date IS NULL OR end_date >= start_date);

-- Ensure rent and deposit are positive
ALTER TABLE public.lease_agreements 
    ADD CONSTRAINT check_lease_positive_rent 
    CHECK (monthly_rent > 0);

ALTER TABLE public.lease_agreements 
    ADD CONSTRAINT check_lease_positive_deposit 
    CHECK (deposit_amount >= 0);

-- Prevent multiple active leases for the same property
-- Note: This is enforced via triggers in functions_triggers.sql

-- BILLING ITEMS CONSTRAINTS
-- Ensure due date is not in the far past (sanity check)
ALTER TABLE public.billing_items 
    ADD CONSTRAINT check_billing_due_date 
    CHECK (due_date >= '2020-01-01'::date);

-- PAYMENTS CONSTRAINTS
-- Ensure payment amounts are positive
ALTER TABLE public.payments 
    ADD CONSTRAINT check_positive_payment 
    CHECK (amount > 0);

-- Ensure payment date is not in the future (sanity check)
ALTER TABLE public.payments 
    ADD CONSTRAINT check_payment_date 
    CHECK (payment_date <= CURRENT_DATE + INTERVAL '1 day');

-- METERS CONSTRAINTS
-- Ensure unique meter numbers per property
ALTER TABLE public.meters 
    ADD CONSTRAINT unique_meter_per_property 
    UNIQUE (property_id, meter_number);

-- METER READINGS CONSTRAINTS
-- Ensure reading values are non-negative
ALTER TABLE public.meter_readings 
    ADD CONSTRAINT check_positive_reading 
    CHECK (reading_value >= 0);

-- Ensure reading date is not in the far future
ALTER TABLE public.meter_readings 
    ADD CONSTRAINT check_reading_date 
    CHECK (reading_date <= CURRENT_DATE + INTERVAL '1 day');

-- UTILITY BILLS CONSTRAINTS
-- Ensure consumption is non-negative
ALTER TABLE public.utility_bills 
    ADD CONSTRAINT check_positive_consumption 
    CHECK (consumption >= 0);

-- Ensure unit price is positive
ALTER TABLE public.utility_bills 
    ADD CONSTRAINT check_positive_unit_price 
    CHECK (unit_price > 0);

-- Ensure total amount matches calculation (with small tolerance for rounding)
ALTER TABLE public.utility_bills 
    ADD CONSTRAINT check_total_calculation 
    CHECK (ABS(total_amount - (consumption * unit_price)) < 0.02);

-- Ensure billing period end is after start
ALTER TABLE public.utility_bills 
    ADD CONSTRAINT check_billing_period 
    CHECK (billing_period_end > billing_period_start);

-- UTILITY PRICES CONSTRAINTS
-- Ensure price is positive
ALTER TABLE public.utility_prices 
    ADD CONSTRAINT check_positive_price 
    CHECK (price_per_unit > 0);

-- Ensure effective date is not in the far future
ALTER TABLE public.utility_prices 
    ADD CONSTRAINT check_effective_date 
    CHECK (effective_date <= CURRENT_DATE + INTERVAL '1 year');

-- PROPERTY EXPENSES CONSTRAINTS
-- Ensure expense amounts are positive
ALTER TABLE public.property_expenses 
    ADD CONSTRAINT check_positive_expense 
    CHECK (amount > 0);

-- Ensure expense date is not in the far future
ALTER TABLE public.property_expenses 
    ADD CONSTRAINT check_expense_date 
    CHECK (expense_date <= CURRENT_DATE + INTERVAL '1 day');
