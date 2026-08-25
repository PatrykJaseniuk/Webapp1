-- ================================================
-- RENTAL MANAGEMENT SYSTEM - CONSTRAINTS
-- ================================================
-- Data validation constraints to ensure data integrity
-- Business rule enforcement at database level

-- PROPERTIES CONSTRAINTS
-- Ensure rent and deposit amounts are positive
ALTER TABLE public.property 
    ADD CONSTRAINT check_positive_rent 
    CHECK (monthly_rent > 0);

ALTER TABLE public.property 
    ADD CONSTRAINT check_positive_deposit 
    CHECK (deposit_amount >= 0);

-- TENANTS CONSTRAINTS
-- Ensure unique email addresses
ALTER TABLE public.tenant 
    ADD CONSTRAINT unique_tenant_email 
    UNIQUE (email);

-- LEASE AGREEMENTS CONSTRAINTS
-- Ensure end date is after or equal to start date
ALTER TABLE public.lease_agreement 
    ADD CONSTRAINT check_lease_dates 
    CHECK (end_date IS NULL OR end_date >= start_date);

-- Ensure rent and deposit are positive
ALTER TABLE public.lease_agreement 
    ADD CONSTRAINT check_lease_positive_rent 
    CHECK (monthly_rent > 0);

ALTER TABLE public.lease_agreement 
    ADD CONSTRAINT check_lease_positive_deposit 
    CHECK (deposit_amount >= 0);

-- Prevent multiple active leases for the same property
-- Note: This is enforced via triggers in functions_triggers.sql

-- Deposit settlement: once settled, the returned and retained parts must add up
-- to the contractual deposit amount (the invariant "released + retained = charged").
ALTER TABLE public.lease_agreement
    ADD CONSTRAINT check_deposit_settlement
    CHECK (
        (deposit_released IS NULL AND deposit_retained IS NULL)
        OR (deposit_released IS NOT NULL AND deposit_retained IS NOT NULL
            AND deposit_released >= 0 AND deposit_retained >= 0
            AND deposit_released + deposit_retained = deposit_amount)
    );

-- TREASURIES CONSTRAINTS
ALTER TABLE public.treasury
    ADD CONSTRAINT unique_treasury_name
    UNIQUE (name);

ALTER TABLE public.treasury
    ADD CONSTRAINT check_treasury_name_not_blank
    CHECK (length(trim(name)) > 0);

-- FINANCIAL ENTRIES CONSTRAINTS
-- Ensure at least one reference is set (lease_id, property_id or treasury_id)
ALTER TABLE public.financial_entry
    ADD CONSTRAINT check_entry_reference
    CHECK (lease_id IS NOT NULL OR property_id IS NOT NULL OR treasury_id IS NOT NULL);

-- Note: Lease-property consistency is enforced via trigger in functions_triggers.sql
-- PostgreSQL does not allow subqueries in CHECK constraints

-- Ensure the value date is within a sane range (sanity check, immutable bounds)
ALTER TABLE public.financial_entry
    ADD CONSTRAINT check_entry_value_date
    CHECK (value_date >= '2020-01-01'::date AND value_date < '2100-01-01'::date);

-- Ensure amount is non-zero (an entry always moves value)
ALTER TABLE public.financial_entry
    ADD CONSTRAINT check_entry_amount_nonzero
    CHECK (amount <> 0);

-- Ensure the description carries information
ALTER TABLE public.financial_entry
    ADD CONSTRAINT check_entry_description_not_blank
    CHECK (length(trim(description)) > 0);
