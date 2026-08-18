import { match } from 'ts-pattern';
import type { TenantsSProps } from '@/masterComponents/TenantsM';
import type { ColumnDef } from './DataTableS';
import { TENANT_STATUS_LABEL } from './domain';
import { tenantStatusPillClass } from './pills';
import { EmptyStateS, FilterEmptyStateS } from './EmptyStateS';
import {
  activeFilterCount,
  inputClass,
  isFilterActive,
  labelClass,
  onFilterInput,
  onSelectInput,
  optionEntries,
  setFilterString,
  type FilterChip,
} from './filter';
import { FilterToolbarS } from './FilterToolbarS';
import { AsyncStateTableS } from './AsyncStateTableS';

type PageData = Extract<TenantsSProps['asyncData'], { readonly tag: 'fulfilled' }>['data'];
type Row = PageData['rows'][number];
type Sort = TenantsSProps['sort'];
type SortColumn = Sort['config']['column'];
type Filter = TenantsSProps['filter'];
type TenantStatus = Row['tenant_status'];

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

const EMPTY_DATABASE = (
  <EmptyStateS
    iconPath="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    title="Brak najemców do wyświetlenia"
    description="Dodaj pierwszego najemcę, aby zobaczyć go na liście."
  />
);

const buildFilterChips = (
  filter: Filter,
): readonly FilterChip[] =>
  [
    ...((filter.config.text ?? '').length > 0 ? [{ key: 'text' as const, label: `Szukaj: ${filter.config.text ?? ''}`, onRemove: () => filter.doFilter(setFilterString(filter.config, 'text', '')) }] : []),
    ...((filter.config.tenantStatus ?? '').length > 0 ? [{ key: 'tenantStatus' as const, label: `Status: ${TENANT_STATUS_LABEL[(filter.config.tenantStatus ?? '') as TenantStatus] ?? (filter.config.tenantStatus ?? '')}`, onRemove: () => filter.doFilter(setFilterString(filter.config, 'tenantStatus', '')) }] : []),
  ];

export const TenantsS = ({
  asyncData,
  navLinkTo,
  sort,
  pagination,
  filter,
}: TenantsSProps): JSX.Element => (
  <div className="min-h-[300px]">
    <h1 className="mb-4 text-xl font-semibold text-gray-900">Najemcy</h1>
    <FilterToolbarS
      isFilterActive={isFilterActive(filter.config)}
      activeFilterCount={activeFilterCount(filter.config)}
      clearFilter={() => filter.doFilter({})}
      chips={buildFilterChips(filter)}
      resultCount={match(asyncData)
        .with({ tag: 'fulfilled' }, ({ data }) => `Znaleziono: ${data.totalCount}${isFilterActive(filter.config) ? ' (filtrowane)' : ''}`)
        .otherwise(() => null)}
      panel={
        <>
          <div className="min-w-[280px]">
            <label htmlFor="tenant-filter" className={labelClass}>
              Szukaj (imię, nazwisko, email)
            </label>
            <input
              id="tenant-filter"
              type="search"
              value={filter.config.text ?? ''}
              onChange={onFilterInput((v) => filter.doFilter(setFilterString(filter.config, 'text', v)))}
              placeholder="Wpisz fragment…"
              className={`${inputClass} w-full`}
            />
          </div>
          <div>
            <label htmlFor="tenant-status" className={labelClass}>
              Status
            </label>
            <select
              id="tenant-status"
              value={filter.config.tenantStatus ?? ''}
              onChange={onSelectInput((v) => filter.doFilter(setFilterString(filter.config, 'tenantStatus', v)))}
              className={inputClass}
            >
              <option value="">Wszystkie</option>
              {optionEntries(TENANT_STATUS_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </>
      }
    />
    <AsyncStateTableS<Row, SortColumn>
      asyncData={asyncData}
      columns={COLUMNS}
      sort={sort}
      pagination={pagination}
      skeletonRows={SKELETON_ROWS}
      emptyState={EMPTY_DATABASE}
      filteredEmptyState={<FilterEmptyStateS clearFilter={() => filter.doFilter({})} />}
      isFilterActive={isFilterActive(filter.config)}
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
            <span className={tenantStatusPillClass(t.tenant_status)}>
              {TENANT_STATUS_LABEL[t.tenant_status] ?? t.tenant_status}
            </span>
          </td>
        </tr>
      )}
    />
  </div>
);