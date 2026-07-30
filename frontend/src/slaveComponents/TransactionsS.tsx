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

const AMOUNT_FMT = new Intl.NumberFormat('pl-PL', {
  style: 'currency',
  currency: 'PLN',
});

const pillClass = 'inline-block rounded-full px-2 py-0.5 text-xs font-medium';

const txnStatusPillClass = (status: TxnStatus): string =>
  status === 'paid' ?
    `${pillClass} bg-green-50 text-green-700` :
    status === 'overdue' ?
      `${pillClass} bg-red-50 text-red-700` :
      `${pillClass} bg-yellow-50 text-yellow-700`;

const txnAmountClass = (amount: number): string =>
  amount >= 0 ? 'text-sm font-medium text-green-700' : 'text-sm font-medium text-red-700';

const formatAmount = (amount: number): string =>
  AMOUNT_FMT.format(amount);

type ColumnDef = {
  readonly key: string;
  readonly label: string | null;
  readonly sortColumn: SortColumn | null;
  readonly align: 'left' | 'right';
  readonly className: string;
};

const COLUMNS: readonly ColumnDef[] = [
  { key: 'action', label: null, sortColumn: null, align: 'left', className: 'pl-4 w-10 pr-6' },
  { key: 'due_date', label: 'Termin', sortColumn: 'due_date', align: 'left', className: 'w-[120px] pr-4' },
  { key: 'type', label: 'Typ', sortColumn: 'type', align: 'left', className: 'w-[100px] pr-4' },
  { key: 'description', label: 'Opis', sortColumn: null, align: 'left', className: 'w-[250px] pr-4' },
  { key: 'properties', label: 'Nieruchomość', sortColumn: 'properties', align: 'left', className: 'w-[200px] pr-4' },
  { key: 'lease', label: 'Umowa', sortColumn: null, align: 'left', className: 'w-[180px] pr-4' },
  { key: 'status', label: 'Status', sortColumn: 'transaction_status', align: 'left', className: 'w-[120px] pr-4' },
  { key: 'amount', label: 'Kwota', sortColumn: 'amount', align: 'right', className: 'w-[120px] pr-4' },
];

const SortIcon = ({ direction }: { readonly direction: 'asc' | 'desc' | null }): JSX.Element => (
  <svg
    className={`ml-1 inline-block h-3 w-3 transition-opacity ${
      direction === null ?
        'opacity-30 group-hover:opacity-60 group-focus-visible:opacity-60' :
        'text-blue-600 opacity-100'
    } ${direction === 'desc' ? 'rotate-180' : ''}`}
    viewBox="0 0 12 12"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M6 3l4.5 6h-9z" />
  </svg>
);

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
  const direction: 'asc' | 'desc' | null = isActive ? sort.config.direction : null;
  const ariaSort = isActive ? (direction === 'asc' ? 'ascending' as const : 'descending' as const) : 'none' as const;
  const alignClass = align === 'right' ? 'text-right' : 'text-left';
  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className={`${className} h-12 py-0 font-medium whitespace-nowrap ${alignClass}`}
    >
      <button
        type="button"
        className="group cursor-pointer select-none rounded-sm text-gray-500 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        onClick={() => sort.doSort(column)}
      >
        {label}
        <SortIcon direction={direction} />
      </button>
    </th>
  );
};

const StaticHeaderCell = ({ col }: { readonly col: ColumnDef }): JSX.Element => (
  <th
    scope="col"
    className={`${col.className} h-12 py-0 font-medium text-gray-500 ${col.align === 'right' ? 'text-right' : 'text-left'}`}
  >
    {col.label === null ? <span className="sr-only">Akcje</span> : col.label}
  </th>
);

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

