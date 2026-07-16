import { match } from 'ts-pattern';
import type { LeaseAgreementSProps } from '@/masterComponents/LeaseAgreementM';
import { LoadingSpinner } from './LoadingSpinnerS';
import { ErrorMessage } from './ErrorMessageS';

type LeaseAgreementData = NonNullable<Extract<LeaseAgreementSProps['asyncData'], { tag: 'fulfilled' }>['data']>;

type LeaseStatusKey = NonNullable<LeaseAgreementData['leaseAgreement']>['lease_status'];
type TransactionTypeKey = LeaseAgreementData['transactions'][number]['type'];
type TransactionStatusKey = LeaseAgreementData['transactions'][number]['transaction_status'];

const LEASE_STATUS_LABEL: Readonly<Record<LeaseStatusKey, string>> = Object.freeze({
  active: 'Aktywna',
  expired: 'Wygasła',
  terminated: 'Rozwiązana',
});

const TRANSACTION_TYPE_LABEL: Readonly<Record<TransactionTypeKey, string>> = Object.freeze({
  rent: 'Czynsz',
  utility: 'Media',
  expense: 'Wydatek',
  payment: 'Wpłata',
  withdraw: 'Wypłata',
  fee: 'Opłata',
  other: 'Inne',
});

const TRANSACTION_STATUS_LABEL: Readonly<Record<TransactionStatusKey, string>> = Object.freeze({
  pending: 'Oczekująca',
  paid: 'Opłacona',
  overdue: 'Zaległa',
});

const sectionClass = 'rounded-lg border border-gray-200 bg-white p-6 shadow-sm';
const sectionTitleClass = 'mb-4 text-base font-semibold text-gray-900';
const labelClass = 'text-xs font-medium text-gray-500';
const valueClass = 'text-sm text-gray-900';
const pillClass = 'inline-block rounded-full px-2 py-0.5 text-xs font-medium';

const leaseStatusPillClass = (status: LeaseStatusKey): string =>
  status === 'active' ?
    `${pillClass} bg-green-50 text-green-700` :
    status === 'expired' ?
      `${pillClass} bg-gray-50 text-gray-600` :
      `${pillClass} bg-red-50 text-red-700`;

const txnStatusPillClass = (status: TransactionStatusKey): string =>
  status === 'paid' ?
    `${pillClass} bg-green-50 text-green-700` :
    status === 'overdue' ?
      `${pillClass} bg-red-50 text-red-700` :
      `${pillClass} bg-yellow-50 text-yellow-700`;

const txnAmountClass = (amount: number): string =>
  `text-sm font-medium ${amount >= 0 ? 'text-green-700' : 'text-red-700'}`;

