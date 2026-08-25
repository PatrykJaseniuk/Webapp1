-- ================================================
-- pgTAP: TRIGGERS — updated_at auto-set
-- ================================================

BEGIN;
SELECT plan(6);

-- ── user_roles updated_at ───────────────────────
INSERT INTO public.user_role (user_id, role, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000001', 'admin',
        '2024-01-01 00:00:00+00', '2024-01-01 00:00:00+00')
ON CONFLICT (user_id) DO NOTHING;

SELECT results_ne(
    $$ SELECT updated_at FROM public.user_role
       WHERE user_id = '00000000-0000-0000-0000-000000000001' $$,
    $$ VALUES ('2024-01-01 00:00:00+00'::timestamptz) $$,
    'user_roles: updated_at changed on UPDATE'
);

-- ── properties updated_at ───────────────────────
UPDATE public.property
SET name = 'Updated Name'
WHERE id = 'a0000000-0000-0000-0000-000000000001';

SELECT results_ne(
    $$ SELECT updated_at FROM public.property
       WHERE id = 'a0000000-0000-0000-0000-000000000001' $$,
    $$ VALUES ('2024-06-01 10:00:00+00'::timestamptz) $$,
    'properties: updated_at changed on UPDATE'
);

-- ── tenants updated_at ──────────────────────────
UPDATE public.tenant
SET notes = 'trigger test'
WHERE id = 'b0000000-0000-0000-0000-000000000001';

SELECT results_ne(
    $$ SELECT updated_at FROM public.tenant
       WHERE id = 'b0000000-0000-0000-0000-000000000001' $$,
    $$ VALUES ('2025-06-01 10:00:00+00'::timestamptz) $$,
    'tenants: updated_at changed on UPDATE'
);

-- ── lease_agreements updated_at ─────────────────
UPDATE public.lease_agreement
SET notes = 'trigger test'
WHERE id = 'c0000000-0000-0000-0000-000000000001';

SELECT results_ne(
    $$ SELECT updated_at FROM public.lease_agreement
       WHERE id = 'c0000000-0000-0000-0000-000000000001' $$,
    $$ VALUES ('2025-05-20 10:00:00+00'::timestamptz) $$,
    'leases: updated_at changed on UPDATE'
);

-- ── financial entries updated_at ────────────────
UPDATE public.financial_entry
SET description = 'trigger test'
WHERE id = 'd0000000-0000-0000-0000-000000000001';

SELECT results_ne(
    $$ SELECT updated_at FROM public.financial_entry
       WHERE id = 'd0000000-0000-0000-0000-000000000001' $$,
    $$ VALUES ('2025-05-20 10:00:00+00'::timestamptz) $$,
    'financial entries: updated_at changed on UPDATE'
);

-- ── treasuries updated_at ───────────────────────
UPDATE public.treasury
SET name = 'Konto bankowe PKO - trigger test'
WHERE id = 'f0000000-0000-0000-0000-000000000001';

SELECT results_ne(
    $$ SELECT updated_at FROM public.treasury
       WHERE id = 'f0000000-0000-0000-0000-000000000001' $$,
    $$ VALUES ('2023-01-01 08:00:00+00'::timestamptz) $$,
    'treasuries: updated_at changed on UPDATE'
);

SELECT finish();
ROLLBACK;
