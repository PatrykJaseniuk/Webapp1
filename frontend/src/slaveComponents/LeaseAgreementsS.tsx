import { match } from 'ts-pattern';
import type { LeaseAgreementsSProps } from '@/masterComponents/LeaseAgreementsM';
import { ErrorMessage } from './ErrorMessageS';
import { DataTableS, type ColumnDef, type Pagination } from './DataTableS';

type PageData = Extract<LeaseAgreementsSProps['asyncData'], { readonly tag: 'fulfilled' }>['data'];
type Row = PageData['rows'][number];
type Sort = LeaseAgreementsSProps['sort'];
type SortColumn = Sort['config']['column'];
type LeaseStatus = Row['lease_status'];
type FilterValues = LeaseAgreementsSProps['filterValues'];

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

const toPagination = (
  pagination: LeaseAgreementsSProps['pagination'],
  totalCount: number | undefined,
): Pagination | undefined =>
  totalCount === undefined ? undefined : { ...pagination };

// ──────────────────────────────────────────────
// Filter panel — pure render, no state
// ──────────────────────────────────────────────

const inputClass = 'block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none';
const labelClass = 'block text-xs font-medium text-gray-600 mb-1';

const STATUS_OPTIONS: readonly LeaseStatus[] = ['active', 'expired', 'terminated'];

const hasAnyFilter = (fv: FilterValues): boolean =>
  fv.leaseStatus !== null || fv.startDateFrom !== null || fv.startDateTo !== null || fv.search !== null;

const FilterPanel = ({
  filterValues,
  onFilterChange,
  onClearFilters,
}: {
  readonly filterValues: FilterValues;
  readonly onFilterChange: (patch: Partial<FilterValues>) => void;
  readonly onClearFilters: () => void;
}): JSX.Element => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
    <div>
      <label htmlFor="filter-status" className={labelClass}>Status</label>
      <select
        id="filter-status"
        className={inputClass}
        defaultValue={filterValues.leaseStatus ?? ''}
        onChange={(e) => onFilterChange({ leaseStatus: e.target.value === '' ? null : (e.target.value as LeaseStatus) })}
      >
        <option value="">Wszystkie</option>
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>{LEASE_STATUS_LABEL[s]}</option>
        ))}
      </select>
    </div>
    <div>
      <label htmlFor="filter-date-from" className={labelClass}>Data od</label>
      <input
        id="filter-date-from"
        type="date"
        className={inputClass}
        defaultValue={filterValues.startDateFrom ?? ''}
        onChange={(e) => onFilterChange({ startDateFrom: e.target.value === '' ? null : e.target.value })}
      />
    </div>
    <div>
      <label htmlFor="filter-date-to" className={labelClass}>Data do</label>
      <input
        id="filter-date-to"
        type="date"
        className={inputClass}
        defaultValue={filterValues.startDateTo ?? ''}
        onChange={(e) => onFilterChange({ startDateTo: e.target.value === '' ? null : e.target.value })}
      />
    </div>
    <div>
      <label htmlFor="filter-search" className={labelClass}>Szukaj</label>
      <input
        id="filter-search"
        type="text"
        className={inputClass}
        placeholder="Najemca, nieruchomość…"
        defaultValue={filterValues.search ?? ''}
        onChange={(e) => onFilterChange({ search: e.target.value === '' ? null : e.target.value })}
      />
    </div>
    <div className="flex items-end">
      <button
        type="button"
        className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
          hasAnyFilter(filterValues) ?
            'bg-red-50 text-red-700 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500' :
            'cursor-not-allowed text-gray-300'
        }`}
        disabled={!hasAnyFilter(filterValues)}
        onClick={onClearFilters}
      >
        Wyczyść filtry
      </button>
    </div>
  </div>
);

// ──────────────────────────────────────────────
// Main slave component
// ──────────────────────────────────────────────

export const LeaseAgreementsS = ({
  asyncData,
  navLinkTo,
  sort,
  pagination,
  filterValues,
  onFilterChange,
  onClearFilters,
  filterPanelOpen,
  toggleFilterPanel,
}: LeaseAgreementsSProps): JSX.Element => {
  const activeFilterCount = [filterValues.leaseStatus, filterValues.startDateFrom, filterValues.startDateTo, filterValues.search].filter(Boolean).length;

  return (
    <div className="min-h-[300px]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-gray-900">Umowy najmu</h1>
        <button
          type="button"
          className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
            filterPanelOpen ?
              'border-blue-300 bg-blue-50 text-blue-700' :
              'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
          } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
          onClick={toggleFilterPanel}
          aria-expanded={filterPanelOpen}
          aria-controls="filter-panel"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filtry
          {activeFilterCount > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-xs font-semibold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>
      <div
        id="filter-panel"
        className={`mb-4 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 px-4 transition-all duration-200 ${
          filterPanelOpen ? 'py-4 opacity-100 max-h-96' : 'py-0 opacity-0 max-h-0 border-transparent'
        }`}
      >
        <FilterPanel filterValues={filterValues} onFilterChange={onFilterChange} onClearFilters={onClearFilters} />
      </div>
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
            rows={data.rows}
            skeletonRows={SKELETON_ROWS}
            emptyState={EMPTY_STATE}
            pagination={toPagination(pagination, data.totalCount)}
            totalCount={data.totalCount}
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
};