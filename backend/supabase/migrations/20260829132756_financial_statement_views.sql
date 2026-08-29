-- ================================================
-- FINANCIAL STATEMENT VIEWS (RUNNING BALANCE)
-- ================================================
-- Adds a per-entry running balance ("saldo po operacji") to the ledger.
--
-- WHY THIS CANNOT BE COMPUTED IN THE CLIENT
--   The UI paginates the ledger (5-100 rows per page). The balance shown on the
--   first row of page 2 depends on every row of page 1, which that request never
--   fetched. It also must accumulate oldest-first while the UI displays
--   newest-first. And accumulating decimal(10,2) money in JavaScript floats
--   would drift — every other money aggregate in this schema is summed in
--   numeric for the same reason.
--
-- WHY THERE ARE THREE VIEWS AND NOT ONE
--   A financial_entry posts THE SAME signed amount to every account it
--   references (see the posting rule on public.financial_entry). One row can
--   therefore have up to three different "balance after this entry" values —
--   one per account. A running balance is only defined inside a single account,
--   so each account type gets its own view with its own PARTITION BY. There is
--   deliberately NO global running-balance view: across mixed accounts the
--   number would be arithmetically valid and semantically meaningless.
--
-- ORDERING IS PART OF THE CONTRACT
--   The window walks (value_date, id) — the same total order used by
--   public.lease_balance for FIFO ageing. `id` is not decorative: rent charges
--   share a value_date (the 1st of the month), and without a unique tie-break
--   the running balance would be non-deterministic between requests and
--   LIMIT/OFFSET pagination could repeat or skip rows. Callers MUST order by
--   (value_date, id) — ascending or descending — for the column to read
--   monotonically.
--
--   ROWS BETWEEN (not the default RANGE) makes the frame per-row rather than
--   per-peer-group. With a unique tie-break the two are equivalent today; being
--   explicit keeps it that way if the ordering ever loosens.
--
-- FILTERING SEMANTICS (bank-statement behaviour, intentional)
--   Predicates on the PARTITION BY column are pushed into the window, so
--   filtering to one lease/property/treasury computes that account's own series.
--   Predicates on any other column (value_date range, description search) are
--   applied AFTER the window, so a date-filtered page shows balances that
--   already carry forward from before the window — exactly how a bank statement
--   reads. A consequence: a *text* filter produces a series with gaps, whose
--   jumps do not correspond to visible rows. The UI disables the column in that
--   case rather than showing a misleading series.
--
-- SECURITY INVOKER: respects the RLS policies of the querying user.
--
--   !! RLS INTERACTION — READ BEFORE EXPOSING property_statement TO TENANTS !!
--   A window function aggregates only the rows the caller can SEE. The
--   financial_entry SELECT policy is
--       is_landlord() OR lease_id = ANY(get_tenant_lease_ids())
--   so lease visibility is all-or-nothing per lease: lease_statement is correct
--   for tenants. property_statement is NOT — a tenant sees only the subset of a
--   property's entries that belong to their own leases, so the running balance
--   would silently be a partial sum. property_statement and treasury_statement
--   are landlord/admin surfaces only; the page layer must keep denying tenants.

-- ================================================
-- VIEW: LEASE STATEMENT
-- ================================================
-- The tenant receivable ledger. running_balance < 0 means the tenant owes.

CREATE VIEW public.lease_statement
WITH (security_invoker = true) AS
SELECT
    fe.*,
    SUM(fe.amount) OVER (
        PARTITION BY fe.lease_id
        ORDER BY fe.value_date, fe.id
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS running_balance
FROM public.financial_entry fe
WHERE fe.lease_id IS NOT NULL;

-- ================================================
-- VIEW: PROPERTY STATEMENT
-- ================================================
-- Cumulative property result (income less expenses) entry by entry.

CREATE VIEW public.property_statement
WITH (security_invoker = true) AS
SELECT
    fe.*,
    SUM(fe.amount) OVER (
        PARTITION BY fe.property_id
        ORDER BY fe.value_date, fe.id
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS running_balance
FROM public.financial_entry fe
WHERE fe.property_id IS NOT NULL;

-- ================================================
-- VIEW: TREASURY STATEMENT
-- ================================================
-- Cash on hand entry by entry — the series to reconcile line-by-line against a
-- bank statement. running_balance is the closing balance after each movement.

CREATE VIEW public.treasury_statement
WITH (security_invoker = true) AS
SELECT
    fe.*,
    SUM(fe.amount) OVER (
        PARTITION BY fe.treasury_id
        ORDER BY fe.value_date, fe.id
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS running_balance
FROM public.financial_entry fe
WHERE fe.treasury_id IS NOT NULL;

-- ================================================
-- INDEXES
-- ================================================
-- The per-lease and per-treasury ledgers already have (col, value_date)
-- composites from the initial index migration; the per-property ledger had
-- none, so its statement would sort the whole partition on every page request.
-- `id` is appended to match the window's ordering key exactly, letting the
-- planner satisfy the window ORDER BY from the index.
CREATE INDEX idx_financial_entries_property_value
    ON public.financial_entry(property_id, value_date, id);

-- ================================================
-- VIEW PRIVILEGES (GRANTS)
-- ================================================
-- All three are security_invoker = true, so the querying user's RLS policies
-- decide which rows are visible. SELECT is granted so PostgREST can attempt
-- the query at all.
GRANT SELECT
    ON public.lease_statement,
           public.property_statement,
           public.treasury_statement
    TO authenticated, anon;


