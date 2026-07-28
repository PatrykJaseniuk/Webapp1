import { match } from 'ts-pattern';
import type { TransactionSProps } from '@/masterComponents/TransactionM';
import { LoadingSpinner } from './LoadingSpinnerS';
import { ErrorMessage } from './ErrorMessageS';

type Data = Extract<TransactionSProps['asyncData'], { tag: 'fulfilled' }>['data'];
type NavLinkTo = TransactionSProps['navLinkTo'];
type TxnTypeKey = Data['transaction']['type'];
type TxnStatusKey = Data['transaction']['transaction_status'];

const TRANSACTION_TYPE_LABEL: Readonly<Record<TxnTypeKey, string>> = Object.freeze({
  rent: 'Czynsz',
  utility: 'Media',
  expense: 'Wydatek',
  payment: 'Wpłata',
  withdraw: 'Wypłata',
  fee: 'Opłata',
  other: 'Inne',
});

const TRANSACTION_STATUS_LABEL: Readonly<Record<TxnStatusKey, string>> = Object.freeze({
  pending: 'Oczekująca',
  paid: 'Opłacona',
  overdue: 'Zaległa',
});

const sectionClass = 'rounded-lg border border-gray-200 bg-white p-6 shadow-sm';
const sectionTitleClass = 'mb-4 text-base font-semibold text-gray-900';
const labelClass = 'text-xs font-medium text-gray-500';
const valueClass = 'text-sm text-gray-900';
const pillClass = 'inline-block rounded-full px-2 py-0.5 text-xs font-medium';

const statusPillClass = (status: TxnStatusKey): string =>
  status === 'paid' ?
    `${pillClass} bg-green-50 text-green-700` :
    status === 'overdue' ?
      `${pillClass} bg-red-50 text-red-700` :
      `${pillClass} bg-yellow-50 text-yellow-700`;

type DetailContentProps = {
  readonly data: Data;
  readonly navLinkTo: NavLinkTo;
};

const DetailContent = ({
  data,
  navLinkTo,
}: DetailContentProps): JSX.Element => {
  const t = data.transaction;
  return (
    <div className="mx-auto max-w-4xl space-y-6 py-8">
      <div className="[&_a]:text-sm [&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline">
        {navLinkTo.linkToTransactions({ style: {}, content: '← Powrót' })}
        <h1 className="mt-1 text-2xl font-bold text-gray-900">Transakcja</h1>
      </div>

      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Dane transakcji</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div><p className={labelClass}>Typ</p><p className={valueClass}>{TRANSACTION_TYPE_LABEL[t.type] ?? t.type}</p></div>
          <div><p className={labelClass}>Status</p><span className={statusPillClass(t.transaction_status)}>{TRANSACTION_STATUS_LABEL[t.transaction_status] ?? t.transaction_status}</span></div>
          <div><p className={labelClass}>Kwota</p><p className={`text-sm font-semibold ${t.amount >= 0 ? 'text-green-700' : 'text-red-700'}`}>{t.amount.toLocaleString('pl-PL')} zł</p></div>
          <div><p className={labelClass}>Termin płatności</p><p className={valueClass}>{t.due_date}</p></div>
          {t.property_id !== null && data.propertyName !== null ?
            <div><p className={labelClass}>Nieruchomość</p><span className="[&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline">{navLinkTo.toProperty({ id: t.property_id, style: {}, content: data.propertyName })}</span></div> :
            undefined}
          {t.lease_id !== null && data.leaseDescription !== null ?
            <div><p className={labelClass}>Umowa</p><span className="[&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline">{navLinkTo.toLease({ id: t.lease_id, style: {}, content: data.leaseDescription })}</span></div> :
            undefined}
        </div>
        <div className="mt-4"><p className={labelClass}>Opis</p><p className={`${valueClass} mt-1`}>{t.description}</p></div>
      </div>
    </div>
  );
};

export const TransactionDetailS = (props: TransactionSProps): JSX.Element => (
  <div className="min-h-[400px]">
    {match(props.asyncData)
      .with({ tag: 'pending' }, () => <LoadingSpinner />)
      .with({ tag: 'rejected' }, ({ message, onRetry }) => (<ErrorMessage message={message} onRetry={onRetry} />))
      .with({ tag: 'fulfilled' }, ({ data }) => (
        <DetailContent
          data={data}
          navLinkTo={props.navLinkTo}
        />
      ))
      .exhaustive()}
  </div>
);