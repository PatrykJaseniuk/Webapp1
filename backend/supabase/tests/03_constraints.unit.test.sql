-- ================================================
-- pgTAP: CHECK CONSTRAINTS
-- ================================================

BEGIN;
SELECT plan(20);

-- ── properties constraints ──────────────────────
SELECT col_has_check('public', 'property', 'monthly_rent', 'props: monthly_rent CHECK');
SELECT col_has_check('public', 'property', 'deposit_amount', 'props: deposit_amount CHECK');

SELECT throws_ok(
    $$ INSERT INTO public.property (name, address, property_type, monthly_rent, deposit_amount, property_status)
       VALUES ('test', 'test addr', 'apartment', -100, 0, 'available') $$,
    '23514'
);

SELECT lives_ok(
    $$ INSERT INTO public.property (name, address, property_type, monthly_rent, deposit_amount, property_status)
       VALUES ('test2', 'test addr2', 'house', 500, 0, 'available') $$,
    'props: deposit_amount >= 0 allows zero'
);

-- ── tenants constraints ─────────────────────────
SELECT col_is_unique('public', 'tenant', 'email', 'tenants.email is UNIQUE');

-- ── lease_agreements constraints ────────────────
-- check_lease_dates is a multi-column CHECK (end_date IS NULL OR end_date >= start_date)
SELECT throws_ok(
    $$ INSERT INTO public.lease_agreement (tenant_id, property_id, start_date, end_date,
        monthly_rent, deposit_amount)
       VALUES ('b0000000-0000-0000-0000-000000000001',
               'a0000000-0000-0000-0000-000000000001',
               '2026-01-01', '2025-12-31', 1000, 500) $$,
    '23514'
);
SELECT col_has_check('public', 'lease_agreement', 'monthly_rent', 'leases: monthly_rent CHECK');
SELECT col_has_check('public', 'lease_agreement', 'deposit_amount', 'leases: deposit_amount CHECK');

SELECT lives_ok(
    $$ INSERT INTO public.lease_agreement (tenant_id, property_id, start_date, end_date,
        monthly_rent, deposit_amount)
       VALUES ('b0000000-0000-0000-0000-000000000001',
               'a0000000-0000-0000-0000-000000000001',
               '2026-01-01', NULL, 1000, 500) $$,
    'leases: NULL end_date allowed'
);

-- ── financial_entry constraints ─────────────────
SELECT throws_ok(
    $$ INSERT INTO public.financial_entry (description, amount, value_date)
       VALUES ('no ref', -100, '2026-01-01') $$,
    '23514'
);

SELECT throws_ok(
    $$ INSERT INTO public.financial_entry (property_id, description, amount, value_date)
       VALUES ('a0000000-0000-0000-0000-000000000001', 'zero', 0, '2026-01-01') $$,
    '23514'
);

SELECT throws_ok(
    $$ INSERT INTO public.financial_entry (property_id, description, amount, value_date)
       VALUES ('a0000000-0000-0000-0000-000000000001', '   ', -100, '2026-01-01') $$,
    '23514'
);

SELECT lives_ok(
    $$ INSERT INTO public.financial_entry (property_id, treasury_id, description, amount, value_date)
       VALUES ('a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001',
               'valid property expense', -100, '2026-01-01') $$,
    'entries: valid property expense'
);

SELECT lives_ok(
    $$ INSERT INTO public.financial_entry (lease_id, description, amount, value_date)
       VALUES ('c0000000-0000-0000-0000-000000000001', 'valid charge', -500, '2026-01-01') $$,
    'entries: valid lease charge'
);

SELECT lives_ok(
    $$ INSERT INTO public.financial_entry (lease_id, property_id, treasury_id, description, amount, value_date)
       VALUES ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
               'f0000000-0000-0000-0000-000000000001', 'valid payment', 100, '2026-01-01') $$,
    'entries: valid payment'
);

SELECT lives_ok(
    $$ INSERT INTO public.financial_entry (treasury_id, description, amount, value_date)
       VALUES ('f0000000-0000-0000-0000-000000000001', 'valid bank fee', -20, '2026-01-01') $$,
    'entries: valid treasury-only movement'
);

SELECT throws_ok(
    $$ INSERT INTO public.financial_entry (property_id, description, amount, value_date)
       VALUES ('a0000000-0000-0000-0000-000000000001', 'old date', -100, '2019-01-01') $$,
    '23514'
);

SELECT lives_ok(
    $$ INSERT INTO public.financial_entry (property_id, treasury_id, description, amount, value_date)
       VALUES ('a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001',
               'valid date', -50, '2026-06-01') $$,
    'entries: valid value_date'
);

-- ── treasury constraints ────────────────────────
SELECT throws_ok(
    $$ INSERT INTO public.treasury (name) VALUES ('Konto bankowe PKO') $$,
    '23505'
);

SELECT throws_ok(
    $$ INSERT INTO public.treasury (name) VALUES ('   ') $$,
    '23514'
);

SELECT finish();
ROLLBACK;
