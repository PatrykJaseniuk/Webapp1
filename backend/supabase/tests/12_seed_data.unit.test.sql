-- ================================================
-- pgTAP: SEED DATA INTEGRITY
-- ================================================

BEGIN;
SELECT plan(15);

-- ── User roles ──────────────────────────────────
SELECT results_eq(
    $$ SELECT count(*) FROM public.user_role $$,
    $$ VALUES (8::bigint) $$,
    '8 user roles seeded'
);

-- ── Properties ──────────────────────────────────
SELECT results_eq(
    $$ SELECT count(*) FROM public.property $$,
    $$ VALUES (6::bigint) $$,
    '6 properties in DB'
);

-- ── Tenants ─────────────────────────────────────
SELECT results_eq(
    $$ SELECT count(*) FROM public.tenant $$,
    $$ VALUES (5::bigint) $$,
    '5 tenants seeded'
);

-- ── Lease agreements ────────────────────────────
SELECT results_eq(
    $$ SELECT count(*) FROM public.lease_agreement $$,
    $$ VALUES (4::bigint) $$,
    '4 lease agreements seeded'
);

-- ── Attachments ─────────────────────────────────
SELECT results_eq(
    $$ SELECT count(*) FROM public.attachment $$,
    $$ VALUES (13::bigint) $$,
    '13 attachments seeded'
);

-- ── Status distribution (matches actual DB state) ─
SELECT results_eq(
    $$ SELECT count(*) FROM public.property WHERE property_status = 'occupied' $$,
    $$ VALUES (3::bigint) $$,
    '3 properties occupied'
);

SELECT results_eq(
    $$ SELECT count(*) FROM public.property WHERE property_status = 'available' $$,
    $$ VALUES (2::bigint) $$,
    '2 properties available'
);

SELECT results_eq(
    $$ SELECT count(*) FROM public.property WHERE property_status = 'inactive' $$,
    $$ VALUES (1::bigint) $$,
    '1 property inactive'
);

SELECT results_eq(
    $$ SELECT count(*) FROM public.lease_agreement WHERE lease_status = 'active' $$,
    $$ VALUES (3::bigint) $$,
    '3 active leases'
);

-- ── Referential integrity ───────────────────────
SELECT results_eq(
    $$ SELECT count(*) FROM public.tenant t
       JOIN public.user_role ur ON t.user_id = ur.user_id $$,
    $$ VALUES (5::bigint) $$,
    'all tenants have user_roles'
);

SELECT results_eq(
    $$ SELECT count(*) FROM public.lease_agreement l
       JOIN public.tenant t ON l.tenant_id = t.id
       JOIN public.property p ON l.property_id = p.id $$,
    $$ VALUES (4::bigint) $$,
    'all leases reference valid tenants and properties'
);

SELECT results_eq(
    $$ SELECT count(*) FROM public.financial_entry fe
       LEFT JOIN public.lease_agreement l ON fe.lease_id = l.id
       WHERE fe.lease_id IS NOT NULL AND l.id IS NULL $$,
    $$ VALUES (0::bigint) $$,
    'no dangling lease references in financial entries'
);

-- ── Treasuries and financial entries ────────────
SELECT results_eq(
    $$ SELECT count(*) FROM public.treasury $$,
    $$ VALUES (2::bigint) $$,
    '2 treasuries seeded'
);

SELECT results_eq(
    $$ SELECT count(*) FROM public.financial_entry $$,
    $$ VALUES (41::bigint) $$,
    '41 financial entries seeded'
);

-- Every entry must reference at least one account
SELECT results_eq(
    $$ SELECT count(*) FROM public.financial_entry
       WHERE lease_id IS NULL AND property_id IS NULL AND treasury_id IS NULL $$,
    $$ VALUES (0::bigint) $$,
    'every financial entry references at least one account'
);

SELECT finish();
ROLLBACK;