const SKELETON_ROWS = Array.from({ length: 6 }, (_, i) => (
  <tr key={`skel-${i}`} className="border-b border-gray-100">
    <td className="pl-4 h-12 py-0 pr-6"><div className={`${skeletonBar} w-6`} /></td>
    <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} w-20`} /></td>
    <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} w-16`} /></td>
    <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} w-32`} /></td>
    <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} w-28`} /></td>
    <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} w-24`} /></td>
    <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} w-16`} /></td>
    <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} ml-auto w-20`} /></td>
  </tr>
));

const SkeletonTable = (): JSX.Element => (
  <div className="relative overflow-x-auto">
    <FetchProgress />
    <table className="table-fixed border-collapse text-left">
      <thead>
        <tr className="border-b border-gray-200 text-sm">
          {COLUMNS.map((col) => (
            <StaticHeaderCell key={col.key} col={col} />
          ))}
        </tr>
      </thead>
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
  <div className="relative overflow-x-auto">
      {isFetching && <FetchProgress />}
      <table className="table-fixed border-collapse text-left">
        <thead>
          <tr className="border-b border-gray-200 text-sm">
            {COLUMNS.map((col) =>
              col.sortColumn !== null && col.label !== null ?
                <SortHeader
                  key={col.key}
                  className={col.className}
                  column={col.sortColumn}
                  label={col.label}
                  sort={sort}
                  align={col.align}
                /> :
                <StaticHeaderCell key={col.key} col={col} />)}
          </tr>
        </thead>
        <tbody>
          {transactions.length === 0 ?
            <tr>
              <td colSpan={COLUMNS.length} className="py-12 text-center">
                <svg className="mx-auto mb-3 h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18M9 6h.01M15 18h.01M3 6v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <p className="text-sm font-medium text-gray-600">Brak transakcji do wyświetlenia</p>
                <p className="mt-1 text-xs text-gray-500">Dodaj pierwszą transakcję, aby zobaczyć ją na liście.</p>
              </td>
            </tr> :
            transactions.map((tx) => (
              <tr
                key={tx.id}
                className="group border-b border-gray-100 text-sm hover:bg-gray-50"
              >
                <td className="pl-4 h-12 py-0 pr-6 [&_a]:text-blue-600 hover:[&_a]:text-blue-800 focus-visible:[&_a]:outline-none focus-visible:[&_a]:ring-2 focus-visible:[&_a]:ring-blue-500">
                  {navLinkTo.transaction({ id: tx.id, style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', borderRadius: '6px' }, content: '→', ariaLabel: `Szczegóły transakcji${tx.description !== null ? ': ' + tx.description : ''}` })}
                </td>
                <td className="h-12 py-0 pr-4 text-gray-600 whitespace-nowrap">{DATE_FMT.format(new Date(tx.due_date))}</td>
                <td className="h-12 py-0 pr-4 text-gray-600 whitespace-nowrap">{TRANSACTION_TYPE_LABEL[tx.type] ?? tx.type}</td>
                <td className="h-12 py-0 pr-4 text-gray-600" title={tx.description ?? undefined}>
                  <div className="truncate">
                    {tx.description !== null ? tx.description : <span className="text-gray-400">—</span>}
                  </div>
                </td>
                <td className="h-12 py-0 pr-4 [&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline" title={tx.properties?.name ?? undefined}>
                  <div className="truncate">
                    {tx.property_id !== null && tx.properties !== null && tx.properties.name !== null ?
                      navLinkTo.property({ id: tx.property_id, style: {}, content: tx.properties.name }) :
                      <span className="text-gray-400">—</span>}
                  </div>
                </td>
                <td className="h-12 py-0 pr-4 [&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline" title={tx.lease_id !== null ? leaseLabel(tx) : undefined}>
                  <div className="truncate">
                    {tx.lease_id !== null ?
                      navLinkTo.lease({ id: tx.lease_id, style: {}, content: leaseLabel(tx) }) :
                      <span className="text-gray-400">—</span>}
                  </div>
                </td>
                <td className="h-12 py-0 pr-4">
                  <span className={txnStatusPillClass(tx.transaction_status)}>
                    {TRANSACTION_STATUS_LABEL[tx.transaction_status] ?? tx.transaction_status}
                  </span>
                </td>
                <td className={`h-12 py-0 pr-4 text-right whitespace-nowrap font-mono ${txnAmountClass(tx.amount)}`}>{formatAmount(tx.amount)}</td>
              </tr>
            ))}
        </tbody>
      </table>
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