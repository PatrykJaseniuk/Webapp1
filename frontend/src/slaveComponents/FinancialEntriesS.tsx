import { match } from 'ts-pattern';
import type { FinancialEntriesSProps } from '@/masterComponents/FinancialEntriesM';
import type { ColumnDef } from './DataTableS';
import { amountClass } from './pills';
import { formatDate, formatPln } from './format';
import { EmptyStateS, FilterEmptyStateS } from './EmptyStateS';
import {
  activeFilterCount,
  inputClass,
  isFilterActive,
  labelClass,
  onFilterInput,
  setFilterString,
  type FilterChip,
} from './filter';
import { FilterToolbarS } from './FilterToolbarS';
import { AsyncStateTableS } from './AsyncStateTableS';

type PageData = Extract<FinancialEntriesSProps['asyncData'], { readonly tag: 'fulfilled' }>['data'];
type Row = PageData['rows'][number];
type Sort = FinancialEntriesSProps['sort'];
type SortColumn = Sort['config']['column'];
type Filter = FinancialEntriesSProps['filter'];

const COLUMNS: readonly ColumnDef<SortColumn>[] = [
  { key: 'action', label: null, sortColumn: null, align: 'left', className: 'pl-4 w-10 pr-6' },
  { key: 'value_date', label: 'Termin', sortColumn: 'value_date', align: 'left', className: 'pr-4 whitespace-nowrap' },
  { key: 'description', label: 'Opis', sortColumn: null, align: 'left', className: 'min-w-[180px] pr-4' },
  { key: 'property', label: 'Nieruchomość', sortColumn: 'property', align: 'left', className: 'min-w-[140px] pr-4' },
  { key: 'lease', label: 'Umowa', sortColumn: null, align: 'left', className: 'min-w-[140px] pr-4' },
  { key: 'amount', label: 'Kwota', sortColumn: 'amount', align: 'right', className: 'pr-4 whitespace-nowrap' },
];

const skeletonBar = 'h-4 animate-pulse rounded bg-gray-200';

const SKELETON_ROWS = (
  <>
    {Array.from({ length: 6 }, (_, i) => (
      <tr key={`skel-${i}`} className="border-b border-gray-100">
        <td className="pl-4 h-12 py-0 pr-6"><div className={`${skeletonBar} w-6`} /></td>
        <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} w-20`} /></td>
        <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} w-32`} /></td>
        <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} w-28`} /></td>
        <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} w-24`} /></td>
        <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} ml-auto w-20`} /></td>
      </tr>
    ))}
  </>
);

const EMPTY_DATABASE = (
  <EmptyStateS
    iconPath="M3 10h18M3 14h18M9 6h.01M15 18h.01M3 6v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2z"
    title="Brak zapisów finansowych"
    description="Dodaj pierwszy zapis finansowy, aby zobaczyć go na liście."
  />
);

const leaseLabel = (tx: Row): string => {
  const startDate = tx.lease_agreement?.start_date;
  const id8 = tx.lease_id?.slice(0, 8);
  return startDate !== null && startDate !== undefined ?
    `Umowa od ${formatDate(startDate)}` :
    id8 !== undefined ? `Umowa #${id8}` : '—';
};

const buildFilterChips = (
  filter: Filter,
): readonly FilterChip[] => {
  const base: ReadonlyArray<{ readonly key: string; readonly label: string | null; readonly onRemove: () => void }> = Object.freeze([
    { key: 'text', label: (filter.config.text ?? '').length > 0 ? `Nieruchomość: ${filter.config.text ?? ''}` : null, onRemove: () => filter.doFilter(setFilterString(filter.config, 'text', '')) },
    { key: 'dateFrom', label: (filter.config.dateFrom ?? '').length > 0 ? `Od: ${formatDate(filter.config.dateFrom ?? '')}` : null, onRemove: () => filter.doFilter(setFilterString(filter.config, 'dateFrom', '')) },
    { key: 'dateTo', label: (filter.config.dateTo ?? '').length > 0 ? `Do: ${formatDate(filter.config.dateTo ?? '')}` : null, onRemove: () => filter.doFilter(setFilterString(filter.config, 'dateTo', '')) },
  ]);

  return base.filter((c): c is FilterChip => c.label !== null);
};

