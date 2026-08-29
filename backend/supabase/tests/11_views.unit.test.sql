-- ================================================
-- pgTAP: VIEWS
-- ================================================
-- These tests assert ACTUAL FINANCIAL FIGURES, not just that the views exist.
-- A view that silently loses money (e.g. a per-property P&L that cannot see
-- rent because rent lives on the lease) must fail here.

BEGIN;
SELECT plan(32);

-- ── View existence ─────────────────────────────
SELECT has_view('public', 'active_leases',              'active_leases view exists');
SELECT has_view('public', 'property_occupancy',         'property_occupancy view exists');
SELECT has_view('public', 'lease_balance',              'lease_balance view exists');
SELECT has_view('public', 'property_financial_summary', 'property_financial_summary view exists');
SELECT has_view('public', 'treasury_balance',           'treasury_balance view exists');
SELECT has_view('public', 'financial_entry_review',     'financial_entry_review view exists');
SELECT has_view('public', 'dashboard_summary',          'dashboard_summary view exists');

-- ── Coverage ───────────────────────────────────
SELECT results_eq(
    $$ SELECT count(*) FROM public.property_occupancy $$,
    $$ SELECT count(*) FROM public.property $$,
    'property_occupancy covers all properties'
);

SELECT results_eq(
    $$ SELECT count(*) FROM public.property_financial_summary $$,
    $$ SELECT count(*) FROM public.property $$,
    'property_financial_summary covers all properties'
);

-- lease_balance must cover ALL leases, not just active ones, so that debt of an
-- ended lease cannot disappear from reporting.
SELECT results_eq(
    $$ SELECT count(*) FROM public.lease_balance $$,
    $$ SELECT count(*) FROM public.lease_agreement $$,
    'lease_balance covers all leases including ended ones'
);

-- ── Lease balances (seeded scenarios) ─────────────
-- Lease 1 Kowalski: every charge paired with a payment -> fully settled
SELECT results_eq(
    $$ SELECT balance, total_unpaid_amount, overdue_items_count
       FROM public.lease_balance WHERE lease_id = 'c0000000-0000-0000-0000-000000000001' $$,
    $$ VALUES (0.00::numeric, 0::numeric, 0::bigint) $$,
    'lease 1 fully settled: balance 0, nothing unpaid, nothing overdue'
);

-- Lease 2 Nowak: one month charged and never paid
SELECT results_eq(
    $$ SELECT balance, total_unpaid_amount, overdue_items_count, earliest_unpaid_value_date
       FROM public.lease_balance WHERE lease_id = 'c0000000-0000-0000-0000-000000000002' $$,
    $$ VALUES (-4200.00::numeric, 4200.00::numeric, 1::bigint, '2025-06-01'::date) $$,
    'lease 2 owes one month, 1 overdue item, correct earliest unpaid date'
);

-- Lease 3 Wisniewski: two months charged and never paid
SELECT results_eq(
    $$ SELECT balance, total_unpaid_amount, overdue_items_count, earliest_unpaid_value_date
       FROM public.lease_balance WHERE lease_id = 'c0000000-0000-0000-0000-000000000003' $$,
    $$ VALUES (-13000.00::numeric, 13000.00::numeric, 2::bigint, '2024-03-01'::date) $$,
    'lease 3 owes two months, 2 overdue items, earliest unpaid 2024-03-01'
);

-- FIFO ageing: paid charges must NOT be counted as overdue even though their
-- value_date is in the past. Lease 1 has 7 past-dated charges, all covered.
SELECT results_eq(
    $$ SELECT count(*) FROM public.financial_entry
       WHERE lease_id = 'c0000000-0000-0000-0000-000000000001'
         AND amount < 0 AND value_date < CURRENT_DATE $$,
    $$ VALUES (6::bigint) $$,
    'lease 1 has 6 past-dated charges (all settled, so 0 overdue above)'
);

-- ── Property P&L ──────────────────────────────
-- Rent MUST reach the property. Warsaw: 4 x 3500 rent + 112.50 + 45.00 utilities
-- = 14157.50 income. A P&L blind to lease-tagged payments would report 0.
SELECT results_eq(
    $$ SELECT total_income, total_expenses, net_profit
       FROM public.property_financial_summary
       WHERE property_id = 'a0000000-0000-0000-0000-000000000001' $$,
    $$ VALUES (14157.50::numeric, 1450.00::numeric, 12707.50::numeric) $$,
    'Warsaw P&L sees all rent and utility income'
);

SELECT results_eq(
    $$ SELECT total_income, total_expenses, net_profit
       FROM public.property_financial_summary
       WHERE property_id = 'a0000000-0000-0000-0000-000000000003' $$,
    $$ VALUES (13000.00::numeric, 6800.00::numeric, 6200.00::numeric) $$,
    'Gdansk P&L: 2 months rent received, 6800 expenses'
);

SELECT results_eq(
    $$ SELECT total_income, total_expenses, net_profit
       FROM public.property_financial_summary
       WHERE property_id = 'a0000000-0000-0000-0000-000000000006' $$,
    $$ VALUES (5600.00::numeric, 4000.00::numeric, 1600.00::numeric) $$,
    'Lodz P&L: 2 months rent received, 4000 renovation expense'
);

