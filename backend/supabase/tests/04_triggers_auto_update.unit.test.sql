-- ================================================
-- pgTAP: TRIGGERS — updated_at auto-set
-- ================================================

BEGIN;
SELECT plan(5);

-- ── user_roles updated_at ───────────────────────
INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000001', 'admin',
        '2024-01-01 00:00:00+00', '2024-01-01 00:00:00+00')
ON CONFLICT (user_id) DO NOTHING;

SELECT results_ne(
    $$ SELECT updated_at FROM public.user_roles
       WHERE user_id = '00000000-0000-0000-0000-000000000001' $$,
    $$ VALUES ('2024-01-01 00:00:00+00'::timestamptz) $$,
    'user_roles: updated_at changed on UPDATE'
);

-- ── properties updated_at ───────────────────────
UPDATE public.properties
SET name = 'Updated Name'
WHERE id = 'a0000000-0000-0000-0000-000000000001';

SELECT results_ne(
    $$ SELECT updated_at FROM public.properties
       WHERE id = 'a0000000-0000-0000-0000-000000000001' $$,
    $$ VALUES ('2024-06-01 10:00:00+00'::timestamptz) $$,
    'properties: updated_at changed on UPDATE'
);

-- ── tenants updated_at ──────────────────────────
UPDATE public.tenants
SET notes = 'trigger test'
WHERE id = 'b0000000-0000-0000-0000-000000000001';

SELECT results_ne(
    $$ SELECT updated_at FROM public.tenants
       WHERE id = 'b0000000-0000-0000-0000-000000000001' $$,
    $$ VALUES ('2025-06-01 10:00:00+00'::timestamptz) $$,
    'tenants: updated_at changed on UPDATE'
);

-- ── lease_agreements updated_at ─────────────────
UPDATE public.lease_agreements
SET notes = 'trigger test'
WHERE id = 'c0000000-0000-0000-0000-000000000001';

SELECT results_ne(
    $$ SELECT updated_at FROM public.lease_agreements
       WHERE id = 'c0000000-0000-0000-0000-000000000001' $$,
    $$ VALUES ('2025-05-20 10:00:00+00'::timestamptz) $$,
    'leases: updated_at changed on UPDATE'
);

-- ── transactions updated_at ─────────────────────
UPDATE public.transactions
SET description = 'trigger test'
WHERE id = 'd0000000-0000-0000-0000-000000000001';

SELECT results_ne(
    $$ SELECT updated_at FROM public.transactions
       WHERE id = 'd0000000-0000-0000-0000-000000000001' $$,
    $$ VALUES ('2025-05-20 10:00:00+00'::timestamptz) $$,
    'transactions: updated_at changed on UPDATE'
);

SELECT finish();
ROLLBACK;
