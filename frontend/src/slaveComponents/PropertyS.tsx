import { match } from 'ts-pattern';
import type { PropertySProps } from '@/masterComponents/PropertyM';
import { LoadingSpinner } from './LoadingSpinnerS';
import { ErrorMessage } from './ErrorMessageS';
import {
  LEASE_STATUS_LABEL,
  PROPERTY_STATUS_LABEL,
  PROPERTY_TYPE_LABEL,
} from './domain';
import { leaseStatusPillClass, propertyStatusPillClass } from './pills';
import { formatPln } from './format';
import { labelClass, sectionClass, sectionTitleClass, valueClass } from './detail';
import { TransactionsTableS } from './TransactionsTableS';
import { AttachmentsSectionS } from './AttachmentsListS';

type Data = Extract<PropertySProps['asyncData'], { readonly tag: 'fulfilled' }>['data'];
type NavLinkTo = PropertySProps['navLinkTo'];
type PropertyData = NonNullable<Data['property']>;

const financialLabelClass = 'text-xs font-medium text-gray-500';
const financialValueClass = 'text-lg font-semibold';

type DetailContentProps = {
  readonly data: Data;
  readonly property: PropertyData;
  readonly navLinkTo: NavLinkTo;
};

const DetailContent = ({
  data,
  property: p,
  navLinkTo,
}: DetailContentProps): JSX.Element => {
  const occupancy = data.occupancy;
  const financial = data.financial;
  return (
    <div className="mx-auto max-w-4xl space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div className="[&_a]:text-sm [&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline">
          {navLinkTo.properties({ style: {}, content: '← Powrót do listy' })}
          <h1 className="mt-1 text-2xl font-bold text-gray-900">{p.name}</h1>
        </div>
        <div className="flex gap-2 [&_a]:rounded [&_a]:bg-blue-600 [&_a]:px-4 [&_a]:py-2 [&_a]:text-sm [&_a]:font-medium [&_a]:text-white hover:[&_a]:bg-blue-700">
          {navLinkTo.edit({ style: {}, content: 'Edytuj' })}
        </div>
      </div>

      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Dane nieruchomości</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div><p className={labelClass}>Adres</p><p className={valueClass}>{p.address}</p></div>
          <div><p className={labelClass}>Typ</p><p className={valueClass}>{PROPERTY_TYPE_LABEL[p.property_type] ?? p.property_type}</p></div>
          <div><p className={labelClass}>Status</p><span className={propertyStatusPillClass(p.property_status)}>{PROPERTY_STATUS_LABEL[p.property_status]}</span></div>
          <div><p className={labelClass}>Powierzchnia</p><p className={valueClass}>{p.size_sqm !== null ? `${p.size_sqm} m²` : '—'}</p></div>
          <div><p className={labelClass}>Sypialnie</p><p className={valueClass}>{p.bedrooms ?? '—'}</p></div>
          <div>
            <p className={labelClass}>Aktualny najemca</p>
            {occupancy?.current_tenant_name !== null && occupancy?.current_tenant_name !== undefined && occupancy?.tenant_id !== null && occupancy?.tenant_id !== undefined ?
              <div className="[&_a]:text-sm [&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline">{navLinkTo.tenant({ id: occupancy.tenant_id as string, style: {}, content: occupancy.current_tenant_name })}</div> :
              <p className={`${valueClass} text-gray-400`}>—</p>}
          </div>
          <div>
            <p className={labelClass}>Aktualna umowa</p>
            {occupancy?.current_lease_id !== null && occupancy?.current_lease_id !== undefined ?
              <div className="[&_a]:text-sm [&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline">{navLinkTo.lease({ id: occupancy.current_lease_id as string, style: {}, content: 'Umowa najmu' })}</div> :
              <p className={`${valueClass} text-gray-400`}>—</p>}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div><p className={labelClass}>Czynsz miesięczny</p><p className={valueClass}>{formatPln(p.monthly_rent)}</p></div>
          <div><p className={labelClass}>Kaucja</p><p className={valueClass}>{formatPln(p.deposit_amount)}</p></div>
        </div>
        {p.notes !== null ? <div className="mt-4"><p className={labelClass}>Notatki</p><p className={`${valueClass} mt-1 whitespace-pre-wrap`}>{p.notes}</p></div> : undefined}
      </div>

      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Podsumowanie finansowe</h2>
        <div className="grid grid-cols-3 gap-6">
          <div className="rounded-lg bg-green-50 p-4 text-center"><p className={financialLabelClass}>Przychody</p><p className={`${financialValueClass} text-green-700`}>{formatPln(financial?.total_income ?? 0)}</p></div>
          <div className="rounded-lg bg-red-50 p-4 text-center"><p className={financialLabelClass}>Wydatki</p><p className={`${financialValueClass} text-red-700`}>{formatPln(financial?.total_expenses ?? 0)}</p></div>
          <div className="rounded-lg bg-blue-50 p-4 text-center"><p className={financialLabelClass}>Bilans</p><p className={`${financialValueClass} ${(financial?.net_profit ?? 0) >= 0 ? 'text-blue-700' : 'text-red-700'}`}>{formatPln(financial?.net_profit ?? 0)}</p></div>
        </div>
      </div>

      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Ostatnie transakcje</h2>
        <TransactionsTableS
          transactions={data.transactions}
          emptyMessage="Brak transakcji."
          renderTransactionLink={(id, content) => navLinkTo.transaction({ id, style: {}, content })}
          renderLeaseCell={(tx) =>
            tx.lease_id !== null ?
              <div className="[&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline">{navLinkTo.lease({ id: tx.lease_id as string, style: {}, content: 'Umowa' })}</div> :
              <span className="text-gray-400">—</span>}
        />
      </div>

      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Historia najmu</h2>
        {data.leases.length === 0 ?
          <p className="text-sm text-gray-500">Brak umów najmu.</p> :
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead><tr className="border-b border-gray-200 text-gray-500"><th className="py-2 pr-4 font-medium">Najemca</th><th className="py-2 pr-4 font-medium">Od</th><th className="py-2 pr-4 font-medium">Do</th><th className="py-2 pr-4 font-medium text-right">Czynsz</th><th className="py-2 pr-4 font-medium">Status</th></tr></thead>
              <tbody>
                {data.leases.map((l) => (
                  <tr key={l.id} className="border-b border-gray-100 hover:bg-blue-50">
                    <td className="py-2 pr-4 [&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline">{navLinkTo.tenant({ id: l.tenant_id, style: {}, content: `${l.tenants.first_name} ${l.tenants.last_name}` })}</td>
                    <td className="py-2 pr-4 [&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline">{navLinkTo.lease({ id: l.id, style: {}, content: l.start_date })}</td>
                    <td className="py-2 pr-4 text-gray-600">{l.end_date ?? '—'}</td>
                    <td className="py-2 pr-4 text-right text-gray-900">{formatPln(l.monthly_rent)}</td>
                    <td className="py-2 pr-4"><span className={leaseStatusPillClass(l.lease_status)}>{LEASE_STATUS_LABEL[l.lease_status] ?? l.lease_status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>}
      </div>

      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Załączniki</h2>
        <AttachmentsSectionS attachments={data.attachments} emptyMessage="Brak załączników." />
      </div>
    </div>
  );
};

export const PropertyDetailS = (props: PropertySProps): JSX.Element => (
  <div className="min-h-[400px]">
    {match(props.asyncData)
      .with({ tag: 'pending' }, () => <LoadingSpinner />)
      .with({ tag: 'rejected' }, ({ message, onRetry }) => (<ErrorMessage message={message} onRetry={onRetry} />))
      .with({ tag: 'fulfilled' }, ({ data }) =>
        data.property !== null ?
          <DetailContent
            data={data}
            property={data.property}
            navLinkTo={props.navLinkTo}
          /> :
          <div className="flex items-center justify-center"><p className="text-sm text-gray-500">Property not found.</p></div>
      )
      .exhaustive()}
  </div>
);