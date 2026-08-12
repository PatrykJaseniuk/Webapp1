import { match } from 'ts-pattern';
import type { LeaseAgreementSProps } from '@/masterComponents/LeaseAgreementM';
import { LoadingSpinner } from './LoadingSpinnerS';
import { ErrorMessage } from './ErrorMessageS';
import { LEASE_STATUS_LABEL } from './domain';
import { leaseStatusPillClass } from './pills';
import { formatDate, formatPln } from './format';
import { labelClass, sectionClass, sectionTitleClass, valueClass } from './detail';
import { TransactionsTableS } from './TransactionsTableS';
import { AttachmentsSectionS } from './AttachmentsListS';

type Data = Extract<LeaseAgreementSProps['asyncData'], { readonly tag: 'fulfilled' }>['data'];
type NavLinkTo = LeaseAgreementSProps['navLinkTo'];

type DetailContentProps = {
  readonly data: Data;
  readonly navLinkTo: NavLinkTo;
};

const DetailContent = ({
  data,
  navLinkTo,
}: DetailContentProps): JSX.Element => {
  const l = data.leaseAgreement;
  return l === null ?
    (
      <div className="flex items-center justify-center min-h-[300px]">
        <p className="text-sm text-gray-500">Nie znaleziono umowy.</p>
      </div>
    ) :
    (
      <div className="mx-auto max-w-4xl space-y-6 py-8">
        <div className="flex items-center justify-between">
          <div className="[&_a]:text-sm [&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline">
            {navLinkTo.leases({ style: {}, content: '← Wszystkie umowy' })}
            <h1 className="mt-1 text-2xl font-bold text-gray-900">{`Umowa najmu: ${l.properties?.name ?? ''}${l.tenants !== null ? ` — ${l.tenants.first_name} ${l.tenants.last_name}` : ''}`}</h1>
          </div>
          <div className="flex gap-2 [&_a]:rounded [&_a]:bg-blue-600 [&_a]:px-4 [&_a]:py-2 [&_a]:text-sm [&_a]:font-medium [&_a]:text-white hover:[&_a]:bg-blue-700">{navLinkTo.edit({ style: {}, content: 'Edytuj' })}</div>
        </div>

        <div className={sectionClass}>
          <h2 className={sectionTitleClass}>Dane umowy</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="[&_a]:text-sm [&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline"><p className={labelClass}>Najemca</p>{navLinkTo.tenant({ id: l.tenant_id, style: {}, content: (l.tenants ? `${l.tenants.first_name ?? ''} ${l.tenants.last_name ?? ''}`.trim() : '') })}</div>
            <div className="[&_a]:text-sm [&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline"><p className={labelClass}>Nieruchomość</p>{navLinkTo.property({ id: l.property_id, style: {}, content: l.properties?.name ?? '' })}</div>
            <div><p className={labelClass}>Status</p><span className={leaseStatusPillClass(l.lease_status)}>{LEASE_STATUS_LABEL[l.lease_status] ?? l.lease_status}</span></div>
<div><p className={labelClass}>Data rozpoczęcia</p><p className={valueClass}>{formatDate(l.start_date)}</p></div>
<div><p className={labelClass}>Data zakończenia</p><p className={valueClass}>{l.end_date !== null ? formatDate(l.end_date) : 'Bezterminowo'}</p></div>
            <div><p className={labelClass}>Czynsz miesięczny</p><p className={valueClass}>{formatPln(l.monthly_rent)}</p></div>
            <div><p className={labelClass}>Kaucja</p><p className={valueClass}>{formatPln(l.deposit_amount)}</p></div>
          </div>
          {l.notes !== null ? <div className="mt-4"><p className={labelClass}>Notatki</p><p className={`${valueClass} mt-1 whitespace-pre-wrap`}>{l.notes}</p></div> : undefined}
        </div>

        <div className={sectionClass}>
          <h2 className={sectionTitleClass}>Ostatnie transakcje</h2>
          {data.transactions.length >= 30 ? <p className="mb-2 text-xs text-gray-500">Pokazano 30 najnowszych transakcji.</p> : null}
          <TransactionsTableS
            transactions={data.transactions}
            emptyMessage="Brak transakcji."
            renderTransactionLink={(id, content) => navLinkTo.transaction({ id, style: {}, content })}
          />
        </div>

        <div className={sectionClass}>
          <h2 className={sectionTitleClass}>Załączniki</h2>
          <AttachmentsSectionS attachments={data.attachments} emptyMessage="Brak załączników." />
        </div>
      </div>
    );
};

export const LeaseAgreementDetailS = (props: LeaseAgreementSProps): JSX.Element => {
  const { asyncData, navLinkTo } = props;

  return (
    <div className="min-h-[400px]">
      {match(asyncData)
        .with({ tag: 'pending' }, () => <LoadingSpinner />)
        .with({ tag: 'rejected' }, ({ message, onRetry }) => (<ErrorMessage message={message} onRetry={onRetry} />))
        .with({ tag: 'fulfilled' }, ({ data }) => (
          <DetailContent
            data={data}
            navLinkTo={navLinkTo}
          />
        ))
        .exhaustive()}
    </div>
  );
};