import { match } from 'ts-pattern';
import { ErrorMessage } from './ErrorMessageS';
import { DataTableS, type ColumnDef, type Pagination } from './DataTableS';
import type { AsyncData } from '@/generic';

type Sort<SortColumn extends string> = {
  readonly config: { readonly column: SortColumn; readonly direction: 'asc' | 'desc' };
  readonly doSort: (column: SortColumn) => void;
};

type AsyncStateTableSProps<TRow, SortColumn extends string> = {
  readonly asyncData: AsyncData<{ readonly rows: readonly TRow[]; readonly totalCount: number }>;
  readonly columns: readonly ColumnDef<SortColumn>[];
  readonly sort: Sort<SortColumn>;
  readonly pagination: {
    readonly page: number;
    readonly pageSize: number;
    readonly goToPage: (n: number) => void;
    readonly setPageSize: (size: number) => void;
    readonly prevPage: () => void;
    readonly nextPage: () => void;
  };
  readonly skeletonRows: JSX.Element;
  readonly emptyState: JSX.Element;
  readonly filteredEmptyState: JSX.Element;
  readonly isFilterActive: boolean;
  readonly renderRow: (row: TRow) => JSX.Element;
};

export const AsyncStateTableS = <TRow, SortColumn extends string>({
  asyncData,
  columns,
  sort,
  pagination,
  skeletonRows,
  emptyState,
  filteredEmptyState,
  isFilterActive,
  renderRow,
}: AsyncStateTableSProps<TRow, SortColumn>): JSX.Element => (
  <div role="status" aria-live="polite">
    {match(asyncData)
      .with({ tag: 'pending' }, () => (
        <DataTableS
          columns={columns}
          sort={undefined}
          isFetching={true}
          rows={[]}
          skeletonRows={skeletonRows}
          emptyState={emptyState}
          renderRow={() => <></>}
        />
      ))
      .with({ tag: 'rejected' }, ({ message, onRetry }) => (
        <ErrorMessage message={message} onRetry={onRetry} />
      ))
      .with({ tag: 'fulfilled' }, ({ data, isFetching }) => (
        <DataTableS
          maxHeight="calc(100vh - 10rem)"
          columns={columns}
          sort={sort}
          isFetching={isFetching ?? false}
          rows={data.rows}
          skeletonRows={skeletonRows}
          emptyState={isFilterActive ? filteredEmptyState : emptyState}
          pagination={toPagination(pagination, data.totalCount)}
          totalCount={data.totalCount}
          onPageSizeChange={pagination.setPageSize}
          renderRow={renderRow}
        />
      ))
      .exhaustive()}
  </div>
);

const toPagination = (
  pagination: AsyncStateTableSProps<unknown, string>['pagination'],
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