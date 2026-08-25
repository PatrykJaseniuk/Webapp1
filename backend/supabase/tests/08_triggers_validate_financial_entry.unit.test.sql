-- ================================================
-- pgTAP: TRIGGERS — financial entry reference validation
-- ================================================

BEGIN;
SELECT plan(10);

-- Verify triggers exist
SELECT has_trigger('public', 'financial_entry',
    'validate_financial_entry_refs_trigger',
    'entry reference validation trigger exists');

SELECT has_trigger('public', 'lease_agreement',
    'revalidate_lease_entry_refs_trigger',
    'lease re-validation trigger exists');

SELECT has_trigger('public', 'lease_agreement',
    'validate_lease_deposit_entry_trigger',
    'deposit entry validation trigger exists');

-- Verify functions exist
SELECT has_function('public', 'validate_financial_entry_refs',
    'validate_financial_entry_refs() exists');
SELECT has_function('public', 'validate_lease_deposit_entry',
    'validate_lease_deposit_entry() exists');

-- Test: entry with matching lease_id + property_id passes
SELECT lives_ok(
    $$ INSERT INTO public.financial_entry
        (lease_id, property_id, treasury_id, description, amount, value_date)
       VALUES
        ('c0000000-0000-0000-0000-000000000001',
         'a0000000-0000-0000-0000-000000000001',
         'f0000000-0000-0000-0000-000000000001',
         'valid rent payment', 1500, '2026-06-01') $$,
    'matching lease_id+property_id accepted'
);

-- Test: entry with mismatched property_id fails
SELECT throws_ok(
    $$ INSERT INTO public.financial_entry
        (lease_id, property_id, description, amount, value_date)
       VALUES
        ('c0000000-0000-0000-0000-000000000001',
         'a0000000-0000-0000-0000-000000000002',
         'mismatched', -1500, '2026-06-01') $$,
    'P0001'
);

-- Test: property-only entry passes (no lease_id)
SELECT lives_ok(
    $$ INSERT INTO public.financial_entry
        (property_id, treasury_id, description, amount, value_date)
       VALUES
        ('a0000000-0000-0000-0000-000000000001',
         'f0000000-0000-0000-0000-000000000001',
         'repair cost', -500, '2026-06-01') $$,
    'property-only entry accepted'
);

-- Test: deposit_entry_id pointing at an entry of another lease is rejected
SELECT throws_ok(
    $$ UPDATE public.lease_agreement
       SET deposit_entry_id = 'd0000000-0000-0000-0000-000000000100'
       WHERE id = 'c0000000-0000-0000-0000-000000000001' $$,
    'P0001'
);

-- Test: deposit_entry_id pointing at a cash leg (not a lease-only accrual) is rejected
SELECT throws_ok(
    $$ UPDATE public.lease_agreement
       SET deposit_entry_id = 'd0000000-0000-0000-0000-000000000002'
       WHERE id = 'c0000000-0000-0000-0000-000000000001' $$,
    'P0001'
);

SELECT finish();
ROLLBACK;
