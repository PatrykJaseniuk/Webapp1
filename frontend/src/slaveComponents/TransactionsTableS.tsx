import type { ReactNode } from 'react';
import { TRANSACTION_STATUS_LABEL, TRANSACTION_TYPE_LABEL } from './domain';
import { amountClass, txnStatusPillClass } from './pills';
import { formatPln } from './format';

export type TransactionRow = {
  readonly id: string;
  readonly due_date: string;
  readonly type: string;
  readonly description: string | null;
  readonly amount: number;
  readonly transaction_status: string;
};

type TransactionsTableSProps<TRow extends TransactionRow> = {
  readonly transactions: readonly TRow[];
  readonly emptyMessage: string;
  readonly renderTransactionLink: (id: string, content: string) => ReactNode;
  readonly renderLeaseCell?: (tx: TRow) => JSX.Element;
};

export const TransactionsTableS = <TRow extends TransactionRow>({
  transactions,
  emptyMessage,
  renderTransactionLink,
  renderLeaseCell,
}: TransactionsTableSProps<TRow>): JSX.Element =>
  transactions.length === 0 ?
    <p className="text-sm text-gray-500">{emptyMessage}</p> :
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-gray-500">
            <th className="py-2 pr-4 font-medium">Data</th>
            <th className="py-2 pr-4 font-medium">Typ</th>
            <th className="py-2 pr-4 font-medium">Opis</th>
            <th className="py-2 pr-4 font-medium text-right">Kwota</th>
            {renderLeaseCell !== undefined ? <th className="py-2 pr-4 font-medium">Umowa</th> : null}
            <th className="py-2 pr-4 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id} className="border-b border-gray-100 hover:bg-blue-50">
              <td className="py-2 pr-4 [&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline">{renderTransactionLink(tx.id, tx.due_date)}</td>
              <td className="py-2 pr-4 text-gray-600">{TRANSACTION_TYPE_LABEL[tx.type as keyof typeof TRANSACTION_TYPE_LABEL] ?? tx.type}</td>
              <td className="py-2 pr-4 text-gray-600">{tx.description}</td>
              <td className={`py-2 pr-4 text-right ${amountClass(tx.amount)}`}>{formatPln(tx.amount)}</td>
              {renderLeaseCell !== undefined ? <td className="py-2 pr-4">{renderLeaseCell(tx)}</td> : null}
              <td className="py-2 pr-4"><span className={txnStatusPillClass(tx.transaction_status as keyof typeof TRANSACTION_STATUS_LABEL)}>{TRANSACTION_STATUS_LABEL[tx.transaction_status as keyof typeof TRANSACTION_STATUS_LABEL] ?? tx.transaction_status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>;