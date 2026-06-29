-- ================================================
-- pgTAP: SEED DATA INTEGRITY
-- ================================================

BEGIN;
SELECT plan(12);

-- ── User roles ──────────────────────────────────
SELECT results_eq(
    $$ SELECT count(*) FROM public.user_roles $$,
    $$ VALUES (7::bigint) $$,
    '7 user roles seeded'
);

-- ── Properties ──────────────────────────────────
SELECT results_eq(
    $$ SELECT count(*) FROM public.properties $$,
    $$ VALUES (6::bigint) $$,
    '6 properties in DB'
);

-- ── Tenants ─────────────────────────────────────
SELECT results_eq(
    $$ SELECT count(*) FROM public.tenants $$,
    $$ VALUES (5::bigint) $$,
    '5 tenants seeded'
);

-- ── Lease agreements ────────────────────────────
SELECT results_eq(
    $$ SELECT count(*) FROM public.lease_agreements $$,
    $$ VALUES (4::bigint) $$,
    '4 lease agreements seeded'
);

-- ── Attachments ─────────────────────────────────
SELECT results_eq(
    $$ SELECT count(*) FROM public.attachments $$,
    $$ VALUES (12::bigint) $$,
    '12 attachments seeded'
);

-- ── Status distribution (matches actual DB state) ─
SELECT results_eq(
    $$ SELECT count(*) FROM public.properties WHERE property_status = 'occupied' $$,
    $$ VALUES (3::bigint) $$,
    '3 properties occupied'
);

SELECT results_eq(
    $$ SELECT count(*) FROM public.properties WHERE property_status = 'available' $$,
    $$ VALUES (2::bigint) $$,
    '2 properties available'
);

SELECT results_eq(
    $$ SELECT count(*) FROM public.properties WHERE property_status = 'inactive' $$,
    $$ VALUES (1::bigint) $$,
    '1 property inactive'
);

SELECT results_eq(
    $$ SELECT count(*) FROM public.lease_agreements WHERE lease_status = 'active' $$,
    $$ VALUES (3::bigint) $$,
    '3 active leases'
);

-- ── Referential integrity ───────────────────────
SELECT results_eq(
    $$ SELECT count(*) FROM public.tenants t
       JOIN public.user_roles ur ON t.user_id = ur.user_id $$,
    $$ VALUES (5::bigint) $$,
    'all tenants have user_roles'
);

SELECT results_eq(
    $$ SELECT count(*) FROM public.lease_agreements l
       JOIN public.tenants t ON l.tenant_id = t.id
       JOIN public.properties p ON l.property_id = p.id $$,
    $$ VALUES (4::bigint) $$,
    'all leases reference valid tenants and properties'
);

SELECT results_eq(
    $$ SELECT count(*) FROM public.transactions tr
       LEFT JOIN public.lease_agreements l ON tr.lease_id = l.id
       LEFT JOIN public.properties p ON tr.property_id = p.id
       WHERE tr.lease_id IS NOT NULL AND l.id IS NULL $$,
    $$ VALUES (0::bigint) $$,
    'no dangling lease references in transactions'
);

SELECT finish();
ROLLBACK;
