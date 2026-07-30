import type { SortConfig } from '@/generic';

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

type DataTableSProps<TRow, SortColumn extends string> = {
  readonly columns: readonly ColumnDef<SortColumn>[];
  readonly sort: Sort<SortColumn> | undefined;
  readonly isFetching: boolean;
  readonly rows: readonly TRow[];
  readonly skeletonRows: JSX.Element;
  readonly emptyState: JSX.Element;
  readonly renderRow: (row: TRow) => JSX.Element;
};

export const DataTableS = <TRow, SortColumn extends string>({
  columns,
  sort,
  isFetching,
  rows,
  skeletonRows,
  emptyState,
  renderRow,
}: DataTableSProps<TRow, SortColumn>): JSX.Element => (
  <div className="relative overflow-x-auto">
    {isFetching && <FetchProgress />}
    <table className="table-fixed border-collapse text-left w-max">
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
  </div>
);