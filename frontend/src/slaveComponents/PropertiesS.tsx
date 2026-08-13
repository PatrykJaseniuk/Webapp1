import { match } from 'ts-pattern';
import type { PropertiesSProps } from '@/masterComponents/PropertiesM';
import type { ColumnDef } from './DataTableS';
import { PROPERTY_STATUS_LABEL, PROPERTY_TYPE_LABEL } from './domain';
import { propertyStatusPillClass } from './pills';
import { formatPln } from './format';
import { EmptyStateS, FilterEmptyStateS } from './EmptyStateS';
import {
  inputClass,
  labelClass,
  onFilterInput,
  onSelectInput,
  optionEntries,
  type FilterChip,
} from './filter';
import { FilterToolbarS } from './FilterToolbarS';
import { AsyncStateTableS } from './AsyncStateTableS';

type PageData = Extract<PropertiesSProps['asyncData'], { readonly tag: 'fulfilled' }>['data'];
type Row = PageData['rows'][number];
type Sort = PropertiesSProps['sort'];
type SortColumn = Sort['config']['column'];
type PropertyStatus = NonNullable<Row['property_status']>;
type PropertyType = NonNullable<Row['property_type']>;

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
  <EmptyStateS
    iconPath="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
    title="Brak nieruchomości do wyświetlenia"
    description="Dodaj pierwszą nieruchomość, aby zobaczyć ją na liście."
  />
);

const buildFilterChips = (
  filter: PropertiesSProps['filter'],
): readonly FilterChip[] =>
  [
    ...(filter.text.length > 0 ? [{ key: 'text' as const, label: `Szukaj: ${filter.text}`, onRemove: () => filter.setText('') }] : []),
    ...(filter.propertyType.length > 0 ? [{ key: 'propertyType' as const, label: `Typ: ${PROPERTY_TYPE_LABEL[filter.propertyType as PropertyType] ?? filter.propertyType}`, onRemove: () => filter.setPropertyType('') }] : []),
    ...(filter.propertyStatus.length > 0 ? [{ key: 'propertyStatus' as const, label: `Status: ${PROPERTY_STATUS_LABEL[filter.propertyStatus as PropertyStatus] ?? filter.propertyStatus}`, onRemove: () => filter.setPropertyStatus('') }] : []),
  ];

export const PropertiesS = ({
  asyncData,
  navLinkTo,
  sort,
  pagination,
  filter,
}: PropertiesSProps): JSX.Element => (
  <div className="min-h-[300px]">
    <h1 className="mb-4 text-xl font-semibold text-gray-900">Nieruchomości</h1>
    <FilterToolbarS
      isFilterActive={filter.isFilterActive}
      activeFilterCount={filter.activeFilterCount}
      clearFilter={filter.clearFilter}
      chips={buildFilterChips(filter)}
      resultCount={match(asyncData)
        .with({ tag: 'fulfilled' }, ({ data }) => `Znaleziono: ${data.totalCount}${filter.isFilterActive ? ' (filtrowane)' : ''}`)
        .otherwise(() => null)}
      filterResetKey={filter.filterResetKey}
      panel={
        <>
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
              {optionEntries(PROPERTY_TYPE_LABEL).map(([value, label]) => (
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
              {optionEntries(PROPERTY_STATUS_LABEL).map(([value, label]) => (
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
      filteredEmptyState={<FilterEmptyStateS clearFilter={filter.clearFilter} />}
      isFilterActive={filter.isFilterActive}
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
              PROPERTY_TYPE_LABEL[p.property_type] :
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
              <span className={propertyStatusPillClass(p.property_status)}>
                {PROPERTY_STATUS_LABEL[p.property_status] ?? p.property_status}
              </span> :
              <span className="text-gray-400">—</span>}
          </td>
          <td className="h-12 py-0 pr-4 text-right text-gray-900 whitespace-nowrap">
            {formatPln(p.monthly_rent ?? 0)}
          </td>
        </tr>
      )}
    />
  </div>
);