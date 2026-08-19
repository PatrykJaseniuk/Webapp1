type SortDirection = 'asc' | 'desc';

type SortConfig<C extends string> = {
  readonly column: C;
  readonly direction: SortDirection;
};

const SortIcon = ({ direction }: { readonly direction: 'asc' | 'desc' | null }): JSX.Element => (
  <svg
    className={`ml-1 inline-block h-3 w-3 transition-opacity ${
      direction === null ?
        'opacity-30 group-hover:opacity-60 group-focus-visible:opacity-60' :
        'text-blue-600 opacity-100'
    } ${direction === 'desc' ? 'rotate-180' : ''}`}
    viewBox="0 0 12 12"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M6 3l4.5 6h-9z" />
  </svg>
);

export type ColumnDef<SortColumn extends string> = {
  readonly key: string;
  readonly label: string | null;
  readonly sortColumn: SortColumn | null;
  readonly align: 'left' | 'right';
  readonly className: string;
};

type Sort<SortColumn extends string> = {
  readonly config: SortConfig<SortColumn>;
  readonly doSort: (column: SortColumn) => void;
};

type SortHeaderProps<SortColumn extends string> = {
  readonly column: SortColumn;
  readonly label: string;
  readonly sort: Sort<SortColumn>;
  readonly align?: 'left' | 'right';
  readonly className?: string;
};

const SortHeader = <SortColumn extends string>({
  column,
  label,
  sort,
  align = 'left',
  className = '',
}: SortHeaderProps<SortColumn>): JSX.Element => {
  const isActive = sort.config.column === column;
  const direction: 'asc' | 'desc' | null = isActive ? sort.config.direction : null;
  const ariaSort = isActive ? (direction === 'asc' ? 'ascending' as const : 'descending' as const) : 'none' as const;
  const alignClass = align === 'right' ? 'text-right' : 'text-left';
  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className={`${className} h-12 py-0 font-medium whitespace-nowrap ${alignClass}`}
    >
      <button
        type="button"
        className="group cursor-pointer select-none rounded-sm text-gray-500 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        onClick={() => sort.doSort(column)}
      >
        {label}
        <SortIcon direction={direction} />
      </button>
    </th>
  );
};

const StaticHeaderCell = <SortColumn extends string>({ col }: { readonly col: ColumnDef<SortColumn> }): JSX.Element => (
  <th
    scope="col"
    className={`${col.className} h-12 py-0 font-medium text-gray-500 ${col.align === 'right' ? 'text-right' : 'text-left'}`}
  >
    {col.label === null ? <span className="sr-only">Akcje</span> : col.label}
  </th>
);

const FetchProgress = (): JSX.Element => (
  <div className="absolute top-0 left-0 right-0 h-0.5 overflow-hidden bg-blue-100" role="progressbar" aria-label="Ładowanie danych">
    <div className="h-full animate-[indeterminate_1.5s_ease-in-out_infinite] bg-blue-500" />
  </div>
);

export type Pagination = {
  readonly page: number;
  readonly pageSize: number;
  readonly goToPage: (n: number) => void;
  readonly prevPage: () => void;
  readonly nextPage: () => void;
};

const DEFAULT_PAGE_SIZE_OPTIONS: readonly number[] = [20, 50, 100];

