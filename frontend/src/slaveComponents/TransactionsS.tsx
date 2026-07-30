import { match } from 'ts-pattern';
import type { TransactionsSProps } from '@/masterComponents/TransactionsM';
import { ErrorMessage } from './ErrorMessageS';

type Row = Extract<TransactionsSProps['asyncData'], { tag: 'fulfilled' }>['data'][number];
type NavLinkTo = TransactionsSProps['navLinkTo'];
type Sort = TransactionsSProps['sort'];
type SortColumn = Sort['config']['column'];
type TxnType = Row['type'];
type TxnStatus = Row['transaction_status'];

const TRANSACTION_TYPE_LABEL: Readonly<Record<TxnType, string>> = Object.freeze({
  rent: 'Czynsz',
  utility: 'Media',
  expense: 'Wydatek',
  payment: 'Wpłata',
  withdraw: 'Wypłata',
  fee: 'Opłata',
  other: 'Inne',
});

const TRANSACTION_STATUS_LABEL: Readonly<Record<TxnStatus, string>> = Object.freeze({
  pending: 'Oczekująca',
  paid: 'Opłacona',
  overdue: 'Zaległa',
});

const DATE_FMT = new Intl.DateTimeFormat('pl-PL', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const pillClass = 'inline-block rounded-full px-2 py-0.5 text-xs font-medium';

const txnStatusPillClass = (status: TxnStatus): string =>
  status === 'paid' ?
    `${pillClass} bg-green-50 text-green-700` :
    status === 'overdue' ?
      `${pillClass} bg-red-50 text-red-700` :
      `${pillClass} bg-yellow-50 text-yellow-700`;

const EXPENSE_TYPES: ReadonlySet<TxnType> = new Set(['expense', 'withdraw', 'fee']);
const INCOME_TYPES: ReadonlySet<TxnType> = new Set(['payment', 'rent']);

const txnAmountClass = (type: TxnType, amount: number): string =>
  EXPENSE_TYPES.has(type) ? 'text-sm font-medium text-red-700' :
    INCOME_TYPES.has(type) ? 'text-sm font-medium text-green-700' :
      `text-sm font-medium ${amount >= 0 ? 'text-green-700' : 'text-red-700'}`;

const formatAmount = (type: TxnType, amount: number): string =>
  `${EXPENSE_TYPES.has(type) ? '−' : ''}${Math.abs(amount).toLocaleString('pl-PL')} zł`;

const SORT_TRIANGLE_INACTIVE = '△';
const SORT_TRIANGLE_ASC = '▲';
const SORT_TRIANGLE_DESC = '▼';

type SortHeaderProps = {
  readonly column: SortColumn;
  readonly label: string;
  readonly sort: Sort;
  readonly align?: 'left' | 'right';
  readonly className?: string;
};

const SortHeader = ({
  column,
  label,
  sort,
  align = 'left',
  className = '',
}: SortHeaderProps): JSX.Element => {
  const isActive = sort.config.column === column;
  const direction = isActive ? sort.config.direction : null;
  const ariaSort = isActive ? (direction === 'asc' ? 'ascending' as const : 'descending' as const) : 'none' as const;
  const triangle = direction === 'asc' ? SORT_TRIANGLE_ASC : direction === 'desc' ? SORT_TRIANGLE_DESC : SORT_TRIANGLE_INACTIVE;
  const alignClass = align === 'right' ? 'text-right' : 'text-left';
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      sort.doSort(column);
    }
  };
  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className={`${className} py-3 pr-4 font-medium whitespace-nowrap ${alignClass}`}
    >
      <button
        type="button"
        tabIndex={0}
        className="cursor-pointer select-none text-gray-500 hover:text-gray-700 focus:outline-hidden"
        onClick={() => sort.doSort(column)}
        onKeyDown={handleKeyDown}
      >
        {label}
        <span className="ml-1 inline-block w-3 text-xs text-gray-400" aria-hidden="true">
          {triangle}
        </span>
      </button>
    </th>
  );
};

