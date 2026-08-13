import { match } from 'ts-pattern';
import type { TransactionsSProps } from '@/masterComponents/TransactionsM';
import type { ColumnDef } from './DataTableS';
import { TRANSACTION_STATUS_LABEL, TRANSACTION_TYPE_LABEL } from './domain';
import { amountClass, txnStatusPillClass } from './pills';
import { formatDate, formatPln } from './format';
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

type PageData = Extract<TransactionsSProps['asyncData'], { readonly tag: 'fulfilled' }>['data'];
type Row = PageData['rows'][number];
type Sort = TransactionsSProps['sort'];
type SortColumn = Sort['config']['column'];
type TxnType = Row['type'];

const COLUMNS: readonly ColumnDef<SortColumn>[] = [
  { key: 'action', label: null, sortColumn: null, align: 'left', className: 'pl-4 w-10 pr-6' },
  { key: 'due_date', label: 'Termin', sortColumn: 'due_date', align: 'left', className: 'pr-4 whitespace-nowrap' },
  { key: 'type', label: 'Typ', sortColumn: 'type', align: 'left', className: 'pr-4 whitespace-nowrap' },
  { key: 'description', label: 'Opis', sortColumn: null, align: 'left', className: 'min-w-[180px] pr-4' },
  { key: 'properties', label: 'Nieruchomość', sortColumn: 'properties', align: 'left', className: 'min-w-[140px] pr-4' },
  { key: 'lease', label: 'Umowa', sortColumn: null, align: 'left', className: 'min-w-[140px] pr-4' },
  { key: 'status', label: 'Status', sortColumn: 'transaction_status', align: 'left', className: 'pr-4 whitespace-nowrap' },
  { key: 'amount', label: 'Kwota', sortColumn: 'amount', align: 'right', className: 'pr-4 whitespace-nowrap' },
];

const skeletonBar = 'h-4 animate-pulse rounded bg-gray-200';

const SKELETON_ROWS = (
  <>
    {Array.from({ length: 6 }, (_, i) => (
      <tr key={`skel-${i}`} className="border-b border-gray-100">
        <td className="pl-4 h-12 py-0 pr-6"><div className={`${skeletonBar} w-6`} /></td>
        <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} w-20`} /></td>
        <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} w-16`} /></td>
        <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} w-32`} /></td>
        <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} w-28`} /></td>
        <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} w-24`} /></td>
        <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} w-16`} /></td>
        <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} ml-auto w-20`} /></td>
      </tr>
    ))}
  </>
);

const EMPTY_DATABASE = (
  <EmptyStateS
    iconPath="M3 10h18M3 14h18M9 6h.01M15 18h.01M3 6v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2z"
    title="Brak transakcji do wyświetlenia"
    description="Dodaj pierwszą transakcję, aby zobaczyć ją na liście."
  />
);

const leaseLabel = (tx: Row): string => {
  const startDate = tx.lease_agreements?.start_date;
  const id8 = tx.lease_id?.slice(0, 8);
  return startDate !== null && startDate !== undefined ?
    `Umowa od ${formatDate(startDate)}` :
    id8 !== undefined ? `Umowa #${id8}` : '—';
};

const buildFilterChips = (
  filter: TransactionsSProps['filter'],
): readonly FilterChip[] => {
  const base: ReadonlyArray<{ readonly key: string; readonly label: string | null; readonly onRemove: () => void }> = Object.freeze([
    { key: 'text', label: filter.text.length > 0 ? `Nieruchomość: ${filter.text}` : null, onRemove: () => filter.setText('') },
    { key: 'type', label: filter.type.length > 0 ? `Typ: ${TRANSACTION_TYPE_LABEL[filter.type as TxnType] ?? filter.type}` : null, onRemove: () => filter.setType('') },
    { key: 'dateFrom', label: filter.dateFrom.length > 0 ? `Od: ${formatDate(filter.dateFrom)}` : null, onRemove: () => filter.setDateFrom('') },
    { key: 'dateTo', label: filter.dateTo.length > 0 ? `Do: ${formatDate(filter.dateTo)}` : null, onRemove: () => filter.setDateTo('') },
  ]);

  return base.filter((c): c is FilterChip => c.label !== null);
};

export const TransactionsS = ({
  asyncData,
  navLinkTo,
  sort,
  pagination,
  filter,
}: TransactionsSProps): JSX.Element => (
  <div className="min-h-[300px]">
    <h1 className="mb-4 text-xl font-semibold text-gray-900">Transakcje</h1>
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
          <div className="min-w-[220px]">
            <label htmlFor="txn-filter" className={labelClass}>
              Szukaj (nieruchomość)
            </label>
            <input
              id="txn-filter"
              type="search"
              defaultValue={filter.text}
              onChange={onFilterInput(filter.setText)}
              placeholder="Wpisz nazwę nieruchomości…"
              className={`${inputClass} w-full`}
            />
          </div>
          <div>
            <label htmlFor="txn-type" className={labelClass}>
              Typ
            </label>
            <select
              id="txn-type"
              defaultValue={filter.type}
              onChange={onSelectInput(filter.setType)}
              className={inputClass}
            >
              <option value="">Wszystkie</option>
              {optionEntries(TRANSACTION_TYPE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="txn-date-from" className={labelClass}>
              Termin od
            </label>
            <input
              id="txn-date-from"
              type="date"
              defaultValue={filter.dateFrom}
              onChange={onFilterInput(filter.setDateFrom)}
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
              defaultValue={filter.dateTo}
              onChange={onFilterInput(filter.setDateTo)}
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
      filteredEmptyState={<FilterEmptyStateS clearFilter={filter.clearFilter} />}
      isFilterActive={filter.isFilterActive}
      renderRow={(tx) => (
        <tr
          key={tx.id}
          className="group border-b border-gray-100 text-sm hover:bg-gray-50"
        >
          <td className="pl-4 h-12 py-0 pr-6 [&_a]:text-blue-600 hover:[&_a]:text-blue-800 focus-visible:[&_a]:outline-none focus-visible:[&_a]:ring-2 focus-visible:[&_a]:ring-blue-500">
            {navLinkTo.transaction({ id: tx.id, style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', borderRadius: '6px' }, content: '→', ariaLabel: `Szczegóły transakcji${tx.description !== null ? ': ' + tx.description : ''}` })}
          </td>
          <td className="h-12 py-0 pr-4 text-gray-600 whitespace-nowrap">{formatDate(tx.due_date)}</td>
          <td className="h-12 py-0 pr-4 text-gray-600 whitespace-nowrap">{TRANSACTION_TYPE_LABEL[tx.type] ?? tx.type}</td>
          <td className="h-12 py-0 pr-4 text-gray-600" title={tx.description ?? undefined}>
            <div className="truncate">
              {tx.description !== null ? tx.description : <span className="text-gray-400">—</span>}
            </div>
          </td>
          <td className="h-12 py-0 pr-4 [&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline" title={tx.properties?.name ?? undefined}>
            <div className="truncate">
              {tx.property_id !== null && tx.properties !== null && tx.properties.name !== null ?
                navLinkTo.property({ id: tx.property_id, style: {}, content: tx.properties.name }) :
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
          <td className="h-12 py-0 pr-4">
            <span className={txnStatusPillClass(tx.transaction_status)}>
              {TRANSACTION_STATUS_LABEL[tx.transaction_status] ?? tx.transaction_status}
            </span>
          </td>
          <td className={`h-12 py-0 pr-4 text-right whitespace-nowrap font-mono ${amountClass(tx.amount)}`}>{formatPln(tx.amount)}</td>
        </tr>
      )}
    />
  </div>
);