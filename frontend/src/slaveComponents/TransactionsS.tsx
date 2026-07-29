import { match } from 'ts-pattern';
import type { TransactionsSProps } from '@/masterComponents/TransactionsM';
import { LoadingSpinner } from './LoadingSpinnerS';
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
};

const SortHeader = ({
  column,
  label,
  sort,
  align = 'left',
}: SortHeaderProps): JSX.Element => {
  const isActive = sort.config.column === column;
  const isAsc = isActive && sort.config.direction === 'asc';
  const isDesc = isActive && sort.config.direction === 'desc';
  const alignClass = align === 'right' ? 'text-right' : 'text-left';
  return (
    <th
      className={`cursor-pointer select-none py-3 pr-4 font-medium whitespace-nowrap ${alignClass}`}
      onClick={() => sort.doSort(column)}
    >
      <span className="text-gray-500">{label}</span>
      <span className="ml-1 inline-block w-3 text-xs text-gray-400">
        {isAsc ? '▲' : isDesc ? '▼' : '△'}
      </span>
    </th>
  );
};

type TableBodyProps = {
  readonly transactions: readonly Row[];
  readonly navLinkTo: NavLinkTo;
  readonly sort: Sort;
};

const TableBody = ({
  transactions,
  navLinkTo,
  sort,
}: TableBodyProps): JSX.Element =>
  transactions.length === 0 ?
    <p className="py-8 text-center text-gray-500">Brak transakcji.</p> :
    (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-200 text-sm">
              <th className="pl-4 w-8 py-3 pr-4" />
              <SortHeader column="due_date" label="Data" sort={sort} />
              <SortHeader column="type" label="Typ" sort={sort} />
              <th className="py-3 pr-4 font-medium text-gray-500">Opis</th>
              <SortHeader column="properties" label="Nieruchomość" sort={sort} />
              <th className="py-3 pr-4 font-medium text-gray-500">Umowa</th>
              <SortHeader column="amount" label="Kwota" sort={sort} align="right" />
              <SortHeader column="transaction_status" label="Status" sort={sort} />
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr
                key={tx.id}
                className="group border-b border-gray-100 text-sm hover:bg-blue-50"
              >
                <td className="pl-4 py-3 pr-4 [&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline">
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
      .with({ tag: 'pending' }, () => <LoadingSpinner />)
      .with({ tag: 'rejected' }, ({ message, onRetry }) => (
        <ErrorMessage message={message} onRetry={onRetry} />
      ))
      .with({ tag: 'fulfilled' }, ({ data }) => (
        <TableBody
          transactions={data}
          navLinkTo={navLinkTo}
          sort={sort}
        />
      ))
      .exhaustive()}
  </div>
);