type TableProps = {
  readonly transactions: readonly Row[];
  readonly navLinkTo: NavLinkTo;
  readonly sort: Sort;
  readonly isFetching: boolean;
};

const FetchProgress = (): JSX.Element => (
  <div className="absolute top-0 left-0 right-0 h-0.5 overflow-hidden bg-blue-100" role="progressbar" aria-label="Ładowanie danych">
    <div className="h-full animate-[indeterminate_1.5s_ease-in-out_infinite] bg-blue-500" />
  </div>
);

const skeletonBar = 'h-4 animate-pulse rounded bg-gray-200';

const SORT_TRIANGLE_INACTIVE_SPAN = <span className="ml-1 inline-block w-3 text-xs text-gray-400" aria-hidden="true">{SORT_TRIANGLE_INACTIVE}</span>;

const SKELETON_HEADERS = (
  <tr className="border-b border-gray-200 text-sm">
    <th scope="col" className="pl-4 w-8 py-3 pr-6" />
    <th scope="col" className="w-[10%] py-3 pr-4 font-medium whitespace-nowrap text-gray-500">Data{SORT_TRIANGLE_INACTIVE_SPAN}</th>
    <th scope="col" className="w-[8%] py-3 pr-4 font-medium whitespace-nowrap text-gray-500">Typ{SORT_TRIANGLE_INACTIVE_SPAN}</th>
    <th scope="col" className="w-[24%] py-3 pr-4 font-medium text-gray-500">Opis</th>
    <th scope="col" className="w-[16%] py-3 pr-4 font-medium whitespace-nowrap text-gray-500">Nieruchomość{SORT_TRIANGLE_INACTIVE_SPAN}</th>
    <th scope="col" className="w-[18%] py-3 pr-4 font-medium text-gray-500">Umowa</th>
    <th scope="col" className="w-[10%] py-3 pr-4 text-right font-medium whitespace-nowrap text-gray-500">Kwota{SORT_TRIANGLE_INACTIVE_SPAN}</th>
    <th scope="col" className="w-[14%] py-3 pr-4 font-medium whitespace-nowrap text-gray-500">Status{SORT_TRIANGLE_INACTIVE_SPAN}</th>
  </tr>
);

const SKELETON_ROWS = Array.from({ length: 6 }, (_, i) => (
  <tr key={`skel-${i}`} className="border-b border-gray-100">
    <td className="pl-4 py-3 pr-6"><div className={`${skeletonBar} w-6`} /></td>
    <td className="py-3 pr-4"><div className={`${skeletonBar} w-20`} /></td>
    <td className="py-3 pr-4"><div className={`${skeletonBar} w-16`} /></td>
    <td className="py-3 pr-4"><div className={`${skeletonBar} w-32`} /></td>
    <td className="py-3 pr-4"><div className={`${skeletonBar} w-28`} /></td>
    <td className="py-3 pr-4"><div className={`${skeletonBar} w-24`} /></td>
    <td className="py-3 pr-4"><div className={`${skeletonBar} ml-auto w-16`} /></td>
    <td className="py-3 pr-4"><div className={`${skeletonBar} w-20`} /></td>
  </tr>
));

const SkeletonTable = (): JSX.Element => (
  <div className="relative overflow-x-auto">
    <FetchProgress />
    <table className="w-full min-w-[640px] table-fixed border-collapse text-left">
      <thead>{SKELETON_HEADERS}</thead>
      <tbody>{SKELETON_ROWS}</tbody>
    </table>
  </div>
);

const leaseLabel = (tx: Row): string => {
  const startDate = tx.lease_agreements?.start_date;
  const id8 = tx.lease_id?.slice(0, 8);
  return startDate !== null && startDate !== undefined ?
    `Umowa od ${DATE_FMT.format(new Date(startDate))}` :
    id8 !== undefined ? `Umowa #${id8}` : '—';
};

