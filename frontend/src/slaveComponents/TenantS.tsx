import type { ReactNode } from "react";
import { match } from 'ts-pattern';
import type { TenantSProps } from '@/masterComponents/TenantM';
import { LoadingSpinner } from './LoadingSpinnerS';
import { ErrorMessage } from './ErrorMessageS';

type Data = Extract<TenantSProps['asyncData'], { tag: 'fulfilled' }>['data'];
type TenantStatusKey = Data['tenant']['tenant_status'];
type LeaseStatusKey = Data['leases'][number]['leaseStatus'];
type TxnTypeKey = Data['transactions'][number]['type'];
type TxnStatusKey = Data['transactions'][number]['transactionStatus'];

const STATUS_LABEL: Readonly<Record<TenantStatusKey, string>> = Object.freeze({
  active: 'Aktywny',
  past: 'Były',
  applicant: 'Kandydat',
});

const LEASE_STATUS_LABEL: Readonly<Record<LeaseStatusKey, string>> = Object.freeze({
  active: 'Aktywna',
  expired: 'Wygasła',
  terminated: 'Rozwiązana',
});

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

const statusPillClass = (status: TenantStatusKey): string =>
  status === 'active' ?
    `${pillClass} bg-green-50 text-green-700` :
    status === 'past' ?
      `${pillClass} bg-gray-50 text-gray-600` :
      `${pillClass} bg-yellow-50 text-yellow-700`;

const leaseStatusPillClass = (status: LeaseStatusKey): string =>
  status === 'active' ?
    `${pillClass} bg-green-50 text-green-700` :
    status === 'expired' ?
      `${pillClass} bg-gray-50 text-gray-600` :
      `${pillClass} bg-red-50 text-red-700`;

const txnStatusPillClass = (status: TxnStatusKey): string =>
  status === 'paid' ?
    `${pillClass} bg-green-50 text-green-700` :
    status === 'overdue' ?
      `${pillClass} bg-red-50 text-red-700` :
      `${pillClass} bg-yellow-50 text-yellow-700`;

const txnAmountClass = (amount: number): string =>
  `text-sm font-medium ${amount >= 0 ? 'text-green-700' : 'text-red-700'}`;

type DetailContentProps = {
  readonly data: Data;
  readonly onPropertyClick: (propertyId: string) => void;
  readonly onLeaseClick: (leaseId: string) => void;
  readonly onTransactionClick: (transactionId: string) => void;
  readonly editLink: ReactNode;
  readonly backLink: ReactNode;
};

