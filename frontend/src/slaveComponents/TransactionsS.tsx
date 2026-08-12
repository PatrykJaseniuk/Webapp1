import { match } from 'ts-pattern';
import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import type { TransactionsSProps } from '@/masterComponents/TransactionsM';
import { ErrorMessage } from './ErrorMessageS';
import { DataTableS, type ColumnDef, type Pagination } from './DataTableS';

type PageData = Extract<TransactionsSProps['asyncData'], { readonly tag: 'fulfilled' }>['data'];
type Row = PageData['rows'][number];
type Sort = TransactionsSProps['sort'];
type SortColumn = Sort['config']['column'];
type TxnType = Row['type'];
type TxnStatus = Row['transaction_status'];

const TRANSACTION_TYPE_LABEL: Readonly<Record<TxnType, string>> = Object.freeze({
  rent: 'Czynsz',
  utility: 'Media',
  expense: 'Wydatek',
  payment: 'Wpłata',
  withdraw: 'Wypłata',
  fee: 'Opłata',
  other: 'Inne',
});

const TRANSACTION_STATUS_LABEL: Readonly<Record<TxnStatus, string>> = Object.freeze({
  pending: 'Oczekująca',
  paid: 'Opłacona',
  overdue: 'Zaległa',
});

const DATE_FMT = new Intl.DateTimeFormat('pl-PL', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const AMOUNT_FMT = new Intl.NumberFormat('pl-PL', {
  style: 'currency',
  currency: 'PLN',
});

const pillClass = 'inline-block rounded-full px-2 py-0.5 text-xs font-medium';

const txnStatusPillClass = (status: TxnStatus): string =>
  status === 'paid' ?
    `${pillClass} bg-green-50 text-green-700` :
    status === 'overdue' ?
      `${pillClass} bg-red-50 text-red-700` :
      `${pillClass} bg-yellow-50 text-yellow-700`;

const txnAmountClass = (amount: number): string =>
  amount >= 0 ? 'text-sm font-medium text-green-700' : 'text-sm font-medium text-red-700';

const formatAmount = (amount: number): string =>
  AMOUNT_FMT.format(amount);

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
  <>
    <svg className="mx-auto mb-3 h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18M9 6h.01M15 18h.01M3 6v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
    </svg>
    <p className="text-sm font-medium text-gray-600">Brak transakcji do wyświetlenia</p>
    <p className="mt-1 text-xs text-gray-500">Dodaj pierwszą transakcję, aby zobaczyć ją na liście.</p>
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

const leaseLabel = (tx: Row): string => {
  const startDate = tx.lease_agreements?.start_date;
  const id8 = tx.lease_id?.slice(0, 8);
  return startDate !== null && startDate !== undefined ?
    `Umowa od ${DATE_FMT.format(new Date(startDate))}` :
    id8 !== undefined ? `Umowa #${id8}` : '—';
};

const toPagination = (
  pagination: TransactionsSProps['pagination'],
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
  filter: TransactionsSProps['filter'],
): readonly FilterChip[] => {
  const base: ReadonlyArray<{ readonly key: string; readonly label: string | null; readonly onRemove: () => void }> = Object.freeze([
    { key: 'text', label: filter.text.length > 0 ? `Nieruchomość: ${filter.text}` : null, onRemove: () => filter.setText('') },
    { key: 'type', label: filter.type.length > 0 ? `Typ: ${TRANSACTION_TYPE_LABEL[filter.type as TxnType] ?? filter.type}` : null, onRemove: () => filter.setType('') },
    { key: 'dateFrom', label: filter.dateFrom.length > 0 ? `Od: ${DATE_FMT.format(new Date(filter.dateFrom))}` : null, onRemove: () => filter.setDateFrom('') },
    { key: 'dateTo', label: filter.dateTo.length > 0 ? `Do: ${DATE_FMT.format(new Date(filter.dateTo))}` : null, onRemove: () => filter.setDateTo('') },
  ]);

  return base.filter((c): c is FilterChip => c.label !== null);
};

export const TransactionsS = ({
  asyncData,
  navLinkTo,
  sort,
  pagination,
  filter,
  clearFilter,
  isFilterActive,
  activeFilterCount,
  filterResetKey,
}: TransactionsSProps): JSX.Element => {
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
      <h1 className="mb-4 text-xl font-semibold text-gray-900">Transakcje</h1>
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
              aria-controls="txn-table"
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
              {Object.entries(TRANSACTION_TYPE_LABEL).map(([value, label]) => (
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
              onChange={onDateInput(filter.setDateFrom)}
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
            <div id="txn-table">
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
                renderRow={(tx) => (
                  <tr
                    key={tx.id}
                    className="group border-b border-gray-100 text-sm hover:bg-gray-50"
                  >
                    <td className="pl-4 h-12 py-0 pr-6 [&_a]:text-blue-600 hover:[&_a]:text-blue-800 focus-visible:[&_a]:outline-none focus-visible:[&_a]:ring-2 focus-visible:[&_a]:ring-blue-500">
                      {navLinkTo.transaction({ id: tx.id, style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', borderRadius: '6px' }, content: '→', ariaLabel: `Szczegóły transakcji${tx.description !== null ? ': ' + tx.description : ''}` })}
                    </td>
                    <td className="h-12 py-0 pr-4 text-gray-600 whitespace-nowrap">{DATE_FMT.format(new Date(tx.due_date))}</td>
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
                    <td className={`h-12 py-0 pr-4 text-right whitespace-nowrap font-mono ${txnAmountClass(tx.amount)}`}>{formatAmount(tx.amount)}</td>
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