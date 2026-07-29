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

const pillClass = 'inline-block rounded-full px-2 py-0.5 text-xs font-medium';

const txnStatusPillClass = (status: TxnStatus): string =>
  status === 'paid' ?
    `${pillClass} bg-green-50 text-green-700` :
    status === 'overdue' ?
      `${pillClass} bg-red-50 text-red-700` :
      `${pillClass} bg-yellow-50 text-yellow-700`;

const txnAmountClass = (amount: number): string =>
  `text-sm font-medium ${amount >= 0 ? 'text-green-700' : 'text-red-700'}`;

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
  const isAsc = isActive && sort.config.direction === 'asc';
  const isDesc = isActive && sort.config.direction === 'desc';
  const alignClass = align === 'right' ? 'text-right' : 'text-left';
  return (
    <th
      className={`${className} cursor-pointer select-none py-3 pr-4 font-medium whitespace-nowrap ${alignClass}`}
      onClick={() => sort.doSort(column)}
    >
      <span className="text-gray-500">{label}</span>
      <span className="ml-1 inline-block w-3 text-xs text-gray-400">
        {isAsc ? '▲' : isDesc ? '▼' : '△'}
      </span>
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

const HEADERS = (
  <tr className="border-b border-gray-200 text-sm">
    <th className="pl-4 w-8 py-3 pr-6" />
    <th className="w-[10%] py-3 pr-4 font-medium whitespace-nowrap text-gray-500">Data<span className="ml-1 inline-block w-3" /></th>
    <th className="w-[8%] py-3 pr-4 font-medium whitespace-nowrap text-gray-500">Typ<span className="ml-1 inline-block w-3" /></th>
    <th className="w-[24%] py-3 pr-4 font-medium text-gray-500">Opis</th>
    <th className="w-[16%] py-3 pr-4 font-medium whitespace-nowrap text-gray-500">Nieruchomość<span className="ml-1 inline-block w-3" /></th>
    <th className="w-[18%] py-3 pr-4 font-medium text-gray-500">Umowa</th>
    <th className="w-[10%] py-3 pr-4 text-right font-medium whitespace-nowrap text-gray-500">Kwota<span className="ml-1 inline-block w-3" /></th>
    <th className="w-[14%] py-3 pr-4 font-medium whitespace-nowrap text-gray-500">Status<span className="ml-1 inline-block w-3" /></th>
  </tr>
);

const SKELETON_ROWS = Array.from({ length: 4 }, (_, i) => (
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
      <thead>{HEADERS}</thead>
      <tbody>{SKELETON_ROWS}</tbody>
    </table>
  </div>
);

const TableView = ({
  transactions,
  navLinkTo,
  sort,
  isFetching,
}: TableProps): JSX.Element => (
  <div className="relative overflow-x-auto">
    {isFetching && <FetchProgress />}
    <table className="w-full min-w-[640px] table-fixed border-collapse text-left">
      <thead>
        <tr className="border-b border-gray-200 text-sm">
          <th className="pl-4 w-8 py-3 pr-6" />
          <SortHeader className="w-[10%]" column="due_date" label="Data" sort={sort} />
          <SortHeader className="w-[8%]" column="type" label="Typ" sort={sort} />
          <th className="w-[24%] py-3 pr-4 font-medium text-gray-500">Opis</th>
          <SortHeader className="w-[16%]" column="properties" label="Nieruchomość" sort={sort} />
          <th className="w-[18%] py-3 pr-4 font-medium text-gray-500">Umowa</th>
          <SortHeader className="w-[10%]" column="amount" label="Kwota" sort={sort} align="right" />
          <SortHeader className="w-[14%]" column="transaction_status" label="Status" sort={sort} />
        </tr>
      </thead>
      <tbody>
        {transactions.length === 0 ?
          <tr>
            <td colSpan={8} className="py-8 text-center text-gray-500">
              Brak transakcji.
            </td>
          </tr> :
          transactions.map((tx) => (
            <tr
              key={tx.id}
              className="group border-b border-gray-100 text-sm hover:bg-blue-50"
            >
              <td className="pl-4 py-3 pr-6 [&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline">
                {navLinkTo.transaction({ id: tx.id, style: {}, content: '→', ariaLabel: 'Szczegóły transakcji' })}
              </td>
              <td className="py-3 pr-4 text-gray-600">{new Date(tx.due_date).toLocaleDateString('pl-PL')}</td>
              <td className="py-3 pr-4 text-gray-600">{TRANSACTION_TYPE_LABEL[tx.type] ?? tx.type}</td>
              <td className="py-3 pr-4 text-gray-600">{tx.description ?? '—'}</td>
              <td className="py-3 pr-4 [&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline">
                {tx.property_id !== null && tx.properties !== null && tx.properties.name !== null ?
                  navLinkTo.property({ id: tx.property_id, style: {}, content: tx.properties.name }) :
                  <span className="text-gray-400">—</span>}
              </td>
              <td className="py-3 pr-4 [&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline">
                {tx.lease_id !== null ?
                  navLinkTo.lease({ id: tx.lease_id, style: {}, content: tx.lease_agreements?.start_date !== null && tx.lease_agreements?.start_date !== undefined ? `Umowa od ${tx.lease_agreements.start_date}` : `Umowa #${tx.lease_id.slice(0, 8)}` }) :
                  <span className="text-gray-400">—</span>}
              </td>
              <td className={`py-3 pr-4 text-right ${txnAmountClass(tx.amount)}`}>{tx.amount.toLocaleString('pl-PL')} zł</td>
              <td className="py-3 pr-4">
                <span className={txnStatusPillClass(tx.transaction_status)}>
                  {TRANSACTION_STATUS_LABEL[tx.transaction_status] ?? tx.transaction_status}
                </span>
              </td>
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