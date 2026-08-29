import { describe, it, expect } from 'vitest';
import { formatDate, formatPln } from './format';

// pl-PL currency formatting inserts NON-BREAKING spaces (U+00A0) both as the
// group separator and before the `zł` suffix. Tests spell them out explicitly —
// a literal space here would make these assertions silently wrong.
const NBSP = '\u00A0';

describe('formatPln', () => {
  it('always renders exactly two decimals for a whole amount', () => {
    expect(formatPln(1000)).toBe(`1${NBSP}000,00${NBSP}zł`);
  });

  it('pads a single decimal to two', () => {
    expect(formatPln(1000.5)).toBe(`1${NBSP}000,50${NBSP}zł`);
  });

  it('rounds a sub-cent value to two decimals', () => {
    expect(formatPln(1234.567)).toBe(`1${NBSP}234,57${NBSP}zł`);
  });

  it('groups thousands from the fourth digit', () => {
    expect(formatPln(1000)).toContain(`1${NBSP}000`);
  });

  it('groups every three digits for large amounts', () => {
    expect(formatPln(99999999.99)).toBe(`99${NBSP}999${NBSP}999,99${NBSP}zł`);
  });

  it('does not group a three-digit amount', () => {
    expect(formatPln(250)).toBe(`250,00${NBSP}zł`);
  });

  it('keeps the sign for a negative amount', () => {
    expect(formatPln(-2500)).toBe(`-2${NBSP}500,00${NBSP}zł`);
  });

  it('renders zero unsigned', () => {
    expect(formatPln(0)).toBe(`0,00${NBSP}zł`);
  });

  it('normalises negative zero to unsigned zero', () => {
    expect(formatPln(-0)).toBe(`0,00${NBSP}zł`);
  });

  it('uses a non-breaking space before the currency suffix so amounts never wrap', () => {
    expect(formatPln(1)).toBe(`1,00${NBSP}zł`);
  });

  it('produces the same character width for every amount of equal magnitude', () => {
    // The property that makes a money column readable: same digit count in,
    // same string shape out.
    expect(formatPln(1000).length).toBe(formatPln(2500.5).length);
  });
});

describe('formatDate', () => {
  it('renders an ISO date as zero-padded pl-PL', () => {
    expect(formatDate('2026-01-05')).toBe('05.01.2026');
  });

  it('zero-pads both day and month', () => {
    expect(formatDate('2026-11-30')).toBe('30.11.2026');
  });
});
