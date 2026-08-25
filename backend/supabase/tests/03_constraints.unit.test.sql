-- ================================================
-- pgTAP: CHECK CONSTRAINTS
-- ================================================

BEGIN;
SELECT plan(16);

-- ── properties constraints ──────────────────────
SELECT col_has_check('public', 'properties', 'monthly_rent', 'props: monthly_rent CHECK');
SELECT col_has_check('public', 'properties', 'deposit_amount', 'props: deposit_amount CHECK');

SELECT throws_ok(
    $$ INSERT INTO public.properties (name, address, property_type, monthly_rent, deposit_amount, property_status)
       VALUES ('test', 'test addr', 'apartment', -100, 0, 'available') $$,
    '23514'
);

SELECT lives_ok(
    $$ INSERT INTO public.properties (name, address, property_type, monthly_rent, deposit_amount, property_status)
       VALUES ('test2', 'test addr2', 'house', 500, 0, 'available') $$,
    'props: deposit_amount >= 0 allows zero'
);

-- ── tenants constraints ─────────────────────────
SELECT col_is_unique('public', 'tenants', 'email', 'tenants.email is UNIQUE');

-- ── lease_agreements constraints ────────────────
-- check_lease_dates is a multi-column CHECK (end_date IS NULL OR end_date >= start_date)
SELECT throws_ok(
    $$ INSERT INTO public.lease_agreements (tenant_id, property_id, start_date, end_date,
        monthly_rent, deposit_amount)
       VALUES ('b0000000-0000-0000-0000-000000000001',
               'a0000000-0000-0000-0000-000000000001',
               '2026-01-01', '2025-12-31', 1000, 500) $$,
    '23514'
);
SELECT col_has_check('public', 'lease_agreements', 'monthly_rent', 'leases: monthly_rent CHECK');
SELECT col_has_check('public', 'lease_agreements', 'deposit_amount', 'leases: deposit_amount CHECK');

SELECT lives_ok(
    $$ INSERT INTO public.lease_agreements (tenant_id, property_id, start_date, end_date,
        monthly_rent, deposit_amount)
       VALUES ('b0000000-0000-0000-0000-000000000001',
               'a0000000-0000-0000-0000-000000000001',
               '2026-01-01', NULL, 1000, 500) $$,
    'leases: NULL end_date allowed'
);

-- ── transactions constraints ────────────────────
SELECT throws_ok(
    $$ INSERT INTO public.transactions (description, amount, due_date)
       VALUES ('no ref', -100, '2026-01-01') $$,
    '23514'
);

SELECT throws_ok(
    $$ INSERT INTO public.transactions (property_id, description, amount, due_date)
       VALUES ('a0000000-0000-0000-0000-000000000001', 'zero', 0, '2026-01-01') $$,
    '23514'
);

SELECT lives_ok(
    $$ INSERT INTO public.transactions (property_id, description, amount, due_date)
       VALUES ('a0000000-0000-0000-0000-000000000001', 'valid expense', -100, '2026-01-01') $$,
    'trans: valid property expense'
);

SELECT lives_ok(
    $$ INSERT INTO public.transactions (lease_id, description, amount, due_date)
       VALUES ('c0000000-0000-0000-0000-000000000001', 'valid charge', -500, '2026-01-01') $$,
    'trans: valid lease charge'
);

SELECT lives_ok(
    $$ INSERT INTO public.transactions (lease_id, property_id, description, amount, due_date)
       VALUES ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'valid payment', 100, '2026-01-01') $$,
    'trans: valid payment'
);

SELECT throws_ok(
    $$ INSERT INTO public.transactions (property_id, description, amount, due_date)
       VALUES ('a0000000-0000-0000-0000-000000000001', 'old date', -100, '2019-01-01') $$,
    '23514'
);

SELECT lives_ok(
    $$ INSERT INTO public.transactions (property_id, description, amount, due_date)
       VALUES ('a0000000-0000-0000-0000-000000000001', 'valid date', -50, '2026-06-01') $$,
    'trans: valid due_date'
);

SELECT finish();
ROLLBACK;