const DetailContent = ({
  data,
  getTenantUrl,
  getPropertyUrl,
  getTransactionUrl,
  getEditUrl,
  getBackUrl,
}: {
  readonly data: LeaseAgreementData;
  readonly getTenantUrl: (tenantId: string) => string;
  readonly getPropertyUrl: (propertyId: string) => string;
  readonly getTransactionUrl: (transactionId: string) => string;
  readonly getEditUrl: () => string;
  readonly getBackUrl: () => string;
}): JSX.Element => {
  const l = data.leaseAgreement;
  return l === null ?
    (
      <div className="flex items-center justify-center min-h-[300px]">
        <p className="text-sm text-gray-500">Nie znaleziono umowy.</p>
      </div>
    ) :
    (
      <div className="mx-auto max-w-4xl space-y-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <a href={getBackUrl()} className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
              ← Powrót do listy
            </a>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">
              Umowa najmu: {l.properties?.name ?? ''}
            </h1>
          </div>
          <div className="flex gap-2">
            <a
              href={getEditUrl()}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Edytuj
            </a>
          </div>
        </div>

        {/* Lease Data */}
        <div className={sectionClass}>
          <h2 className={sectionTitleClass}>Dane umowy</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <p className={labelClass}>Najemca</p>
              <a
                href={getTenantUrl(l.tenant_id)}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                {l.tenants ? `${l.tenants.first_name ?? ''} ${l.tenants.last_name ?? ''}`.trim() : ''}
              </a>
            </div>
            <div>
              <p className={labelClass}>Nieruchomość</p>
              <a
                href={getPropertyUrl(l.property_id)}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                {l.properties?.name ?? ''}
              </a>
            </div>
            <div>
              <p className={labelClass}>Status</p>
              <span className={leaseStatusPillClass(l.lease_status)}>
                {LEASE_STATUS_LABEL[l.lease_status] ?? l.lease_status}
              </span>
            </div>
            <div>
              <p className={labelClass}>Data rozpoczęcia</p>
              <p className={valueClass}>{l.start_date}</p>
            </div>
            <div>
              <p className={labelClass}>Data zakończenia</p>
              <p className={valueClass}>{l.end_date ?? 'Bezterminowo'}</p>
            </div>
            <div>
              <p className={labelClass}>Czynsz miesięczny</p>
              <p className={valueClass}>{l.monthly_rent.toLocaleString('pl-PL')} zł</p>
            </div>
            <div>
              <p className={labelClass}>Kaucja</p>
              <p className={valueClass}>{l.deposit_amount.toLocaleString('pl-PL')} zł</p>
            </div>
          </div>
          {l.notes !== null ?
            <div className="mt-4">
              <p className={labelClass}>Notatki</p>
              <p className={`${valueClass} mt-1 whitespace-pre-wrap`}>{l.notes}</p>
            </div> :
            undefined}
        </div>

        {/* Transactions */}
        <div className={sectionClass}>
          <h2 className={sectionTitleClass}>Transakcje</h2>
          {data.transactions.length === 0 ?
            <p className="text-sm text-gray-500">Brak transakcji.</p> :
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500">
                    <th className="py-2 pr-4 font-medium">Data</th>
                    <th className="py-2 pr-4 font-medium">Typ</th>
                    <th className="py-2 pr-4 font-medium">Opis</th>
                    <th className="py-2 pr-4 font-medium text-right">Kwota</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.transactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="cursor-pointer border-b border-gray-100 hover:bg-blue-50"
                      onClick={() => { window.location.href = getTransactionUrl(tx.id); }}
                    >
                      <td className="py-2 pr-4 text-gray-600">{tx.due_date}</td>
                      <td className="py-2 pr-4 text-gray-600">
                        {TRANSACTION_TYPE_LABEL[tx.type] ?? tx.type}
                      </td>
                      <td className="py-2 pr-4 text-gray-600">{tx.description}</td>
                      <td className={`py-2 pr-4 text-right ${txnAmountClass(tx.amount)}`}>
                        {tx.amount.toLocaleString('pl-PL')} zł
                      </td>
                      <td className="py-2 pr-4">
                        <span className={txnStatusPillClass(tx.transaction_status)}>
                          {TRANSACTION_STATUS_LABEL[tx.transaction_status] ?? tx.transaction_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>}
        </div>

        {/* Attachments */}
        <div className={sectionClass}>
          <h2 className={sectionTitleClass}>Załączniki</h2>
          {data.attachments.length === 0 ?
            <p className="text-sm text-gray-500">Brak załączników.</p> :
            <div className="space-y-2">
              {data.attachments.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded border border-gray-100 px-4 py-2">
                  <div>
                    <a
                      href={a.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {a.file_name}
                    </a>
                    {a.description !== null ?
                      <p className="text-xs text-gray-500">{a.description}</p> :
                      undefined}
                  </div>
                  <span className="text-xs text-gray-400">
                    {a.file_type ?? 'inny'}
                    {a.file_size !== null ? ` · ${(a.file_size / 1024).toFixed(0)} KB` : ''}
                  </span>
                </div>
              ))}
            </div>}
        </div>
      </div>
    );
};

export const LeaseAgreementDetailS = (props: LeaseAgreementSProps): JSX.Element => (
  <div className="min-h-[400px]">
    {match(props.asyncData)
      .with({ tag: 'pending' }, () => <LoadingSpinner />)
      .with({ tag: 'rejected' }, ({ message, onRetry }) => (
        <ErrorMessage message={message} onRetry={onRetry} />
      ))
      .with({ tag: 'fulfilled' }, ({ data }) => (
        <DetailContent
          data={data}
          getTenantUrl={props.getTenantUrl}
          getPropertyUrl={props.getPropertyUrl}
          getTransactionUrl={props.getTransactionUrl}
          getEditUrl={props.getEditUrl}
          getBackUrl={props.getBackUrl}
        />
      ))
      .exhaustive()}
  </div>
);