// Pure helpers for rendering a ledger as a statement (running-balance column).
//
// The running balance itself is computed in SQL by the *_statement views — it
// cannot be derived client-side, because the balance of the first row on page 2
// depends on rows the page never fetched. These helpers only describe the page
// the user is currently looking at.

type SortDirection = 'asc' | 'desc';

export type StatementRow = {
  readonly amount: number;
  readonly running_balance: number;
};

export type PageBalances = {
  /** Account balance immediately BEFORE the oldest entry shown on this page. */
  readonly broughtForward: number;
  /** Account balance AFTER the newest entry shown on this page. */
  readonly closing: number;
};

// Rounding back to whole cents keeps binary floating point from leaving a
// 0.00000000001 residue on screen. Both operands are exact cent values coming
// from numeric columns, and this is a single subtraction — never an
// accumulation, which is why it is safe to do here at all. Every real
// aggregate in this system is summed in SQL.
const toCents = (value: number): number => Math.round(value * 100) / 100;

/**
 * Derives the brought-forward and closing balance of the CURRENT PAGE.
 *
 * `broughtForward` is the oldest visible row's running balance minus that row's
 * own amount — i.e. the balance the account carried into this page. No extra
 * query is needed for it.
 *
 * Returns null for an empty page, where neither balance is defined.
 */
export const pageBalances = (
  rows: readonly StatementRow[],
  direction: SortDirection,
): PageBalances | null => {
  const oldest = direction === 'desc' ? rows.at(-1) : rows.at(0);
  const newest = direction === 'desc' ? rows.at(0) : rows.at(-1);
  return oldest === undefined || newest === undefined
    ? null
    : {
        broughtForward: toCents(oldest.running_balance - oldest.amount),
        closing: newest.running_balance,
      };
};

/**
 * A running balance only reads correctly when consecutive rows are consecutive
 * ENTRIES of the account. Date-range filters preserve that (they trim the ends
 * of the series and the balance carries forward); a free-text filter does not —
 * it removes rows from the middle, so the visible balances would jump by
 * amounts the user cannot see. In that case the column is suppressed rather
 * than shown misleadingly.
 */
export const isBalanceSeriesContiguous = (textFilter: string | undefined): boolean =>
  (textFilter ?? '').length === 0;

/**
 * A balance is a STATE, not a movement, so it is not colour-graded per row the
 * way an amount is. Only the sign is marked, and it is marked with a glyph as
 * well as a colour — colour alone must never carry meaning (WCAG 1.4.1). The
 * caller supplies the wording, because a negative balance means "tenant owes"
 * on a lease, "loss" on a property and "overdrawn" on a treasury.
 */
export const balanceGlyph = (balance: number): string => (balance < 0 ? '▼' : balance > 0 ? '▲' : '–');

export const balanceToneClass = (balance: number): string =>
  balance < 0 ? 'text-red-700' : balance > 0 ? 'text-gray-900' : 'text-gray-500';

