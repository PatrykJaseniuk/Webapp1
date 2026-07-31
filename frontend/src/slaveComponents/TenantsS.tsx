import { match } from 'ts-pattern';
import type { TenantsSProps } from '@/masterComponents/TenantsM';
import { ErrorMessage } from './ErrorMessageS';
import { DataTableS, type ColumnDef } from './DataTableS';

type Row = Extract<TenantsSProps['asyncData'], { readonly tag: 'fulfilled' }>['data'][number];
type Sort = TenantsSProps['sort'];
type SortColumn = Sort['config']['column'];
type TenantStatus = Row['tenant_status'];

const STATUS_LABEL: Readonly<Record<TenantStatus, string>> = Object.freeze({
  active: 'Aktywny',
  past: 'Były',
  applicant: 'Kandydat',
});

const pillClass = 'inline-block rounded-full px-2 py-0.5 text-xs font-medium';

const statusPillClass = (status: TenantStatus): string =>
  status === 'active' ?
    `${pillClass} bg-green-50 text-green-700` :
    status === 'past' ?
      `${pillClass} bg-gray-50 text-gray-600` :
      `${pillClass} bg-yellow-50 text-yellow-700`;

const COLUMNS: readonly ColumnDef<SortColumn>[] = [
  { key: 'action', label: null, sortColumn: null, align: 'left', className: 'pl-4 w-10 pr-6' },
  { key: 'last_name', label: 'Nazwisko', sortColumn: 'last_name', align: 'left', className: 'w-[18%] pr-4' },
  { key: 'first_name', label: 'Imię', sortColumn: 'first_name', align: 'left', className: 'w-[18%] pr-4' },
  { key: 'email', label: 'Email', sortColumn: 'email', align: 'left', className: 'w-[22%] pr-4' },
  { key: 'phone', label: 'Telefon', sortColumn: null, align: 'left', className: 'w-[18%] pr-4' },
  { key: 'tenant_status', label: 'Status', sortColumn: 'tenant_status', align: 'left', className: 'w-[14%] pr-4' },
];

const skeletonBar = 'h-4 animate-pulse rounded bg-gray-200';

const SKELETON_ROWS = (
  <>
    {Array.from({ length: 6 }, (_, i) => (
      <tr key={`skel-${i}`} className="border-b border-gray-100">
        <td className="pl-4 h-12 py-0 pr-6"><div className={`${skeletonBar} w-6`} /></td>
        <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} w-28`} /></td>
        <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} w-24`} /></td>
        <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} w-36`} /></td>
        <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} w-24`} /></td>
        <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} w-20`} /></td>
      </tr>
    ))}
  </>
);

const EMPTY_STATE = (
  <>
    <svg className="mx-auto mb-3 h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
    <p className="text-sm font-medium text-gray-600">Brak najemców do wyświetlenia</p>
    <p className="mt-1 text-xs text-gray-500">Dodaj pierwszego najemcę, aby zobaczyć go na liście.</p>
  </>
);

export const TenantsS = ({ asyncData, navLinkTo, sort }: TenantsSProps): JSX.Element => (
  <div className="min-h-[300px]">
    <h1 className="mb-4 text-xl font-semibold text-gray-900">Najemcy</h1>
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
          renderRow={(t) => (
            <tr
              key={t.id}
              className="group border-b border-gray-100 text-sm hover:bg-gray-50"
            >
              <td className="pl-4 h-12 py-0 pr-6 [&_a]:text-blue-600 hover:[&_a]:text-blue-800 focus-visible:[&_a]:outline-none focus-visible:[&_a]:ring-2 focus-visible:[&_a]:ring-blue-500">
                {navLinkTo.tenant({ id: t.id, style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', borderRadius: '6px' }, content: '→', ariaLabel: `Szczegóły najemcy: ${t.first_name} ${t.last_name}` })}
              </td>
              <td className="h-12 py-0 pr-4 text-gray-900" title={t.last_name}>
                <div className="truncate">{t.last_name}</div>
              </td>
              <td className="h-12 py-0 pr-4 text-gray-600" title={t.first_name}>
                <div className="truncate">{t.first_name}</div>
              </td>
              <td className="h-12 py-0 pr-4 text-gray-600" title={t.email}>
                <div className="truncate">{t.email}</div>
              </td>
              <td className="h-12 py-0 pr-4 text-gray-600" title={t.phone ?? undefined}>
                <div className="truncate">{t.phone}</div>
              </td>
              <td className="h-12 py-0 pr-4 whitespace-nowrap">
                <span className={statusPillClass(t.tenant_status)}>
                  {STATUS_LABEL[t.tenant_status] ?? t.tenant_status}
                </span>
              </td>
            </tr>
          )}
        />
      ))
      .exhaustive()}
  </div>
);