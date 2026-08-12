import { match } from 'ts-pattern';
import type { TenantSProps } from '@/masterComponents/TenantM';
import { LoadingSpinner } from './LoadingSpinnerS';
import { ErrorMessage } from './ErrorMessageS';
import { LEASE_STATUS_LABEL, TENANT_STATUS_LABEL } from './domain';
import { leaseStatusPillClass, tenantStatusPillClass } from './pills';
import { formatPln } from './format';
import { labelClass, sectionClass, sectionTitleClass, valueClass } from './detail';
import { TransactionsTableS } from './TransactionsTableS';
import { AttachmentsSectionS } from './AttachmentsListS';

type Data = Extract<TenantSProps['asyncData'], { readonly tag: 'fulfilled' }>['data'];
type NavLinkTo = TenantSProps['navLinkTo'];

type DetailContentProps = {
  readonly data: Data;
  readonly navLinkTo: NavLinkTo;
};

const DetailContent = ({
  data,
  navLinkTo,
}: DetailContentProps): JSX.Element => {
  const t = data.tenant;
  return (
    <div className="mx-auto max-w-4xl space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div className="[&_a]:text-sm [&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline">
          {navLinkTo.linkToTenants({ style: {}, content: '← Powrót do listy' })}
          <h1 className="mt-1 text-2xl font-bold text-gray-900">{t.first_name} {t.last_name}</h1>
        </div>
        <div className="flex gap-2 [&_a]:rounded [&_a]:bg-blue-600 [&_a]:px-4 [&_a]:py-2 [&_a]:text-sm [&_a]:font-medium [&_a]:text-white hover:[&_a]:bg-blue-700">{navLinkTo.linkToEdit({ style: {}, content: 'Edytuj' })}</div>
      </div>

      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Dane osobowe</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div><p className={labelClass}>Status</p><span className={tenantStatusPillClass(t.tenant_status)}>{TENANT_STATUS_LABEL[t.tenant_status]}</span></div>
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
              <tr key={l.id ?? ''} className="border-b border-gray-100 hover:bg-blue-50">
                <td className="py-2 pr-4 [&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline">
                  {l.property_id !== null ?
                    navLinkTo.toProperty({ id: l.property_id, style: {}, content: l.property_name ?? '' }) :
                    <span className="text-gray-400">—</span>}
                </td>
                <td className="py-2 pr-4 [&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline">
                  {l.id !== null ?
                    navLinkTo.toLease({ id: l.id, style: {}, content: l.start_date ?? '' }) :
                    <span className="text-gray-400">—</span>}
                </td>
                <td className="py-2 pr-4 text-gray-600">{l.end_date ?? '—'}</td>
                <td className="py-2 pr-4 text-right text-gray-900">{formatPln(l.monthly_rent ?? 0)}</td>
                <td className="py-2 pr-4">
                  {l.lease_status !== null ?
                    <span className={leaseStatusPillClass(l.lease_status)}>{LEASE_STATUS_LABEL[l.lease_status]}</span> :
                    <span className="text-gray-400">—</span>}
                </td>
              </tr>
            ))}</tbody>
          </table></div>}
      </div>

      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Ostatnie transakcje</h2>
        <TransactionsTableS
          transactions={data.transactions}
          emptyMessage="Brak transakcji."
          renderTransactionLink={(id, content) => navLinkTo.toTransaction({ id, style: {}, content })}
        />
      </div>

      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Załączniki</h2>
        <AttachmentsSectionS attachments={data.attachments} emptyMessage="Brak załączników." />
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
          navLinkTo={props.navLinkTo}
        />
      ))
      .exhaustive()}
  </div>
);