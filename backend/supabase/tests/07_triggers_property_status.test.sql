-- ================================================
-- pgTAP: TRIGGERS — auto_update_property_status
-- ================================================

BEGIN;
SELECT plan(6);

-- Verify trigger exists
SELECT has_trigger('public', 'lease_agreements',
    'auto_property_status_on_lease_change',
    'property-status trigger exists');

-- Verify function exists
SELECT has_function('public', 'auto_update_property_status',
    'auto_update_property_status() exists');

-- Verify function returns trigger
SELECT function_returns('public', 'auto_update_property_status',
    'trigger', 'returns trigger');

-- Use an available property with no active leases (Wrocław)
-- Test: creating an active lease sets property to occupied
INSERT INTO public.lease_agreements
    (tenant_id, property_id, start_date, end_date, monthly_rent, deposit_amount, lease_status)
VALUES
    ('b0000000-0000-0000-0000-000000000002',
     'a0000000-0000-0000-0000-000000000005',
     '2026-06-01', '2027-05-31', 1000, 1000, 'active');

SELECT results_eq(
    $$ SELECT property_status FROM public.properties
       WHERE id = 'a0000000-0000-0000-0000-000000000005' $$,
    $$ VALUES ('occupied'::public.property_status) $$,
    'active lease → property becomes occupied'
);

-- Test: terminating lease sets property back to available
UPDATE public.lease_agreements
SET lease_status = 'terminated'
WHERE tenant_id = 'b0000000-0000-0000-0000-000000000002'
  AND property_id = 'a0000000-0000-0000-0000-000000000005';

SELECT results_eq(
    $$ SELECT property_status FROM public.properties
       WHERE id = 'a0000000-0000-0000-0000-000000000005' $$,
    $$ VALUES ('available'::public.property_status) $$,
    'terminated lease → property becomes available'
);

-- Test: inactive property stays inactive even with active lease
UPDATE public.properties
SET property_status = 'inactive'
WHERE id = 'a0000000-0000-0000-0000-000000000005';

UPDATE public.lease_agreements
SET lease_status = 'active'
WHERE tenant_id = 'b0000000-0000-0000-0000-000000000002'
  AND property_id = 'a0000000-0000-0000-0000-000000000005';

SELECT results_eq(
    $$ SELECT property_status FROM public.properties
       WHERE id = 'a0000000-0000-0000-0000-000000000005' $$,
    $$ VALUES ('inactive'::public.property_status) $$,
    'inactive property stays inactive despite active lease'
);

SELECT finish();
ROLLBACK;
