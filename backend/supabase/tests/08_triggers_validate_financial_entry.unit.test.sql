-- ================================================
-- pgTAP: TRIGGERS — validate_transaction_lease_property
-- ================================================

BEGIN;
SELECT plan(5);

-- Verify trigger exists
SELECT has_trigger('public', 'transactions',
    'validate_transaction_lease_property_trigger',
    'validation trigger exists');

-- Verify function exists
SELECT has_function('public', 'validate_transaction_lease_property',
    'validate_transaction_lease_property() exists');

-- Test: transaction with correct lease_id+property_id passes
SELECT lives_ok(
    $$ INSERT INTO public.transactions
        (lease_id, property_id, description, amount, due_date)
       VALUES
        ('c0000000-0000-0000-0000-000000000001',
         'a0000000-0000-0000-0000-000000000001',
         'valid lease rent', -1500, '2026-06-01') $$,
    'matching lease_id+property_id accepted'
);

-- Test: transaction with mismatched property_id fails
SELECT throws_ok(
    $$ INSERT INTO public.transactions
        (lease_id, property_id, description, amount, due_date)
       VALUES
        ('c0000000-0000-0000-0000-000000000001',
         'a0000000-0000-0000-0000-000000000002',
         'mismatched', -1500, '2026-06-01') $$,
    'P0001'
);

-- Test: property-only transaction passes (no lease_id)
SELECT lives_ok(
    $$ INSERT INTO public.transactions
        (property_id, description, amount, due_date)
       VALUES
        ('a0000000-0000-0000-0000-000000000001',
         'repair cost', -500, '2026-06-01') $$,
    'property-only transaction accepted'
);

SELECT finish();
ROLLBACK;