const DetailContent = ({
  data,
  onPropertyClick,
  onLeaseClick,
  onTransactionClick,
  editLink,
  backLink,
}: DetailContentProps): JSX.Element => {
  const t = data.tenant;
  return (
    <div className="mx-auto max-w-4xl space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div className="[&_a]:text-sm [&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline">
          {backLink}
          <h1 className="mt-1 text-2xl font-bold text-gray-900">{t.first_name} {t.last_name}</h1>
        </div>
        <div className="flex gap-2 [&_a]:rounded [&_a]:bg-blue-600 [&_a]:px-4 [&_a]:py-2 [&_a]:text-sm [&_a]:font-medium [&_a]:text-white hover:[&_a]:bg-blue-700">{editLink}</div>
      </div>

      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Dane osobowe</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div><p className={labelClass}>Status</p><span className={statusPillClass(t.tenant_status)}>{STATUS_LABEL[t.tenant_status]}</span></div>
          <div><p className={labelClass}>Email</p><p className={valueClass}>{t.email}</p></div>
          <div><p className={labelClass}>Telefon</p><p className={valueClass}>{t.phone}</p></div>
          <div><p className={labelClass}>Nr dokumentu</p><p className={valueClass}>{t.id_document_number ?? '—'}</p></div>
          <div><p className={labelClass}>Kontakt awaryjny (imię i nazwisko)</p><p className={valueClass}>{t.emergency_contact_name ?? '—'}</p></div>
          <div><p className={labelClass}>Kontakt awaryjny (telefon)</p><p className={valueClass}>{t.emergency_contact_phone ?? '—'}</p></div>
        </div>
        {t.notes !== null ? <div className="mt-4"><p className={labelClass}>Notatki</p><p className={`${valueClass} mt-1 whitespace-pre-wrap`}>{t.notes}</p></div> : undefined}
      </div>

      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Umowy najmu</h2>
        {data.leases.length === 0 ?
          <p className="text-sm text-gray-500">Brak umów najmu.</p> :
          <div className="overflow-x-auto"><table className="w-full border-collapse text-left text-sm">
            <thead><tr className="border-b border-gray-200 text-gray-500"><th className="py-2 pr-4 font-medium">Nieruchomość</th><th className="py-2 pr-4 font-medium">Od</th><th className="py-2 pr-4 font-medium">Do</th><th className="py-2 pr-4 font-medium text-right">Czynsz</th><th className="py-2 pr-4 font-medium">Status</th></tr></thead>
            <tbody>{data.leases.map((l) => (
              <tr key={l.id} className="cursor-pointer border-b border-gray-100 hover:bg-blue-50" onClick={() => { onLeaseClick(l.id); }}>
                <td className="py-2 pr-4"><button type="button" onClick={(e) => { e.stopPropagation(); onPropertyClick(l.propertyId); }} className="text-blue-600 hover:text-blue-800 hover:underline">{l.propertyName}</button></td>
                <td className="py-2 pr-4 text-gray-600">{l.startDate}</td>
                <td className="py-2 pr-4 text-gray-600">{l.endDate ?? '—'}</td>
                <td className="py-2 pr-4 text-right text-gray-900">{l.monthlyRent.toLocaleString('pl-PL')} zł</td>
                <td className="py-2 pr-4"><span className={leaseStatusPillClass(l.leaseStatus)}>{LEASE_STATUS_LABEL[l.leaseStatus] ?? l.leaseStatus}</span></td>
              </tr>
            ))}</tbody>
          </table></div>}
      </div>

      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Ostatnie transakcje</h2>
        {data.transactions.length === 0 ?
          <p className="text-sm text-gray-500">Brak transakcji.</p> :
          <div className="overflow-x-auto"><table className="w-full border-collapse text-left text-sm">
            <thead><tr className="border-b border-gray-200 text-gray-500"><th className="py-2 pr-4 font-medium">Data</th><th className="py-2 pr-4 font-medium">Typ</th><th className="py-2 pr-4 font-medium">Opis</th><th className="py-2 pr-4 font-medium text-right">Kwota</th><th className="py-2 pr-4 font-medium">Status</th></tr></thead>
            <tbody>{data.transactions.map((tx) => (
              <tr key={tx.id} className="cursor-pointer border-b border-gray-100 hover:bg-blue-50" onClick={() => { onTransactionClick(tx.id); }}>
                <td className="py-2 pr-4 text-gray-600">{tx.dueDate}</td>
                <td className="py-2 pr-4 text-gray-600">{TRANSACTION_TYPE_LABEL[tx.type] ?? tx.type}</td>
                <td className="py-2 pr-4 text-gray-600">{tx.description}</td>
                <td className={`py-2 pr-4 text-right ${txnAmountClass(tx.amount)}`}>{tx.amount.toLocaleString('pl-PL')} zł</td>
                <td className="py-2 pr-4"><span className={txnStatusPillClass(tx.transactionStatus)}>{TRANSACTION_STATUS_LABEL[tx.transactionStatus] ?? tx.transactionStatus}</span></td>
              </tr>
            ))}</tbody>
          </table></div>}
      </div>

      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Załączniki</h2>
        {data.attachments.length === 0 ?
          <p className="text-sm text-gray-500">Brak załączników.</p> :
          <div className="space-y-2">{data.attachments.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded border border-gray-100 px-4 py-2">
              <div><a href={a.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline">{a.fileName}</a>{a.description !== null ? <p className="text-xs text-gray-500">{a.description}</p> : undefined}</div>
              <span className="text-xs text-gray-400">{a.fileType ?? 'inny'}{a.fileSize !== null ? ` · ${(a.fileSize / 1024).toFixed(0)} KB` : ''}</span>
            </div>
          ))}</div>}
      </div>
    </div>
  );
};

export const TenantDetailS = (props: TenantSProps): JSX.Element => (
  <div className="min-h-[400px]">
    {match(props.asyncData)
      .with({ tag: 'pending' }, () => <LoadingSpinner />)
      .with({ tag: 'rejected' }, ({ message, onRetry }) => (<ErrorMessage message={message} onRetry={onRetry} />))
      .with({ tag: 'fulfilled' }, ({ data }) => (
        <DetailContent
          data={data}
          onPropertyClick={props.onPropertyClick}
          onLeaseClick={props.onLeaseClick}
          onTransactionClick={props.onTransactionClick}
          editLink={props.editLink}
          backLink={props.backLink}
        />
      ))
      .exhaustive()}
  </div>
);