SELECT results_eq(
    $$ SELECT COALESCE(SUM(total_income), 0) FROM public.property_financial_summary $$,
    $$ SELECT COALESCE(SUM(amount), 0) FROM public.financial_entry
       WHERE property_id IS NOT NULL AND amount > 0 $$,
    'property income equals exactly the positive property-tagged entries'
);

-- ── Treasury ─────────────────────────────────
SELECT results_eq(
    $$ SELECT balance FROM public.treasury_balance
       WHERE treasury_id = 'f0000000-0000-0000-0000-000000000001' $$,
    $$ VALUES (28082.50::numeric) $$,
    'bank treasury balance reconciles'
);

SELECT results_eq(
    $$ SELECT balance, entry_count FROM public.treasury_balance
       WHERE treasury_id = 'f0000000-0000-0000-0000-000000000002' $$,
    $$ VALUES (1000.00::numeric, 1::bigint) $$,
    'cash treasury holds its opening balance'
);

-- Every treasury-referencing entry is accounted for in exactly one balance
SELECT results_eq(
    $$ SELECT COALESCE(SUM(balance), 0) FROM public.treasury_balance $$,
    $$ SELECT COALESCE(SUM(amount), 0) FROM public.financial_entry
       WHERE treasury_id IS NOT NULL $$,
    'treasury balances sum to all treasury-referencing entries'
);

-- ── Dashboard ────────────────────────────────
SELECT results_eq(
    $$ SELECT total_unpaid_amount, overdue_items, cash_on_hand FROM public.dashboard_summary $$,
    $$ VALUES (17200.00::numeric, 3::numeric, 29082.50::numeric) $$,
    'dashboard aggregates: 17200 unpaid, 3 overdue, 29082.50 cash'
);

SELECT results_eq(
    $$ SELECT total_properties, occupied_properties, active_leases FROM public.dashboard_summary $$,
    $$ VALUES (6::bigint, 3::bigint, 3::bigint) $$,
    'dashboard counts: 6 properties, 3 occupied, 3 active leases'
);

-- ── Data quality worklist ───────────────────────
SELECT results_eq(
    $$ SELECT count(*) FROM public.financial_entry_review $$,
    $$ VALUES (2::bigint) $$,
    'review view flags the 2 treasury-only movements'
);

-- ================================================
-- STATEMENT VIEWS (RUNNING BALANCE)
-- ================================================
-- The running balance is the only figure in the system that must agree with an
-- aggregate computed a completely different way. These tests pin that agreement:
-- the LAST running_balance of an account must equal that account's total.

SELECT has_view('public', 'lease_statement',    'lease_statement view exists');
SELECT has_view('public', 'property_statement', 'property_statement view exists');
SELECT has_view('public', 'treasury_statement', 'treasury_statement view exists');

-- Final running balance per lease == lease_balance.balance, for EVERY lease.
-- A window frame or ordering mistake shows up here immediately.
SELECT is_empty(
    $$ SELECT lb.lease_id
       FROM public.lease_balance lb
       JOIN (
           SELECT DISTINCT ON (lease_id) lease_id, running_balance
           FROM public.lease_statement
           ORDER BY lease_id, value_date DESC, id DESC
       ) ls ON ls.lease_id = lb.lease_id
       WHERE ls.running_balance <> lb.balance $$,
    'lease_statement final running_balance agrees with lease_balance for every lease'
);

-- Same cross-check for cash: treasury_statement vs treasury_balance.
SELECT is_empty(
    $$ SELECT tb.treasury_id
       FROM public.treasury_balance tb
       JOIN (
           SELECT DISTINCT ON (treasury_id) treasury_id, running_balance
           FROM public.treasury_statement
           ORDER BY treasury_id, value_date DESC, id DESC
       ) ts ON ts.treasury_id = tb.treasury_id
       WHERE ts.running_balance <> tb.balance $$,
    'treasury_statement final running_balance agrees with treasury_balance'
);

-- And for the property result: property_statement vs property_financial_summary.
SELECT is_empty(
    $$ SELECT pfs.property_id
       FROM public.property_financial_summary pfs
       JOIN (
           SELECT DISTINCT ON (property_id) property_id, running_balance
           FROM public.property_statement
           ORDER BY property_id, value_date DESC, id DESC
       ) ps ON ps.property_id = pfs.property_id
       WHERE ps.running_balance <> pfs.net_profit $$,
    'property_statement final running_balance agrees with property_financial_summary.net_profit'
);

-- TIE-BREAK REGRESSION TEST.
-- Lease 1 has two charges on the SAME value_date (2025-07-10: -112.50 and
-- -45.00). With a RANGE frame or without the `id` tie-break, both rows would
-- report the same peer-group total (-157.50) instead of stepping through it.
SELECT results_eq(
    $$ SELECT running_balance
       FROM public.lease_statement
       WHERE lease_id = 'c0000000-0000-0000-0000-000000000001'
         AND value_date = '2025-07-10'
       ORDER BY value_date, id $$,
    $$ VALUES (-112.50::numeric), (-157.50::numeric) $$,
    'entries sharing a value_date step the running balance one row at a time'
);

-- The statement must not invent or drop rows: one row per referenced account.
SELECT results_eq(
    $$ SELECT count(*) FROM public.lease_statement $$,
    $$ SELECT count(*) FROM public.financial_entry WHERE lease_id IS NOT NULL $$,
    'lease_statement covers exactly the lease-referencing entries'
);

SELECT finish();
ROLLBACK;
