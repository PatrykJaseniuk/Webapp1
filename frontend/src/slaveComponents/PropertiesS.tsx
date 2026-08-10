import { match } from 'ts-pattern';
import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent } from 'react';
import type { PropertiesSProps } from '@/masterComponents/PropertiesM';
import { ErrorMessage } from './ErrorMessageS';
import { DataTableS, type ColumnDef, type Pagination } from './DataTableS';

type PageData = Extract<PropertiesSProps['asyncData'], { readonly tag: 'fulfilled' }>['data'];
type Row = PageData['rows'][number];
type Sort = PropertiesSProps['sort'];
type SortColumn = Sort['config']['column'];
type PropertyStatus = NonNullable<Row['property_status']>;
type PropertyType = NonNullable<Row['property_type']>;

export const STATUS_LABEL: Readonly<Record<PropertyStatus, string>> = Object.freeze({
  available: 'Dostępna',
  occupied: 'Zajęta',
  inactive: 'Nieaktywna',
});

export const TYPE_LABEL: Readonly<Record<PropertyType, string>> = Object.freeze({
  apartment: 'Mieszkanie',
  house: 'Dom',
  commercial: 'Lokal',
  room: 'Pokój',
});

const pillClass = 'inline-block rounded-full px-2 py-0.5 text-xs font-medium';

const statusPillClass = (status: PropertyStatus): string =>
  status === 'available' ?
    `${pillClass} bg-green-50 text-green-700` :
    status === 'occupied' ?
      `${pillClass} bg-blue-50 text-blue-700` :
      `${pillClass} bg-gray-50 text-gray-600`;

const COLUMNS: readonly ColumnDef<SortColumn>[] = [
  { key: 'action', label: null, sortColumn: null, align: 'left', className: 'pl-4 w-10 pr-6' },
  { key: 'name', label: 'Nazwa', sortColumn: 'name', align: 'left', className: 'min-w-[160px] pr-4' },
  { key: 'address', label: 'Adres', sortColumn: 'address', align: 'left', className: 'min-w-[180px] pr-4' },
  { key: 'property_type', label: 'Typ', sortColumn: 'property_type', align: 'left', className: 'pr-4 whitespace-nowrap' },
  { key: 'tenant', label: 'Najemca', sortColumn: null, align: 'left', className: 'min-w-[140px] pr-4' },
  { key: 'property_status', label: 'Status', sortColumn: 'property_status', align: 'left', className: 'pr-4 whitespace-nowrap' },
  { key: 'monthly_rent', label: 'Czynsz', sortColumn: 'monthly_rent', align: 'right', className: 'pr-4 whitespace-nowrap' },
];

const skeletonBar = 'h-4 animate-pulse rounded bg-gray-200';

const SKELETON_ROWS = (
  <>
    {Array.from({ length: 6 }, (_, i) => (
      <tr key={`skel-${i}`} className="border-b border-gray-100">
        <td className="pl-4 h-12 py-0 pr-6"><div className={`${skeletonBar} w-6`} /></td>
        <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} w-32`} /></td>
        <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} w-36`} /></td>
        <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} w-20`} /></td>
        <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} w-24`} /></td>
        <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} w-20`} /></td>
        <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} ml-auto w-16`} /></td>
      </tr>
    ))}
  </>
);

