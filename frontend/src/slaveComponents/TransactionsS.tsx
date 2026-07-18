import type { ReactNode } from "react";
import { match } from 'ts-pattern';
import type { TransactionsSProps } from '@/masterComponents/TransactionsM';
import { LoadingSpinner } from './LoadingSpinnerS';
import { ErrorMessage } from './ErrorMessageS';

type Row = Extract<TransactionsSProps['asyncData'], { tag: 'fulfilled' }>['data'][number];
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

type TableBodyProps = {
  readonly transactions: readonly Row[];
  readonly onTransactionClick: (id: string) => void;
  readonly renderPropertyLink: (propertyId: string, name: string) => ReactNode;
  readonly renderLeaseLink: (leaseId: string) => ReactNode;
};

const TableBody = ({
  transactions,
  onTransactionClick,
  renderPropertyLink,
  renderLeaseLink,
}: TableBodyProps): JSX.Element =>
  transactions.length === 0 ?
    <p className="py-8 text-center text-gray-500">Brak transakcji.</p> :
    (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-200 text-sm text-gray-500">
              <th className="py-3 pr-4 font-medium">Data</th>
              <th className="py-3 pr-4 font-medium">Typ</th>
              <th className="py-3 pr-4 font-medium">Opis</th>
              <th className="py-3 pr-4 font-medium">Nieruchomość</th>
              <th className="py-3 pr-4 font-medium">Umowa</th>
              <th className="py-3 pr-4 font-medium text-right">Kwota</th>
              <th className="py-3 pr-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr
                key={tx.id}
                className="cursor-pointer border-b border-gray-100 text-sm hover:bg-blue-50"
                onClick={() => { onTransactionClick(tx.id); }}
              >
                <td className="py-3 pr-4 text-gray-600">{tx.due_date}</td>
                <td className="py-3 pr-4 text-gray-600">{TRANSACTION_TYPE_LABEL[tx.type] ?? tx.type}</td>
                <td className="py-3 pr-4 text-gray-600">{tx.description ?? '—'}</td>
                <td className="py-3 pr-4">
                  {tx.property_id !== null && tx.properties?.name !== null ?
                    renderPropertyLink(tx.property_id, tx.properties!.name!) :
                    <span className="text-gray-400">—</span>}
                </td>
                <td className="py-3 pr-4">
                  {tx.lease_id !== null ?
                    renderLeaseLink(tx.lease_id) :
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
  onTransactionClick,
  renderPropertyLink,
  renderLeaseLink,
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
          onTransactionClick={onTransactionClick}
          renderPropertyLink={renderPropertyLink}
          renderLeaseLink={renderLeaseLink}
        />
      ))
      .exhaustive()}
  </div>
);