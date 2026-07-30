import { match } from 'ts-pattern';
import type { LeaseAgreementsSProps } from '@/masterComponents/LeaseAgreementsM';
import { ErrorMessage } from './ErrorMessageS';
import { DataTableS, type ColumnDef } from './DataTableS';

type Row = Extract<LeaseAgreementsSProps['asyncData'], { tag: 'fulfilled' }>['data'][number];
type Sort = LeaseAgreementsSProps['sort'];
type SortColumn = Sort['config']['column'];
type LeaseStatus = Row['lease_status'];

const LEASE_STATUS_LABEL: Readonly<Record<LeaseStatus, string>> = Object.freeze({
  active: 'Aktywna',
  expired: 'Wygasła',
  terminated: 'Rozwiązana',
});

const pillClass = 'inline-block rounded-full px-2 py-0.5 text-xs font-medium';

const leaseStatusPillClass = (status: LeaseStatus): string =>
  status === 'active' ?
    `${pillClass} bg-green-50 text-green-700` :
    status === 'expired' ?
      `${pillClass} bg-gray-50 text-gray-600` :
      `${pillClass} bg-red-50 text-red-700`;

const COLUMNS: readonly ColumnDef<SortColumn>[] = [
  { key: 'action', label: null, sortColumn: null, align: 'left', className: 'pl-4 w-10 pr-6' },
  { key: 'tenants', label: 'Najemca', sortColumn: 'tenants', align: 'left', className: 'w-[17%] pr-4' },
  { key: 'properties', label: 'Nieruchomość', sortColumn: 'properties', align: 'left', className: 'w-[17%] pr-4' },
  { key: 'start_date', label: 'Od', sortColumn: 'start_date', align: 'left', className: 'w-[12%] pr-4' },
  { key: 'end_date', label: 'Do', sortColumn: 'end_date', align: 'left', className: 'w-[12%] pr-4' },
  { key: 'monthly_rent', label: 'Czynsz', sortColumn: 'monthly_rent', align: 'right', className: 'w-[12%] pr-4' },
  { key: 'lease_status', label: 'Status', sortColumn: 'lease_status', align: 'left', className: 'w-[14%] pr-4' },
];

const skeletonBar = 'h-4 animate-pulse rounded bg-gray-200';

const SKELETON_ROWS = (
  <>
    {Array.from({ length: 6 }, (_, i) => (
      <tr key={`skel-${i}`} className="border-b border-gray-100">
        <td className="pl-4 h-12 py-0 pr-6"><div className={`${skeletonBar} w-6`} /></td>
        <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} w-28`} /></td>
        <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} w-32`} /></td>
        <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} w-20`} /></td>
        <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} w-20`} /></td>
        <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} ml-auto w-16`} /></td>
        <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} w-20`} /></td>
      </tr>
    ))}
  </>
);

const EMPTY_STATE = (
  <>
    <svg className="mx-auto mb-3 h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
    <p className="text-sm font-medium text-gray-600">Brak umów do wyświetlenia</p>
    <p className="mt-1 text-xs text-gray-500">Dodaj pierwszą umowę najmu, aby zobaczyć ją na liście.</p>
  </>
);

export const LeaseAgreementsS = ({ asyncData, navLinkTo, sort }: LeaseAgreementsSProps): JSX.Element => (
  <div className="min-h-[300px]">
    {match(asyncData)
      .with({ tag: 'pending' }, () => (
        <DataTableS
          columns={COLUMNS}
          sort={undefined}
          isFetching={true}
          rows={[]}
          skeletonRows={SKELETON_ROWS}
          emptyState={EMPTY_STATE}
          renderRow={() => <></>}
        />
      ))
      .with({ tag: 'rejected' }, ({ message, onRetry }) => (
        <ErrorMessage message={message} onRetry={onRetry} />
      ))
      .with({ tag: 'fulfilled' }, ({ data, isFetching }) => (
        <DataTableS
          columns={COLUMNS}
          sort={sort}
          isFetching={isFetching ?? false}
          rows={data}
          skeletonRows={SKELETON_ROWS}
          emptyState={EMPTY_STATE}
          renderRow={(l) => (
            <tr
              key={l.id}
              className="group border-b border-gray-100 text-sm hover:bg-gray-50"
            >
              <td className="pl-4 h-12 py-0 pr-6 [&_a]:text-blue-600 hover:[&_a]:text-blue-800 focus-visible:[&_a]:outline-none focus-visible:[&_a]:ring-2 focus-visible:[&_a]:ring-blue-500">
                {navLinkTo.leaseAgreement({ id: l.id, style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', borderRadius: '6px' }, content: '→', ariaLabel: l.tenants !== null ? `Szczegóły umowy: ${l.tenants.first_name} ${l.tenants.last_name}` : 'Szczegóły umowy' })}
              </td>
              <td className="h-12 py-0 pr-4 [&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline" title={`${l.tenants.first_name} ${l.tenants.last_name}`}>
                <div className="truncate">
                  {navLinkTo.tenant({ id: l.tenant_id, content: `${l.tenants.first_name} ${l.tenants.last_name}`, style: {} })}
                </div>
              </td>
              <td className="h-12 py-0 pr-4 [&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline" title={l.properties.name ?? undefined}>
                <div className="truncate">
                  {navLinkTo.property({ id: l.property_id, content: l.properties.name, style: {} })}
                </div>
              </td>
              <td className="h-12 py-0 pr-4 text-gray-600 whitespace-nowrap">{l.start_date}</td>
              <td className="h-12 py-0 pr-4 text-gray-600 whitespace-nowrap">{l.end_date ?? '—'}</td>
              <td className="h-12 py-0 pr-4 text-right text-gray-900 whitespace-nowrap">{l.monthly_rent.toLocaleString('pl-PL')} zł</td>
              <td className="h-12 py-0 pr-4 whitespace-nowrap">
                <span className={leaseStatusPillClass(l.lease_status)}>
                  {LEASE_STATUS_LABEL[l.lease_status] ?? l.lease_status}
                </span>
              </td>
            </tr>
          )}
        />
      ))
      .exhaustive()}
  </div>
);