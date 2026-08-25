-- ================================================
-- pgTAP: VIEWS
-- ================================================
-- These tests assert ACTUAL FINANCIAL FIGURES, not just that the views exist.
-- A view that silently loses money (e.g. a per-property P&L that cannot see
-- rent because rent lives on the lease) must fail here.

BEGIN;
SELECT plan(33);

-- ── View existence ─────────────────────────────
SELECT has_view('public', 'active_leases',              'active_leases view exists');
SELECT has_view('public', 'property_occupancy',         'property_occupancy view exists');
SELECT has_view('public', 'lease_balance',              'lease_balance view exists');
SELECT has_view('public', 'lease_closing_statement',    'lease_closing_statement view exists');
SELECT has_view('public', 'deposit_obligation',         'deposit_obligation view exists');
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
    $$ VALUES (7::bigint) $$,
    'lease 1 has 7 past-dated charges (all settled, so 0 overdue above)'
);

-- ── Deposits held ──────────────────────────────
SELECT results_eq(
    $$ SELECT deposit_held FROM public.lease_balance
       WHERE lease_id = 'c0000000-0000-0000-0000-000000000001' $$,
    $$ VALUES (3500.00::numeric) $$,
    'lease 1 deposit fully held'
);

-- A held deposit must NOT mask arrears: lease 2 holds 4200 and still owes 4200.
SELECT results_eq(
    $$ SELECT deposit_held, total_unpaid_amount FROM public.lease_balance
       WHERE lease_id = 'c0000000-0000-0000-0000-000000000002' $$,
    $$ VALUES (4200.00::numeric, 4200.00::numeric) $$,
    'held deposit does not cancel out rent arrears'
);

-- ── Partial deposit release (lease 4, expired) ────
SELECT results_eq(
    $$ SELECT deposit_charged, deposit_paid, deposit_held,
              deposit_released, deposit_retained, deposit_outstanding
       FROM public.lease_closing_statement
       WHERE lease_id = 'c0000000-0000-0000-0000-000000000004' $$,
    $$ VALUES (2800.00::numeric, 2800.00::numeric, 500.00::numeric,
               2300.00::numeric, 500.00::numeric, 0.00::numeric) $$,
    'lease 4 partial release: 2300 returned + 500 retained = 2800 charged, nothing outstanding'
);

SELECT results_eq(
    $$ SELECT arrears, lease_balance FROM public.lease_closing_statement
       WHERE lease_id = 'c0000000-0000-0000-0000-000000000004' $$,
    $$ VALUES (0::numeric, 0.00::numeric) $$,
    'lease 4 nets to zero after partial deposit release'
);

-- released + retained = charged (the settlement invariant)
SELECT results_eq(
    $$ SELECT count(*) FROM public.lease_agreement
       WHERE deposit_released IS NOT NULL
         AND deposit_released + deposit_retained <> deposit_amount $$,
    $$ VALUES (0::bigint) $$,
    'every settled deposit satisfies released + retained = charged'
);

-- All deposits settled -> nothing outstanding on ended leases
SELECT results_eq(
    $$ SELECT count(*) FROM public.deposit_obligation $$,
    $$ VALUES (0::bigint) $$,
    'no outstanding deposit obligations on ended leases'
);

-- ── Property P&L ──────────────────────────────
-- Rent MUST reach the property. Warsaw: 4 x 3500 rent + 112.50 + 45.00 utilities
-- = 14157.50 income. A P&L that only saw the deposit would report 3500.
SELECT results_eq(
    $$ SELECT total_income, total_expenses, net_profit
       FROM public.property_financial_summary
       WHERE property_id = 'a0000000-0000-0000-0000-000000000001' $$,
    $$ VALUES (14157.50::numeric, 1450.00::numeric, 12707.50::numeric) $$,
    'Warsaw P&L sees all rent and utility income, not just the deposit'
);

SELECT results_eq(
    $$ SELECT total_income, total_expenses, net_profit
       FROM public.property_financial_summary
       WHERE property_id = 'a0000000-0000-0000-0000-000000000003' $$,
    $$ VALUES (13000.00::numeric, 6800.00::numeric, 6200.00::numeric) $$,
    'Gdansk P&L: 2 months rent received, 6800 expenses'
);

-- Retained deposit is recognised as property income (500.00 on Lodz)
SELECT results_eq(
    $$ SELECT total_income, total_expenses, net_profit
       FROM public.property_financial_summary
       WHERE property_id = 'a0000000-0000-0000-0000-000000000006' $$,
    $$ VALUES (6100.00::numeric, 4000.00::numeric, 2100.00::numeric) $$,
    'Lodz P&L includes the 500.00 retained deposit as income'
);

-- Deposits must NEVER be counted as property income. Deposit receipts total
-- 17000.00 across the four leases and none of them carries a property_id, so
-- they cannot reach property_financial_summary.
SELECT results_eq(
    $$ SELECT COALESCE(SUM(amount), 0) FROM public.financial_entry
       WHERE lease_id IS NOT NULL AND treasury_id IS NOT NULL
         AND property_id IS NULL AND amount > 0 $$,
    $$ VALUES (17000.00::numeric) $$,
    'deposit receipts total 17000.00 and are structurally excluded from property income'
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
    $$ VALUES (42782.50::numeric) $$,
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
    $$ VALUES (17200.00::numeric, 3::numeric, 43782.50::numeric) $$,
    'dashboard aggregates: 17200 unpaid, 3 overdue, 43782.50 cash'
);

SELECT results_eq(
    $$ SELECT total_properties, occupied_properties, active_leases FROM public.dashboard_summary $$,
    $$ VALUES (6::bigint, 3::bigint, 3::bigint) $$,
    'dashboard counts: 6 properties, 3 occupied, 3 active leases'
);

-- ── Data quality worklist ───────────────────────
SELECT results_eq(
    $$ SELECT count(*) FROM public.financial_entry_review $$,
    $$ VALUES (7::bigint) $$,
    'review view flags the 4 deposit receipts, 2 treasury-only rows and 1 reclassification'
);

SELECT finish();
ROLLBACK;
