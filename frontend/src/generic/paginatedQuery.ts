import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toAsyncData, type AsyncData } from './asyncData';
import { usePagination } from './pagination';
import { useSort, type SortConfig, type SortDirection } from './sort';

export type PaginatedQueryParams<TRow, TSortColumn extends string> = {
  readonly queryKeyBase: string;
  readonly defaultSortColumn: TSortColumn;
  readonly defaultSortDirection: SortDirection;
  readonly pageSize: number;
  readonly extraQueryKey?: readonly unknown[];
  readonly queryFn: (
    sort: SortConfig<TSortColumn>,
    from: number,
    to: number,
  ) => Promise<{ readonly rows: readonly TRow[]; readonly totalCount: number }>;
};

export type PaginatedQueryResult<TRow, TSortColumn extends string> = {
  readonly asyncData: AsyncData<{ readonly rows: readonly TRow[]; readonly totalCount: number }>;
  readonly sort: {
    readonly config: SortConfig<TSortColumn>;
    readonly doSort: (column: TSortColumn) => void;
  };
  readonly pagination: {
    readonly page: number;
    readonly pageSize: number;
    readonly prevPage: () => void;
    readonly nextPage: () => void;
  };
};

export const usePaginatedQuery = <TRow, TSortColumn extends string>(
  params: PaginatedQueryParams<TRow, TSortColumn>,
): PaginatedQueryResult<TRow, TSortColumn> => {
  const { queryKeyBase, defaultSortColumn, defaultSortDirection, pageSize, queryFn } = params;
  const [sortConfig, onSort] = useSort<TSortColumn>(defaultSortColumn, defaultSortDirection);
  const [pagination, { goToPage, ...pageControls }] = usePagination(1, pageSize);

  const doSort = (column: TSortColumn): void => {
    onSort(column);
    goToPage(1);
  };
  const sort = { config: sortConfig, doSort };

  const paginationProps = {
    page: pagination.page,
    pageSize: pagination.pageSize,
    prevPage: pageControls.prevPage,
    nextPage: pageControls.nextPage,
  };

  const extraKeyRef = useRef(params.extraQueryKey);
  useEffect(() => {
    const prev = extraKeyRef.current;
    const next = params.extraQueryKey;
    // eslint-disable-next-line functional/immutable-data -- useRef .current is the idiomatic React mutable reference pattern
    extraKeyRef.current = next;
    const prevStr = JSON.stringify(prev);
    const nextStr = JSON.stringify(next);
    const hasChanged = prevStr !== nextStr;
    hasChanged && goToPage(1);
  }, [params.extraQueryKey, goToPage]);

  const query = useQuery({
    queryKey: [
      queryKeyBase,
      sortConfig.column,
      sortConfig.direction,
      pagination.page,
      pagination.pageSize,
      ...(params.extraQueryKey ?? []),
    ],
    queryFn: async () => {
      const from = (pagination.page - 1) * pagination.pageSize;
      const to = from + pagination.pageSize - 1;
      return queryFn(sortConfig, from, to);
    },
    placeholderData: (prev) => prev,
  });

  const asyncData = toAsyncData(
    query,
    () => {
      void query.refetch();
    },
    query.isFetching,
  );

  return { asyncData, sort, pagination: paginationProps };
};

// ──────────────────────────────────────────────
// Generic "Many records" slave props
// ──────────────────────────────────────────────

export type ManyRecordsSlaveProps<TRow, TSortColumn extends string, TNavLinkTo> = {
  readonly asyncData: AsyncData<{ readonly rows: readonly TRow[]; readonly totalCount: number }>;
  readonly navLinkTo: TNavLinkTo;
  readonly sort: {
    readonly config: SortConfig<TSortColumn>;
    readonly doSort: (column: TSortColumn) => void;
  };
  readonly pagination: {
    readonly page: number;
    readonly pageSize: number;
    readonly prevPage: () => void;
    readonly nextPage: () => void;
  };
};