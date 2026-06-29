-- ================================================
-- pgTAP: CHECK CONSTRAINTS
-- ================================================

BEGIN;
"SELECT plan(17);"

-- ── properties constraints ──────────────────────
SELECT col_has_check('public', 'properties', 'monthly_rent', 'props: monthly_rent CHECK');
SELECT col_has_check('public', 'properties', 'deposit_amount', 'props: deposit_amount CHECK');

SELECT throws_ok(
    $$ INSERT INTO public.properties (name, address, property_type, monthly_rent, deposit_amount)
       VALUES ('test', 'test addr', 'apartment', -100, 0) $$,
    '23514'
);

SELECT lives_ok(
    $$ INSERT INTO public.properties (name, address, property_type, monthly_rent, deposit_amount)
       VALUES ('test2', 'test addr2', 'house', 500, 0) $$,
    'props: deposit_amount >= 0 allows zero'
);

-- ── tenants constraints ─────────────────────────
SELECT col_is_unique('public', 'tenants', 'email', 'tenants.email is UNIQUE');

-- ── lease_agreements constraints ────────────────
-- check_lease_dates is a multi-column CHECK (end_date IS NULL OR end_date >= start_date)
SELECT constraint_named('public', 'lease_agreements', 'check_lease_dates', 'leases: check_lease_dates constraint exists');
SELECT throws_ok(
    $$ INSERT INTO public.lease_agreements (tenant_id, property_id, start_date, end_date,
        monthly_rent, deposit_amount)
       VALUES ('b0000000-0000-0000-0000-000000000001',
               'a0000000-0000-0000-0000-000000000001',
               '2026-01-01', '2025-12-31', 1000, 500) $$,
    '23514',
    'leases: end_date < start_date rejected'
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
    $$ INSERT INTO public.transactions (type, description, amount, due_date)
       VALUES ('rent', 'no ref', -100, '2026-01-01') $$,
    '23514'
);

SELECT throws_ok(
    $$ INSERT INTO public.transactions (property_id, type, description, amount, due_date)
       VALUES ('a0000000-0000-0000-0000-000000000001', 'rent', 'wrong sign', 100, '2026-01-01') $$,
    '23514'
);

SELECT throws_ok(
    $$ INSERT INTO public.transactions (property_id, type, description, amount, due_date)
       VALUES ('a0000000-0000-0000-0000-000000000001', 'payment', 'wrong sign', -100, '2026-01-01') $$,
    '23514'
);

SELECT lives_ok(
    $$ INSERT INTO public.transactions (property_id, type, description, amount, due_date)
       VALUES ('a0000000-0000-0000-0000-000000000001', 'payment', 'valid', 100, '2026-01-01') $$,
    'trans: valid payment'
);

SELECT lives_ok(
    $$ INSERT INTO public.transactions (property_id, type, description, amount, due_date)
       VALUES ('a0000000-0000-0000-0000-000000000001', 'rent', 'valid', -500, '2026-01-01') $$,
    'trans: valid rent'
);

SELECT throws_ok(
    $$ INSERT INTO public.transactions (property_id, type, description, amount, due_date)
       VALUES ('a0000000-0000-0000-0000-000000000001', 'expense', 'old date', -100, '2019-01-01') $$,
    '23514'
);

SELECT lives_ok(
    $$ INSERT INTO public.transactions (property_id, type, description, amount, due_date)
       VALUES ('a0000000-0000-0000-0000-000000000001', 'fee', 'valid date', -50, '2026-06-01') $$,
    'trans: valid due_date'
);

SELECT finish();
ROLLBACK;
