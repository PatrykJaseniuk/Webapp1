import type { SortConfig } from '@/generic';
import { SortIcon } from './SortIconS';

export type ColumnDef<SortColumn extends string> = {
  readonly key: string;
  readonly label: string | null;
  readonly sortColumn: SortColumn | null;
  readonly align: 'left' | 'right';
  readonly className: string;
};

type SortHeaderProps<SortColumn extends string> = {
  readonly column: SortColumn;
  readonly label: string;
  readonly sort: {
    readonly config: SortConfig<SortColumn>;
    readonly doSort: (column: SortColumn) => void;
  };
  readonly align?: 'left' | 'right';
  readonly className?: string;
};

export const SortHeader = <SortColumn extends string>({
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

export const StaticHeaderCell = <SortColumn extends string>({ col }: { readonly col: ColumnDef<SortColumn> }): JSX.Element => (
  <th
    scope="col"
    className={`${col.className} h-12 py-0 font-medium text-gray-500 ${col.align === 'right' ? 'text-right' : 'text-left'}`}
  >
    {col.label === null ? <span className="sr-only">Akcje</span> : col.label}
  </th>
);