-- ================================================
-- pgTAP: TRIGGERS — financial entry reference validation
-- ================================================

BEGIN;
SELECT plan(6);

-- Verify triggers exist
SELECT has_trigger('public', 'financial_entry',
    'validate_financial_entry_refs_trigger',
    'entry reference validation trigger exists');

SELECT has_trigger('public', 'lease_agreement',
    'revalidate_lease_entry_refs_trigger',
    'lease re-validation trigger exists');

-- Verify functions exist
SELECT has_function('public', 'validate_financial_entry_refs',
    'validate_financial_entry_refs() exists');

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

SELECT finish();
ROLLBACK;
