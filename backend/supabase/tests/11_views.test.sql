-- ================================================
-- pgTAP: VIEWS
-- ================================================

BEGIN;
SELECT plan(8);

-- ── View existence ──────────────────────────────
SELECT has_view('public', 'active_leases',
    'active_leases view exists');
SELECT has_view('public', 'property_occupancy',
    'property_occupancy view exists');
SELECT has_view('public', 'unpaid_transactions_summary',
    'unpaid_transactions_summary view exists');
SELECT has_view('public', 'property_financial_summary',
    'property_financial_summary view exists');

-- ── Data populated (seed data exists) ───────────
-- active_leases should have at least 1 row (Warsaw lease is active)
SELECT results_eq(
    $$ SELECT count(*) >= 1 FROM public.active_leases $$,
    $$ VALUES (true) $$,
    'active_leases has data'
);

-- property_occupancy should have all properties
SELECT results_eq(
    $$ SELECT count(*) FROM public.property_occupancy $$,
    $$ SELECT count(*) FROM public.properties $$,
    'property_occupancy covers all properties'
);

-- unpaid_transactions_summary is a LEFT JOIN with GROUP BY, may have rows
SELECT lives_ok(
    $$ SELECT * FROM public.unpaid_transactions_summary $$,
    'unpaid_transactions_summary is queryable'
);

-- property_financial_summary should have all properties
SELECT results_eq(
    $$ SELECT count(*) FROM public.property_financial_summary $$,
    $$ SELECT count(*) FROM public.properties $$,
    'property_financial_summary covers all properties'
);

SELECT finish();
ROLLBACK;
