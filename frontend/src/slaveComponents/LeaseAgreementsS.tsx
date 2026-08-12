import { match } from 'ts-pattern';
import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent } from 'react';
import type { LeaseAgreementsSProps } from '@/masterComponents/LeaseAgreementsM';
import { ErrorMessage } from './ErrorMessageS';
import { DataTableS, type ColumnDef, type Pagination } from './DataTableS';

type PageData = Extract<LeaseAgreementsSProps['asyncData'], { readonly tag: 'fulfilled' }>['data'];
type Row = PageData['rows'][number];
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

const EMPTY_DATABASE = (
  <>
    <svg className="mx-auto mb-3 h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
    <p className="text-sm font-medium text-gray-600">Brak umów do wyświetlenia</p>
    <p className="mt-1 text-xs text-gray-500">Dodaj pierwszą umowę najmu, aby zobaczyć ją na liście.</p>
  </>
);

type EmptyFilterProps = {
  readonly clearFilter: () => void;
};

const EmptyFilter = ({ clearFilter }: EmptyFilterProps): JSX.Element => (
  <>
    <svg className="mx-auto mb-3 h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
    <p className="text-sm font-medium text-gray-600">Brak wyników dla wybranych filtrów</p>
    <p className="mt-1 text-xs text-gray-500">
      Spróbuj zmienić kryteria wyszukiwania lub{' '}
      <button type="button" onClick={clearFilter} className="text-blue-600 underline hover:text-blue-800">
        wyczyść filtry
      </button>
    </p>
  </>
);

