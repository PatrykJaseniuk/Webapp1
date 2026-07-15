import { match } from 'ts-pattern';
import type { TransactionDetailData, TransactionDetailViewProps } from '@/masterComponents/TransactionM';
import { LoadingSpinner } from './LoadingSpinnerS';
import { ErrorMessage } from './ErrorMessageS';

const TRANSACTION_TYPE_LABEL: Readonly<Record<string, string>> = Object.freeze({
  rent: 'Czynsz',
  utility: 'Media',
  expense: 'Wydatek',
  payment: 'Wpłata',
  withdraw: 'Wypłata',
  fee: 'Opłata',
  other: 'Inne',
});

const TRANSACTION_STATUS_LABEL: Readonly<Record<string, string>> = Object.freeze({
  pending: 'Oczekująca',
  paid: 'Opłacona',
  overdue: 'Zaległa',
});

const sectionClass = 'rounded-lg border border-gray-200 bg-white p-6 shadow-sm';
const sectionTitleClass = 'mb-4 text-base font-semibold text-gray-900';
const labelClass = 'text-xs font-medium text-gray-500';
const valueClass = 'text-sm text-gray-900';
const pillClass = 'inline-block rounded-full px-2 py-0.5 text-xs font-medium';

const statusPillClass = (status: string): string =>
  status === 'paid' ?
    `${pillClass} bg-green-50 text-green-700` :
    status === 'overdue' ?
      `${pillClass} bg-red-50 text-red-700` :
      `${pillClass} bg-yellow-50 text-yellow-700`;

const DetailContent = ({
  data,
  getPropertyUrl,
  getLeaseUrl,
  getBackUrl,
}: {
  readonly data: TransactionDetailData;
  readonly getPropertyUrl: (propertyId: string) => string;
  readonly getLeaseUrl: (leaseId: string) => string;
  readonly getBackUrl: () => string;
}): JSX.Element => {
  const t = data.transaction;
  return (
    <div className="mx-auto max-w-4xl space-y-6 py-8">
      <div>
        <a href={getBackUrl()} className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
          ← Powrót
        </a>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">Transakcja</h1>
      </div>

      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Dane transakcji</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <p className={labelClass}>Typ</p>
            <p className={valueClass}>{TRANSACTION_TYPE_LABEL[t.type] ?? t.type}</p>
          </div>
          <div>
            <p className={labelClass}>Status</p>
            <span className={statusPillClass(t.transaction_status)}>
              {TRANSACTION_STATUS_LABEL[t.transaction_status] ?? t.transaction_status}
            </span>
          </div>
          <div>
            <p className={labelClass}>Kwota</p>
            <p className={`text-sm font-semibold ${t.amount >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {t.amount.toLocaleString('pl-PL')} zł
            </p>
          </div>
          <div>
            <p className={labelClass}>Termin płatności</p>
            <p className={valueClass}>{t.due_date}</p>
          </div>
          {t.property_id !== null && data.propertyName !== null ?
            <div>
              <p className={labelClass}>Nieruchomość</p>
              <a
                href={getPropertyUrl(t.property_id)}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                {data.propertyName}
              </a>
            </div> :
            undefined}
          {t.lease_id !== null && data.leaseDescription !== null ?
            <div>
              <p className={labelClass}>Umowa</p>
              <a
                href={getLeaseUrl(t.lease_id)}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                {data.leaseDescription}
              </a>
            </div> :
            undefined}
        </div>
        <div className="mt-4">
          <p className={labelClass}>Opis</p>
          <p className={`${valueClass} mt-1`}>{t.description}</p>
        </div>
      </div>
    </div>
  );
};

export const TransactionDetailView = (props: TransactionDetailViewProps): JSX.Element => (
  <div className="min-h-[400px]">
    {match(props.dataMode)
      .with({ tag: 'pending' }, () => <LoadingSpinner />)
      .with({ tag: 'rejected' }, ({ message, onRetry }) => (
        <ErrorMessage message={message} onRetry={onRetry} />
      ))
      .with({ tag: 'fulfilled' }, ({ data }) => (
        <DetailContent
          data={data}
          getPropertyUrl={props.getPropertyUrl}
          getLeaseUrl={props.getLeaseUrl}
          getBackUrl={props.getBackUrl}
        />
      ))
      .exhaustive()}
  </div>
);