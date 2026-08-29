const DATE_FMT = new Intl.DateTimeFormat('pl-PL', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

// Money is rendered with a FIXED two decimals and grouping forced from the
// fourth digit, so every amount in a column has the same shape and the decimal
// separators line up:
//
//   1 000,00 zł        not  1000 zł
//   1 000,50 zł        not  1000,5 zł
//   1 234,57 zł        not  1234,567 zł
//
// `useGrouping: 'always'` is required because pl-PL groups only from five
// digits by default (ICU minimumGroupingDigits = 2), which would render 1000
// and 10 000 with different shapes in the same column.
//
// The currency style supplies the `zł` suffix preceded by a non-breaking space,
// so an amount never wraps across two lines.
// `useGrouping: 'always'` is the ES2023 form of the option (TypeScript exposes
// it by augmenting `Intl.NumberFormatOptionsUseGroupingRegistry`, which the
// ES2023 lib does — hence `lib: ES2023` in tsconfig.json).
const PLN_FMT = new Intl.NumberFormat('pl-PL', {
  style: 'currency',
  currency: 'PLN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: 'always',
});

export const formatDate = (iso: string): string => DATE_FMT.format(new Date(iso));

// `-0` (produced by e.g. `0 * -1`, or a negated zero balance) would otherwise
// render as "-0,00 zł". Normalising to `0` keeps a zero balance unsigned.
export const formatPln = (amount: number): string =>
  PLN_FMT.format(amount === 0 ? 0 : amount);