const DATE_FMT = new Intl.DateTimeFormat('pl-PL', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const toPagination = (
  pagination: LeaseAgreementsSProps['pagination'],
  totalCount: number | undefined,
): Pagination | undefined =>
  totalCount === undefined ?
    undefined :
    {
      page: pagination.page,
      pageSize: pagination.pageSize,
      goToPage: pagination.goToPage,
      prevPage: pagination.prevPage,
      nextPage: pagination.nextPage,
    };

const onFilterInput = (
  onChange: (text: string) => void,
): ((e: ChangeEvent<HTMLInputElement>) => void) =>
  (e: ChangeEvent<HTMLInputElement>): void => {
    onChange(e.target.value);
  };

const onDateInput = (
  onChange: (value: string) => void,
): ((e: ChangeEvent<HTMLInputElement>) => void) =>
  (e: ChangeEvent<HTMLInputElement>): void => {
    onChange(e.target.value);
  };

const onSelectInput = (
  onChange: (value: string) => void,
): ((e: ChangeEvent<HTMLSelectElement>) => void) =>
  (e: ChangeEvent<HTMLSelectElement>): void => {
    onChange(e.target.value);
  };

const inputClass = 'rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

const labelClass = 'block text-xs font-medium text-gray-600 mb-1';

const chipClass = 'inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700';

const chipRemoveClass = 'ml-0.5 inline-flex h-4 w-4 cursor-pointer items-center justify-center rounded-full text-blue-500 hover:bg-blue-200 hover:text-blue-800';

type FilterChip = {
  readonly key: string;
  readonly label: string;
  readonly onRemove: () => void;
};

const buildFilterChips = (
  filter: LeaseAgreementsSProps['filter'],
): readonly FilterChip[] =>
  [
    ...(filter.text.length > 0 ? [{ key: 'text' as const, label: `Szukaj: ${filter.text}`, onRemove: () => filter.setText('') }] : []),
    ...(filter.leaseStatus.length > 0 ? [{ key: 'leaseStatus' as const, label: `Status: ${LEASE_STATUS_LABEL[filter.leaseStatus as LeaseStatus] ?? filter.leaseStatus}`, onRemove: () => filter.setLeaseStatus('') }] : []),
    ...(filter.dateFrom.length > 0 ? [{ key: 'dateFrom' as const, label: `Od: ${DATE_FMT.format(new Date(filter.dateFrom))}`, onRemove: () => filter.setDateFrom('') }] : []),
    ...(filter.dateTo.length > 0 ? [{ key: 'dateTo' as const, label: `Do: ${DATE_FMT.format(new Date(filter.dateTo))}`, onRemove: () => filter.setDateTo('') }] : []),
  ];

export const LeaseAgreementsS = ({
  asyncData,
  navLinkTo,
  sort,
  pagination,
  filter,
  clearFilter,
  isFilterActive,
  activeFilterCount,
  filterResetKey,
}: LeaseAgreementsSProps): JSX.Element => {
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent): void => {
      const target = e.target as Node | null;
      const inside = toolbarRef.current?.contains(target) ?? false;
      !inside ? setShowFilterPanel(false) : undefined;
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filterChips = buildFilterChips(filter);

  const filterIcon = (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M1.5 2.75a.75.75 0 01.75-.75h11.5a.75.75 0 010 1.5H2.25a.75.75 0 01-.75-.75zM3.5 7.25a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM5.5 11.75a.75.75 0 01.75-.75h3.5a.75.75 0 010 1.5h-3.5a.75.75 0 01-.75-.75z" />
    </svg>
  );

  const popoverClosed = 'opacity-0 scale-95 pointer-events-none -translate-y-1';
  const popoverOpen = 'opacity-100 scale-100 pointer-events-auto translate-y-0';

  return (
    <div className="min-h-[300px]">
      <h1 className="mb-4 text-xl font-semibold text-gray-900">Umowy najmu</h1>
      <div ref={toolbarRef} className="relative mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFilterPanel((prev) => !prev)}
            aria-expanded={showFilterPanel}
            className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium shadow-sm transition-colors ${
              isFilterActive ?
                'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100' :
                'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {filterIcon}
            Filtry{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </button>
          {filterChips.map((chip) => (
            <span key={chip.key} className={chipClass}>
              {chip.label}
              <button type="button" onClick={chip.onRemove} className={chipRemoveClass} aria-label={`Usuń filtr: ${chip.label}`}>
                ×
              </button>
            </span>
          ))}
          {isFilterActive ? (
            <button type="button" onClick={clearFilter} className="text-xs font-medium text-gray-500 underline hover:text-gray-700">
              Wyczyść filtry
            </button>
          ) : null}
          <span className="ml-auto text-sm text-gray-500">
            {match(asyncData)
              .with({ tag: 'fulfilled' }, ({ data }) => `Znaleziono: ${data.totalCount}${isFilterActive ? ' (filtrowane)' : ''}`)
              .otherwise(() => null)}
          </span>
        </div>
        <div
          id="filter-panel"
          className={`absolute left-0 top-full z-20 mt-1 flex flex-wrap items-end gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-lg transition-all duration-200 ${showFilterPanel ? popoverOpen : popoverClosed}`}
          key={filterResetKey}
        >
          <div className="min-w-[240px]">
            <label htmlFor="lease-filter" className={labelClass}>
              Szukaj
            </label>
            <input
              id="lease-filter"
              type="search"
              defaultValue={filter.text}
              onChange={onFilterInput(filter.setText)}
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
              defaultValue={filter.leaseStatus}
              onChange={onSelectInput(filter.setLeaseStatus)}
              className={inputClass}
            >
              <option value="">Wszystkie</option>
              {Object.entries(LEASE_STATUS_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="lease-date-from" className={labelClass}>
              Data od
            </label>
            <input
              id="lease-date-from"
              type="date"
              defaultValue={filter.dateFrom}
              onChange={onDateInput(filter.setDateFrom)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="lease-date-to" className={labelClass}>
              Data do
            </label>
            <input
              id="lease-date-to"
              type="date"
              defaultValue={filter.dateTo}
              onChange={onDateInput(filter.setDateTo)}
              className={inputClass}
            />
          </div>
        </div>
      </div>
      <div role="status" aria-live="polite">
        {match(asyncData)
          .with({ tag: 'pending' }, () => (
            <DataTableS
              columns={COLUMNS}
              sort={undefined}
              isFetching={true}
              rows={[]}
              skeletonRows={SKELETON_ROWS}
              emptyState={EMPTY_DATABASE}
              renderRow={() => <></>}
            />
          ))
          .with({ tag: 'rejected' }, ({ message, onRetry }) => (
            <ErrorMessage message={message} onRetry={onRetry} />
          ))
          .with({ tag: 'fulfilled' }, ({ data, isFetching }) => (
            <div id="lease-table">
              <DataTableS
                maxHeight="calc(100vh - 10rem)"
                columns={COLUMNS}
                sort={sort}
                isFetching={isFetching ?? false}
                rows={data.rows}
                skeletonRows={SKELETON_ROWS}
                emptyState={isFilterActive ? <EmptyFilter clearFilter={clearFilter} /> : EMPTY_DATABASE}
                pagination={toPagination(pagination, data.totalCount)}
                totalCount={data.totalCount}
                onPageSizeChange={pagination.setPageSize}
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
            </div>
          ))
          .exhaustive()}
      </div>
    </div>
  );
};