const TableView = ({
  transactions,
  navLinkTo,
  sort,
  isFetching,
}: TableProps): JSX.Element => (
  <div>
    {transactions.length > 0 && (
      <p className="mb-2 text-sm text-gray-500">
        Znaleziono {transactions.length} transakcji
      </p>
    )}
    <div className="relative overflow-x-auto">
      {isFetching && <FetchProgress />}
      <table className="w-full min-w-[640px] table-fixed border-collapse text-left">
        <thead>
          <tr className="border-b border-gray-200 text-sm">
            <th scope="col" className="pl-4 w-8 py-3 pr-6" />
            <SortHeader className="w-[10%]" column="due_date" label="Data" sort={sort} />
            <SortHeader className="w-[8%]" column="type" label="Typ" sort={sort} />
            <th scope="col" className="w-[24%] py-3 pr-4 font-medium text-gray-500">Opis</th>
            <SortHeader className="w-[16%]" column="properties" label="Nieruchomość" sort={sort} />
            <th scope="col" className="w-[18%] py-3 pr-4 font-medium text-gray-500">Umowa</th>
            <SortHeader className="w-[10%]" column="amount" label="Kwota" sort={sort} align="right" />
            <SortHeader className="w-[14%]" column="transaction_status" label="Status" sort={sort} />
          </tr>
        </thead>
        <tbody>
          {transactions.length === 0 ?
            <tr>
              <td colSpan={8} className="py-12 text-center">
                <svg className="mx-auto mb-3 h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18M9 6h.01M15 18h.01M3 6v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <p className="text-sm font-medium text-gray-600">Nie znaleziono transakcji</p>
                <p className="mt-1 text-xs text-gray-400">Transakcje pojawią się tutaj po dodaniu pierwszej umowy najmu.</p>
              </td>
            </tr> :
            transactions.map((tx) => (
              <tr
                key={tx.id}
                className="group border-b border-gray-100 text-sm hover:bg-blue-50"
              >
                <td className="pl-4 py-3 pr-6 [&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline">
                  {navLinkTo.transaction({ id: tx.id, style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '4px' }, content: '→', ariaLabel: 'Szczegóły transakcji' })}
                </td>
                <td className="py-3 pr-4 text-gray-600">{DATE_FMT.format(new Date(tx.due_date))}</td>
                <td className="py-3 pr-4 text-gray-600">{TRANSACTION_TYPE_LABEL[tx.type] ?? tx.type}</td>
                <td className="py-3 pr-4 text-gray-600 truncate" title={tx.description ?? undefined}>{tx.description ?? '—'}</td>
                <td className="py-3 pr-4 [&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline">
                  {tx.property_id !== null && tx.properties !== null && tx.properties.name !== null ?
                    navLinkTo.property({ id: tx.property_id, style: {}, content: tx.properties.name }) :
                    <span className="text-gray-400">—</span>}
                </td>
                <td className="py-3 pr-4 [&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline">
                  {tx.lease_id !== null ?
                    navLinkTo.lease({ id: tx.lease_id, style: {}, content: leaseLabel(tx) }) :
                    <span className="text-gray-400">—</span>}
                </td>
                <td className={`py-3 pr-4 text-right ${txnAmountClass(tx.type, tx.amount)}`}>{formatAmount(tx.type, tx.amount)}</td>
                <td className="py-3 pr-4">
                  <span className={txnStatusPillClass(tx.transaction_status)} role="status">
                    {TRANSACTION_STATUS_LABEL[tx.transaction_status] ?? tx.transaction_status}
                  </span>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const TransactionsS = ({
  asyncData,
  navLinkTo,
  sort,
}: TransactionsSProps): JSX.Element => (
  <div className="min-h-[300px]">
    {match(asyncData)
      .with({ tag: 'pending' }, () => <SkeletonTable />)
      .with({ tag: 'rejected' }, ({ message, onRetry }) => (
        <ErrorMessage message={message} onRetry={onRetry} />
      ))
      .with({ tag: 'fulfilled' }, ({ data, isFetching }) => (
        <TableView transactions={data} navLinkTo={navLinkTo} sort={sort} isFetching={isFetching ?? false} />
      ))
      .exhaustive()}
  </div>
);