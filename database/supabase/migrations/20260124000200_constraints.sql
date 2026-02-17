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

-- TRANSACTIONS CONSTRAINTS
-- Ensure at least one reference is set (lease_id or property_id)
ALTER TABLE public.transactions 
    ADD CONSTRAINT check_transaction_reference 
    CHECK (lease_id IS NOT NULL OR property_id IS NOT NULL);

-- Note: Lease-property consistency is enforced via trigger in functions_triggers.sql
-- PostgreSQL does not allow subqueries in CHECK constraints

-- Ensure due date is not in the far past (sanity check)
ALTER TABLE public.transactions 
    ADD CONSTRAINT check_transaction_due_date 
    CHECK (due_date >= '2020-01-01'::date);

-- Amount sign must match transaction type
-- Income types (payment, other) must have positive amounts
-- Expense types (rent, utility, expense, withdraw, fee) must have negative amounts
ALTER TABLE public.transactions 
    ADD CONSTRAINT check_transaction_amount_sign 
    CHECK (
        (type IN ('payment', 'other') AND amount > 0) OR
        (type IN ('rent', 'utility', 'expense', 'withdraw', 'fee') AND amount < 0)
    );
