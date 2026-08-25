import { match } from 'ts-pattern';
import type { LeaseAgreementsSProps } from '@/masterComponents/LeaseAgreementsM';
import type { ColumnDef } from './DataTableS';
import { LEASE_STATUS_LABEL } from './domain';
import { leaseStatusPillClass } from './pills';
import { formatDate, formatPln } from './format';
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

type PageData = Extract<LeaseAgreementsSProps['asyncData'], { readonly tag: 'fulfilled' }>['data'];
type Row = PageData['rows'][number];
type Sort = LeaseAgreementsSProps['sort'];
type SortColumn = Sort['config']['column'];
type Filter = LeaseAgreementsSProps['filter'];
type LeaseStatus = Row['lease_status'];

const COLUMNS: readonly ColumnDef<SortColumn>[] = [
  { key: 'action', label: null, sortColumn: null, align: 'left', className: 'pl-4 w-10 pr-6' },
  { key: 'tenant', label: 'Najemca', sortColumn: 'tenant', align: 'left', className: 'w-[17%] pr-4' },
  { key: 'property', label: 'Nieruchomość', sortColumn: 'property', align: 'left', className: 'w-[17%] pr-4' },
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

const EMPTY_DATABASE = (
  <EmptyStateS
    iconPath="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    title="Brak umów do wyświetlenia"
    description="Dodaj pierwszą umowę najmu, aby zobaczyć ją na liście."
  />
);

const buildFilterChips = (
  filter: Filter,
): readonly FilterChip[] =>
  [
    ...((filter.config.text ?? '').length > 0 ? [{ key: 'text' as const, label: `Szukaj: ${filter.config.text ?? ''}`, onRemove: () => filter.doFilter(setFilterString(filter.config, 'text', '')) }] : []),
    ...((filter.config.leaseStatus ?? '').length > 0 ? [{ key: 'leaseStatus' as const, label: `Status: ${LEASE_STATUS_LABEL[(filter.config.leaseStatus ?? '') as LeaseStatus] ?? (filter.config.leaseStatus ?? '')}`, onRemove: () => filter.doFilter(setFilterString(filter.config, 'leaseStatus', '')) }] : []),
    ...((filter.config.dateFrom ?? '').length > 0 ? [{ key: 'dateFrom' as const, label: `Rozpoczęcie od: ${formatDate(filter.config.dateFrom ?? '')}`, onRemove: () => filter.doFilter(setFilterString(filter.config, 'dateFrom', '')) }] : []),
    ...((filter.config.dateTo ?? '').length > 0 ? [{ key: 'dateTo' as const, label: `Rozpoczęcie do: ${formatDate(filter.config.dateTo ?? '')}`, onRemove: () => filter.doFilter(setFilterString(filter.config, 'dateTo', '')) }] : []),
  ];

export const LeaseAgreementsS = ({
  asyncData,
  navLinkTo,
  sort,
  pagination,
  filter,
}: LeaseAgreementsSProps): JSX.Element => (
  <div className="min-h-[300px]">
    <div className="mb-4 flex items-center justify-between">
      <h1 className="text-xl font-semibold text-gray-900">Umowy najmu</h1>
      {navLinkTo.create !== undefined ? (
        <div className="[&_a]:rounded [&_a]:bg-blue-600 [&_a]:px-4 [&_a]:py-2 [&_a]:text-sm [&_a]:font-medium [&_a]:text-white hover:[&_a]:bg-blue-700">
          {navLinkTo.create({ style: {}, content: 'Dodaj umowę' })}
        </div>
      ) : null}
    </div>
    <FilterToolbarS
      isFilterActive={isFilterActive(filter.config)}
      activeFilterCount={activeFilterCount(filter.config)}
      clearFilter={() => filter.doFilter({})}
      clearLabel="Wyczyść filtry"
      chips={buildFilterChips(filter)}
      resultCount={match(asyncData)
        .with({ tag: 'fulfilled' }, ({ data }) => `Znaleziono: ${data.totalCount}${isFilterActive(filter.config) ? ' (filtrowane)' : ''}`)
        .otherwise(() => null)}
      panel={
        <>
          <div className="min-w-[240px]">
            <label htmlFor="lease-filter" className={labelClass}>
              Szukaj
            </label>
            <input
              id="lease-filter"
              type="search"
              value={filter.config.text ?? ''}
              onChange={onFilterInput((v) => filter.doFilter(setFilterString(filter.config, 'text', v)))}
              placeholder="Najemca lub nieruchomość…"
              className={`${inputClass} w-full`}
            />
          </div>
          <div>
            <label htmlFor="lease-status" className={labelClass}>
              Status
            </label>
            <select
              id="lease-status"
              value={filter.config.leaseStatus ?? ''}
              onChange={onSelectInput((v) => filter.doFilter(setFilterString(filter.config, 'leaseStatus', v)))}
              className={inputClass}
            >
              <option value="">Wszystkie</option>
              {optionEntries(LEASE_STATUS_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="lease-date-from" className={labelClass}>
              Data rozpoczęcia od
            </label>
            <input
              id="lease-date-from"
              type="date"
              value={filter.config.dateFrom ?? ''}
              onChange={onFilterInput((v) => filter.doFilter(setFilterString(filter.config, 'dateFrom', v)))}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="lease-date-to" className={labelClass}>
              Data rozpoczęcia do
            </label>
            <input
              id="lease-date-to"
              type="date"
              value={filter.config.dateTo ?? ''}
              onChange={onFilterInput((v) => filter.doFilter(setFilterString(filter.config, 'dateTo', v)))}
              className={inputClass}
            />
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
      renderRow={(l) => (
        <tr
          key={l.id}
          className="group border-b border-gray-100 text-sm hover:bg-gray-50"
        >
          <td className="pl-4 h-12 py-0 pr-6 [&_a]:text-blue-600 hover:[&_a]:text-blue-800 focus-visible:[&_a]:outline-none focus-visible:[&_a]:ring-2 focus-visible:[&_a]:ring-blue-500">
            {navLinkTo.leaseAgreement({ id: l.id, style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', borderRadius: '6px' }, content: '→', ariaLabel: l.tenant !== null ? `Szczegóły umowy: ${l.tenant.first_name} ${l.tenant.last_name}` : 'Szczegóły umowy' })}
          </td>
          <td className="h-12 py-0 pr-4 [&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline" title={`${l.tenant.first_name} ${l.tenant.last_name}`}>
            <div className="truncate">
              {navLinkTo.tenant({ id: l.tenant_id, content: `${l.tenant.first_name} ${l.tenant.last_name}`, style: {} })}
            </div>
          </td>
          <td className="h-12 py-0 pr-4 [&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline" title={l.property.name ?? undefined}>
            <div className="truncate">
              {navLinkTo.property({ id: l.property_id, content: l.property.name, style: {} })}
            </div>
          </td>
          <td className="h-12 py-0 pr-4 text-gray-600 whitespace-nowrap">{formatDate(l.start_date)}</td>
          <td className="h-12 py-0 pr-4 text-gray-600 whitespace-nowrap">{l.end_date !== null ? formatDate(l.end_date) : 'Bezterminowo'}</td>
          <td className="h-12 py-0 pr-4 text-right text-gray-900 whitespace-nowrap">{formatPln(l.monthly_rent)}</td>
          <td className="h-12 py-0 pr-4 whitespace-nowrap">
            <span className={leaseStatusPillClass(l.lease_status)}>
              {LEASE_STATUS_LABEL[l.lease_status] ?? l.lease_status}
            </span>
          </td>
        </tr>
      )}
    />
  </div>
);