const PaginationFooter = ({
  pagination,
  totalCount,
  onPageSizeChange,
  pageSizeOptions,
}: {
  readonly pagination: Pagination;
  readonly totalCount: number;
  readonly onPageSizeChange?: (size: number) => void;
  readonly pageSizeOptions: readonly number[];
}): JSX.Element => {
  const totalPages = Math.max(1, Math.ceil(totalCount / pagination.pageSize));
  const from = totalCount === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const to = Math.min(pagination.page * pagination.pageSize, totalCount);

  const pageNumbers = totalPages <= 7 ?
    Array.from({ length: totalPages }, (_, i) => i + 1)
  : ((): readonly (number | 'ellipsis')[] => {
      const current = pagination.page;
      const start = Math.max(2, current - 1);
      const end = Math.min(totalPages - 1, current + 1);
      const startAdjusted = current <= 3 ? 2 : start;
      const endAdjusted = current >= totalPages - 2 ? totalPages - 1 : end;
      return [
        1,
        ...(current > 3 ? (['ellipsis'] as const) : []),
        ...Array.from({ length: endAdjusted - startAdjusted + 1 }, (_, i) => startAdjusted + i),
        ...(endAdjusted < totalPages - 1 ? (['ellipsis'] as const) : []),
        totalPages,
      ];
    })();

  const prevDisabled = pagination.page <= 1;
  const nextDisabled = pagination.page >= totalPages;

  const buttonBase = 'rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors';
  const activeButton = `${buttonBase} bg-blue-600 text-white`;
  const inactiveButton = `${buttonBase} text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`;
  const disabledButton = `${buttonBase} cursor-not-allowed text-gray-300`;

  return (
    <nav className="grid grid-cols-[1fr_auto] items-center gap-3 border-t border-gray-200 bg-white px-4 py-2.5" aria-label="Paginacja">
      <div className="flex items-center gap-1">
        <button
          type="button"
          className={prevDisabled ? disabledButton : inactiveButton}
          disabled={prevDisabled}
          onClick={pagination.prevPage}
          aria-label="Poprzednia strona"
        >
          ←
        </button>
        {pageNumbers.map((item, idx) =>
          item === 'ellipsis' ?
            <span key={`ellipsis-${idx}`} className="px-1 text-gray-400 select-none">
              …
            </span> :
            <button
              key={item}
              type="button"
              className={item === pagination.page ? activeButton : inactiveButton}
              onClick={item === pagination.page ? undefined : () => pagination.goToPage(item)}
              aria-label={`Strona ${item}`}
              aria-current={item === pagination.page ? 'page' : undefined}
            >
              {item}
            </button>,
        )}
        <button
          type="button"
          className={nextDisabled ? disabledButton : inactiveButton}
          disabled={nextDisabled}
          onClick={pagination.nextPage}
          aria-label="Następna strona"
        >
          →
        </button>
      </div>
      <div className="flex items-center gap-3 text-sm text-gray-600">
        <span>
          {from}–{to} z {totalCount}
        </span>
        {onPageSizeChange !== undefined ? (
          <select
            value={pagination.pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-label="Liczba wierszy na stronę"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        ) : (
          <span>{pagination.pageSize}</span>
        )}
      </div>
    </nav>
  );
};

type DataTableSProps<TRow, SortColumn extends string> = {
  readonly columns: readonly ColumnDef<SortColumn>[];
  readonly sort: Sort<SortColumn> | undefined;
  readonly isFetching: boolean;
  readonly rows: readonly TRow[];
  readonly skeletonRows: JSX.Element;
  readonly emptyState: JSX.Element;
  readonly renderRow: (row: TRow) => JSX.Element;
  readonly pagination?: Pagination;
  readonly totalCount?: number;
  readonly filterRow?: JSX.Element;
  readonly onPageSizeChange?: (size: number) => void;
  readonly pageSizeOptions?: readonly number[];
  readonly maxHeight?: string | null;
};

export const DataTableS = <TRow, SortColumn extends string>({
  columns,
  sort,
  isFetching,
  rows,
  skeletonRows,
  emptyState,
  renderRow,
  pagination,
  totalCount,
  filterRow,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  maxHeight,
}: DataTableSProps<TRow, SortColumn>): JSX.Element => {
  const content = (
    <>
      {filterRow}
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-gray-200 text-sm">
            {columns.map((col) =>
              sort !== undefined && col.sortColumn !== null && col.label !== null ?
                <SortHeader
                  key={col.key}
                  className={col.className}
                  column={col.sortColumn}
                  label={col.label}
                  sort={sort}
                  align={col.align}
                /> :
                <StaticHeaderCell key={col.key} col={col} />)}
          </tr>
        </thead>
      <tbody>
        {sort === undefined ?
          skeletonRows :
          rows.length === 0 ?
            <tr>
              <td colSpan={columns.length} className="py-12 text-center">
                {emptyState}
              </td>
            </tr> :
            rows.map(renderRow)}
      </tbody>
    </table>
    </>
  );

  const hasPagination = pagination !== undefined && totalCount !== undefined;

  return hasPagination ?
    <div className="relative grid grid-rows-[1fr_auto] overflow-hidden" style={maxHeight != null ? { height: maxHeight } : undefined}>
      {isFetching && <FetchProgress />}
      {filterRow}
        <div className="overflow-auto">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_#e5e7eb]">
            <tr className="border-b border-gray-200 text-sm">
              {columns.map((col) =>
                sort !== undefined && col.sortColumn !== null && col.label !== null ?
                  <SortHeader
                    key={col.key}
                    className={col.className}
                    column={col.sortColumn}
                    label={col.label}
                    sort={sort}
                    align={col.align}
                  /> :
                  <StaticHeaderCell key={col.key} col={col} />)}
            </tr>
          </thead>
          <tbody>
            {sort === undefined ?
              skeletonRows :
              rows.length === 0 ?
                <tr>
                  <td colSpan={columns.length} className="py-12 text-center">
                    {emptyState}
                  </td>
                </tr> :
                rows.map(renderRow)}
          </tbody>
        </table>
      </div>
      <div className="z-10 border-t border-gray-200 bg-white">
        <PaginationFooter pagination={pagination} totalCount={totalCount} onPageSizeChange={onPageSizeChange} pageSizeOptions={pageSizeOptions} />
      </div>
    </div> :
    <div className="relative overflow-x-auto">
      {isFetching && <FetchProgress />}
      {content}
    </div>;
};