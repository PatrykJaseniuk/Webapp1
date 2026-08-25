import { match } from 'ts-pattern';
import type { TreasuriesSProps } from '@/masterComponents/TreasuriesM';
import type { ColumnDef } from './DataTableS';
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

type PageData = Extract<TreasuriesSProps['asyncData'], { readonly tag: 'fulfilled' }>['data'];
type Row = PageData['rows'][number];
type Sort = TreasuriesSProps['sort'];
type SortColumn = Sort['config']['column'];
type Filter = TreasuriesSProps['filter'];

const COLUMNS: readonly ColumnDef<SortColumn>[] = [
  { key: 'treasury_name', label: 'Nazwa', sortColumn: 'treasury_name', align: 'left', className: 'pl-4 min-w-[200px] pr-4' },
  { key: 'is_active', label: 'Status', sortColumn: null, align: 'left', className: 'pr-4 whitespace-nowrap' },
  { key: 'entry_count', label: 'Zapisy', sortColumn: null, align: 'right', className: 'pr-4 whitespace-nowrap' },
  { key: 'last_value_date', label: 'Ostatni ruch', sortColumn: 'last_value_date', align: 'left', className: 'pr-4 whitespace-nowrap' },
  { key: 'balance', label: 'Saldo', sortColumn: 'balance', align: 'right', className: 'pr-4 whitespace-nowrap' },
];

const skeletonBar = 'h-4 animate-pulse rounded bg-gray-200';

const SKELETON_ROWS = (
  <>
    {Array.from({ length: 4 }, (_, i) => (
      <tr key={`skel-${i}`} className="border-b border-gray-100">
        <td className="pl-4 h-12 py-0 pr-4"><div className={`${skeletonBar} w-40`} /></td>
        <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} w-20`} /></td>
        <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} ml-auto w-10`} /></td>
        <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} w-24`} /></td>
        <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} ml-auto w-24`} /></td>
      </tr>
    ))}
  </>
);

const EMPTY_DATABASE = (
  <EmptyStateS
    iconPath="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 20.25z"
    title="Brak skarbców"
    description="Dodaj konto bankowe lub kasę gotówkową, aby móc rejestrować ruchy pieniędzy."
  />
);

const activePill = (isActive: boolean): JSX.Element => (
  <span
    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
      isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
    }`}
  >
    <span aria-hidden="true">{isActive ? '●' : '○'}</span>
    {isActive ? 'Aktywny' : 'Nieaktywny'}
  </span>
);

const buildChips = (filter: Filter): readonly FilterChip[] => {
  const text = filter.config.text ?? '';
  return text.length > 0
    ? [{
        key: 'text',
        label: `Nazwa: ${text}`,
        onRemove: () => filter.doFilter(setFilterString(filter.config, 'text', '')),
      }]
    : [];
};

export const TreasuriesS = ({
  asyncData,
  navLinkTo,
  sort,
  pagination,
  filter,
}: TreasuriesSProps): JSX.Element => (
  <div className="mx-auto max-w-6xl space-y-4 py-8">
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold text-gray-900">Skarbce</h1>
      <span className="[&_a]:rounded-md [&_a]:bg-blue-600 [&_a]:px-4 [&_a]:py-2 [&_a]:text-sm [&_a]:font-medium [&_a]:text-white hover:[&_a]:bg-blue-700">
        {navLinkTo.create({ style: {}, content: 'Nowy skarbiec' })}
      </span>
    </div>

    <FilterToolbarS
      isFilterActive={isFilterActive(filter.config)}
      activeFilterCount={activeFilterCount(filter.config)}
      clearFilter={() => filter.doFilter({})}
      chips={buildChips(filter)}
      resultCount={match(asyncData)
        .with({ tag: 'fulfilled' }, ({ data }) => `Znaleziono: ${data.totalCount}${isFilterActive(filter.config) ? ' (filtrowane)' : ''}`)
        .otherwise(() => null)}
      panel={
        <div className="min-w-[220px]">
          <label htmlFor="treasury-filter-text" className={labelClass}>
            Nazwa
          </label>
          <input
            id="treasury-filter-text"
            type="search"
            value={filter.config.text ?? ''}
            onChange={onFilterInput((v) => filter.doFilter(setFilterString(filter.config, 'text', v)))}
            placeholder="np. bankowe…"
            className={`${inputClass} w-full`}
          />
        </div>
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
      renderRow={(row) => (
        <tr key={row.treasury_id} className="border-b border-gray-100 hover:bg-gray-50">
          <td className="pl-4 h-12 py-0 pr-4">
            <span className="[&_a]:font-medium [&_a]:text-blue-600 hover:[&_a]:underline">
              {navLinkTo.treasury({
                id: row.treasury_id,
                style: {},
                content: row.treasury_name ?? '—',
                ariaLabel: `Otwórz skarbiec ${row.treasury_name ?? ''}`,
              })}
            </span>
          </td>
          <td className="h-12 py-0 pr-4">{activePill(row.is_active ?? false)}</td>
          <td className="h-12 py-0 pr-4 text-right text-sm text-gray-700">{row.entry_count ?? 0}</td>
          <td className="h-12 py-0 pr-4 text-sm text-gray-700">
            {row.last_value_date !== null && row.last_value_date !== undefined ? formatDate(row.last_value_date) : '—'}
          </td>
          <td className={`h-12 py-0 pr-4 text-right text-sm font-medium ${(row.balance ?? 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {formatPln(row.balance ?? 0)}
          </td>
        </tr>
      )}
    />
  </div>
);