const EMPTY_DATABASE = (
  <>
    <svg className="mx-auto mb-3 h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
    <p className="text-sm font-medium text-gray-600">Brak nieruchomości do wyświetlenia</p>
    <p className="mt-1 text-xs text-gray-500">Dodaj pierwszą nieruchomość, aby zobaczyć ją na liście.</p>
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

const toPagination = (
  pagination: PropertiesSProps['pagination'],
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
  filter: PropertiesSProps['filter'],
): readonly FilterChip[] =>
  [
    ...(filter.text.length > 0 ? [{ key: 'text' as const, label: `Szukaj: ${filter.text}`, onRemove: () => filter.setText('') }] : []),
    ...(filter.propertyType.length > 0 ? [{ key: 'propertyType' as const, label: `Typ: ${TYPE_LABEL[filter.propertyType as PropertyType] ?? filter.propertyType}`, onRemove: () => filter.setPropertyType('') }] : []),
    ...(filter.propertyStatus.length > 0 ? [{ key: 'propertyStatus' as const, label: `Status: ${STATUS_LABEL[filter.propertyStatus as PropertyStatus] ?? filter.propertyStatus}`, onRemove: () => filter.setPropertyStatus('') }] : []),
  ];

export const PropertiesS = ({
  asyncData,
  navLinkTo,
  sort,
  pagination,
  filter,
  clearFilter,
  isFilterActive,
  activeFilterCount,
  filterResetKey,
}: PropertiesSProps): JSX.Element => {
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
      <h1 className="mb-4 text-xl font-semibold text-gray-900">Nieruchomości</h1>
      <div ref={toolbarRef} className="relative mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFilterPanel((prev) => !prev)}
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
              Wyczyść
            </button>
          ) : null}
          <span className="ml-auto text-sm text-gray-500">
            {match(asyncData)
              .with({ tag: 'fulfilled' }, ({ data }) => `Znaleziono: ${data.totalCount}${isFilterActive ? ' (filtrowane)' : ''}`)
              .otherwise(() => null)}
          </span>
        </div>
        <div
          className={`absolute left-0 top-full z-20 mt-1 flex flex-wrap items-end gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-lg transition-all duration-200 ${showFilterPanel ? popoverOpen : popoverClosed}`}
          key={filterResetKey}
        >
          <div className="min-w-[280px]">
            <label htmlFor="prop-filter" className={labelClass}>
              Szukaj (nazwa, adres)
            </label>
            <input
              id="prop-filter"
              type="search"
              defaultValue={filter.text}
              onChange={onFilterInput(filter.setText)}
              placeholder="Wpisz fragment nazwy lub adresu…"
              className={`${inputClass} w-full`}
              aria-controls="prop-table"
            />
          </div>
          <div>
            <label htmlFor="prop-type" className={labelClass}>
              Typ
            </label>
            <select
              id="prop-type"
              defaultValue={filter.propertyType}
              onChange={onSelectInput(filter.setPropertyType)}
              className={inputClass}
            >
              <option value="">Wszystkie</option>
              {Object.entries(TYPE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="prop-status" className={labelClass}>
              Status
            </label>
            <select
              id="prop-status"
              defaultValue={filter.propertyStatus}
              onChange={onSelectInput(filter.setPropertyStatus)}
              className={inputClass}
            >
              <option value="">Wszystkie</option>
              {Object.entries(STATUS_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
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
            <div id="prop-table">
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
                renderRow={(p) => (
                  <tr
                    key={p.id ?? ''}
                    className="group border-b border-gray-100 text-sm hover:bg-gray-50"
                  >
                    <td className="pl-4 h-12 py-0 pr-6 [&_a]:text-blue-600 hover:[&_a]:text-blue-800 focus-visible:[&_a]:outline-none focus-visible:[&_a]:ring-2 focus-visible:[&_a]:ring-blue-500">
                      {navLinkTo.property({ id: p.id ?? '', style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', borderRadius: '6px' }, content: '→', ariaLabel: p.name !== null ? `Szczegóły nieruchomości: ${p.name}` : 'Szczegóły nieruchomości' })}
                    </td>
                    <td className="h-12 py-0 pr-4 text-gray-900" title={p.name ?? undefined}>
                      <div className="truncate">{p.name ?? ''}</div>
                    </td>
                    <td className="h-12 py-0 pr-4 text-gray-600" title={p.address ?? undefined}>
                      <div className="truncate">{p.address}</div>
                    </td>
                    <td className="h-12 py-0 pr-4 text-gray-600 whitespace-nowrap">
                      {p.property_type !== null ?
                        TYPE_LABEL[p.property_type] :
                        <span className="text-gray-400">—</span>}
                    </td>
                    <td className="h-12 py-0 pr-4 text-gray-600 [&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline" title={p.current_tenant_name ?? undefined}>
                      <div className="truncate">
                        {p.current_tenant_name !== null && p.tenant_id !== null ?
                          navLinkTo.tenant({ id: p.tenant_id, style: {}, content: p.current_tenant_name }) :
                          <span className="text-gray-400">—</span>}
                      </div>
                    </td>
                    <td className="h-12 py-0 pr-4 whitespace-nowrap">
                      {p.property_status !== null ?
                        <span className={statusPillClass(p.property_status)}>
                          {STATUS_LABEL[p.property_status] ?? p.property_status}
                        </span> :
                        <span className="text-gray-400">—</span>}
                    </td>
                    <td className="h-12 py-0 pr-4 text-right text-gray-900 whitespace-nowrap">
                      {(p.monthly_rent ?? 0).toLocaleString('pl-PL')} zł
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