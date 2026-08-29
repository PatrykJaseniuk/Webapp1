import { formatPln } from './format';
import { balanceGlyph, balanceToneClass, type PageBalances } from './statement';

type Props = {
  readonly balances: PageBalances | null;
  /** Wording for a negative balance in this account's terms, e.g. "zaległość". */
  readonly negativeLabel: string;
  readonly contiguous: boolean;
};

const BalanceValue = ({
  value,
  negativeLabel,
}: {
  readonly value: number;
  readonly negativeLabel: string;
}): JSX.Element => (
  <span className={`font-mono tabular-nums font-semibold ${balanceToneClass(value)}`}>
    <span aria-hidden="true">{balanceGlyph(value)} </span>
    {formatPln(value)}
    {value < 0 ? <span className="sr-only"> ({negativeLabel})</span> : null}
  </span>
);

/**
 * Opening/closing balance strip for a paginated statement.
 *
 * Both figures describe the CURRENT PAGE, and say so — a paginated grid cannot
 * honestly claim to show the opening balance of the whole filtered period.
 */
export const StatementSummaryS = ({
  balances,
  negativeLabel,
  contiguous,
}: Props): JSX.Element =>
  balances === null ? (
    <></>
  ) : (
    <dl className="mb-2 flex flex-wrap items-center gap-x-6 gap-y-1 rounded-md bg-gray-50 px-3 py-2 text-xs">
      <div className="flex items-center gap-2">
        <dt className="font-medium text-gray-500">Z przeniesienia</dt>
        <dd>
          <BalanceValue value={balances.broughtForward} negativeLabel={negativeLabel} />
        </dd>
      </div>
      <div className="flex items-center gap-2">
        <dt className="font-medium text-gray-500">Saldo po ostatniej pozycji na stronie</dt>
        <dd>
          <BalanceValue value={balances.closing} negativeLabel={negativeLabel} />
        </dd>
      </div>
      {contiguous ? null : (
        <p className="text-amber-700">
          ⚠ Filtr tekstowy ukrywa część pozycji — kolumna salda jest wyłączona.
        </p>
      )}
    </dl>
  );
