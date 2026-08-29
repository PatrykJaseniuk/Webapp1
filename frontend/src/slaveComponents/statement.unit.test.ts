import { describe, it, expect } from 'vitest';
import { isBalanceSeriesContiguous, pageBalances, type StatementRow } from './statement';

// A page of a lease statement, newest first (the UI default). Reads as:
//   -3500 charge  -> balance -3500
//   +3500 payment -> balance     0
// so the page was entered with a balance of 0.
const DESC_PAGE: readonly StatementRow[] = [
  { amount: 3500, running_balance: 0 },
  { amount: -3500, running_balance: -3500 },
];

const ASC_PAGE: readonly StatementRow[] = [
  { amount: -3500, running_balance: -3500 },
  { amount: 3500, running_balance: 0 },
];

describe('pageBalances', () => {
  it('derives the brought-forward balance from the oldest row when sorted desc', () => {
    expect(pageBalances(DESC_PAGE, 'desc')?.broughtForward).toBe(0);
  });

  it('reports the newest row balance as closing when sorted desc', () => {
    expect(pageBalances(DESC_PAGE, 'desc')?.closing).toBe(0);
  });

  it('derives the brought-forward balance from the first row when sorted asc', () => {
    expect(pageBalances(ASC_PAGE, 'asc')?.broughtForward).toBe(0);
  });

  it('reports the last row balance as closing when sorted asc', () => {
    expect(pageBalances(ASC_PAGE, 'asc')?.closing).toBe(0);
  });

  it('is direction-independent for the same underlying page', () => {
    expect(pageBalances(DESC_PAGE, 'desc')).toEqual(pageBalances(ASC_PAGE, 'asc'));
  });

  it('carries a non-zero opening balance forward', () => {
    // Page opens at -500, one +200 payment lands, closing -300.
    const rows: readonly StatementRow[] = [{ amount: 200, running_balance: -300 }];
    expect(pageBalances(rows, 'desc')).toEqual({ broughtForward: -500, closing: -300 });
  });

  it('returns null for an empty page', () => {
    expect(pageBalances([], 'desc')).toBeNull();
  });

  it('handles a single-row page', () => {
    const rows: readonly StatementRow[] = [{ amount: -1200.5, running_balance: -1200.5 }];
    expect(pageBalances(rows, 'desc')).toEqual({ broughtForward: 0, closing: -1200.5 });
  });

  it('rounds the derived balance to whole cents', () => {
    // 0.3 - 0.1 is 0.19999999999999998 in binary floating point.
    const rows: readonly StatementRow[] = [{ amount: 0.1, running_balance: 0.3 }];
    expect(pageBalances(rows, 'desc')?.broughtForward).toBe(0.2);
  });
});

describe('isBalanceSeriesContiguous', () => {
  it('is contiguous when no text filter is applied', () => {
    expect(isBalanceSeriesContiguous(undefined)).toBe(true);
  });

  it('is contiguous for an empty text filter', () => {
    expect(isBalanceSeriesContiguous('')).toBe(true);
  });

  it('is NOT contiguous when a text filter removes rows from the middle', () => {
    expect(isBalanceSeriesContiguous('czynsz')).toBe(false);
  });
});