export const FinancialEntriesS = ({
  asyncData,
  navLinkTo,
  sort,
  pagination,
  filter,
}: FinancialEntriesSProps): JSX.Element => (
  <div className="min-h-[300px]">
    <div className="mb-4 flex items-center justify-between">
      <h1 className="text-xl font-semibold text-gray-900">Zapisy finansowe</h1>
      {navLinkTo.create !== undefined ? (
        <div className="[&_a]:rounded [&_a]:bg-blue-600 [&_a]:px-4 [&_a]:py-2 [&_a]:text-sm [&_a]:font-medium [&_a]:text-white hover:[&_a]:bg-blue-700">
          {navLinkTo.create({ style: {}, content: 'Dodaj zapis' })}
        </div>
      ) : null}
    </div>
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
          <div className="min-w-[220px]">
            <label htmlFor="txn-filter" className={labelClass}>
              Szukaj (nieruchomość)
            </label>
            <input
              id="txn-filter"
              type="search"
              value={filter.config.text ?? ''}
              onChange={onFilterInput((v) => filter.doFilter(setFilterString(filter.config, 'text', v)))}
              placeholder="Wpisz nazwę nieruchomości…"
              className={`${inputClass} w-full`}
            />
          </div>
          <div>
            <label htmlFor="txn-date-from" className={labelClass}>
              Termin od
            </label>
            <input
              id="txn-date-from"
              type="date"
              value={filter.config.dateFrom ?? ''}
              onChange={onFilterInput((v) => filter.doFilter(setFilterString(filter.config, 'dateFrom', v)))}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="txn-date-to" className={labelClass}>
              Termin do
            </label>
            <input
              id="txn-date-to"
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
      renderRow={(tx) => (
        <tr
          key={tx.id}
          className="group border-b border-gray-100 text-sm hover:bg-gray-50"
        >
          <td className="pl-4 h-12 py-0 pr-6 [&_a]:text-blue-600 hover:[&_a]:text-blue-800 focus-visible:[&_a]:outline-none focus-visible:[&_a]:ring-2 focus-visible:[&_a]:ring-blue-500">
            {navLinkTo.financialEntry({ id: tx.id, style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', borderRadius: '6px' }, content: '→', ariaLabel: `Szczegóły zapisu finansowego${tx.description !== null ? ': ' + tx.description : ''}` })}
          </td>
          <td className="h-12 py-0 pr-4 text-gray-600 whitespace-nowrap">{formatDate(tx.value_date)}</td>
          <td className="h-12 py-0 pr-4 text-gray-600" title={tx.description ?? undefined}>
            <div className="truncate">
              {tx.description !== null ? tx.description : <span className="text-gray-400">—</span>}
            </div>
          </td>
          <td className="h-12 py-0 pr-4 [&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline" title={tx.property?.name ?? undefined}>
            <div className="truncate">
              {tx.property_id !== null && tx.property !== null && tx.property.name !== null ?
                navLinkTo.property({ id: tx.property_id, style: {}, content: tx.property.name }) :
                <span className="text-gray-400">—</span>}
            </div>
          </td>
          <td className="h-12 py-0 pr-4 [&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline" title={tx.lease_id !== null ? leaseLabel(tx) : undefined}>
            <div className="truncate">
              {tx.lease_id !== null ?
                navLinkTo.lease({ id: tx.lease_id, style: {}, content: leaseLabel(tx) }) :
                <span className="text-gray-400">—</span>}
            </div>
          </td>
          <td className={`h-12 py-0 pr-4 text-right whitespace-nowrap font-mono ${amountClass(tx.amount)}`}>{formatPln(tx.amount)}</td>
        </tr>
      )}
    />
  </div>
);