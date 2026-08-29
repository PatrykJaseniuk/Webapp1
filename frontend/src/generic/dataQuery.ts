import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toAsyncData, type AsyncData } from './asyncData';

export type SortDirection = 'asc' | 'desc';

export type SortConfig<C extends string = string> = {
  readonly column: C;
  readonly direction: SortDirection;
};

export type SortControls<C extends string = string> = {
  readonly config: SortConfig<C>;
  readonly doSort: (column: C) => void;
};

/** Key presence in the filter config means "this filter is applied". */
export type FilterConfig<F extends string = string> = Readonly<Partial<Record<F, string>>>;

/** Sort + filter share the same { config, doX } shape. */
export type FilterControls<F extends string = string> = {
  readonly config: FilterConfig<F>;
  readonly doFilter: (next: FilterConfig<F>) => void;
};

export type PaginationControls = {
  readonly page: number;
  readonly pageSize: number;
  readonly goToPage: (n: number) => void;
  readonly setPageSize: (size: number) => void;
  readonly prevPage: () => void;
  readonly nextPage: () => void;
};

/**
 * Result of a paginated, filtered list whose order is FIXED by its master and
 * therefore exposes no sort controls. Financial statements use this: they are
 * always ordered value_date DESC, id DESC because a running balance is only
 * monotonic in that one order.
 */
export type PaginatedListResult<TRow, F extends string> = {
  readonly asyncData: AsyncData<{ readonly rows: readonly TRow[]; readonly totalCount: number }>;
  readonly filter: FilterControls<F>;
  readonly pagination: PaginationControls;
};

export type FilteredQueryResult<TRow, TSortColumn extends string, F extends string> =
  PaginatedListResult<TRow, F> & {
    readonly sort: SortControls<TSortColumn>;
  };

export type ManyRecordsSlaveProps<TRow, TSortColumn extends string, TNavLinkTo, F extends string> = {
  readonly asyncData: FilteredQueryResult<TRow, TSortColumn, F>['asyncData'];
  readonly navLinkTo: TNavLinkTo;
  readonly sort: SortControls<TSortColumn>;
  readonly filter: FilterControls<F>;
  readonly pagination: PaginationControls;
};

/** Slave props for a fixed-order list — deliberately carries no sort controls. */
export type ManyRecordsSlavePropsFixedOrder<TRow, TNavLinkTo, F extends string> = {
  readonly asyncData: PaginatedListResult<TRow, F>['asyncData'];
  readonly navLinkTo: TNavLinkTo;
  readonly filter: FilterControls<F>;
  readonly pagination: PaginationControls;
};

export type FilteredQueryParams<TRow, TSortColumn extends string, F extends string> = {
  readonly queryKey: readonly string[];
  readonly defaultSort: SortConfig<TSortColumn>;
  readonly pageSize?: number;
  readonly debounceMs?: number;
  readonly enabled?: boolean;
  readonly fetchPage: (args: {
    readonly sort: SortConfig<TSortColumn>;
    readonly from: number;
    readonly to: number;
    readonly filter: FilterConfig<F>;
  }) => Promise<{ readonly rows: readonly TRow[]; readonly totalCount: number }>;
};

/** Params for a fixed-order list: no sort in, no sort out. */
export type DateOrderedQueryParams<TRow, F extends string> = {
  readonly queryKey: readonly string[];
  readonly pageSize?: number;
  readonly debounceMs?: number;
  readonly enabled?: boolean;
  readonly fetchPage: (args: {
    readonly from: number;
    readonly to: number;
    readonly filter: FilterConfig<F>;
  }) => Promise<{ readonly rows: readonly TRow[]; readonly totalCount: number }>;
};

const usePagination = (initialPageSize: number): PaginationControls => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const goToPage = useCallback((n: number): void => {
    setPage(Math.max(1, n));
  }, []);
  const setPageSize = useCallback((size: number): void => {
    setPageSizeState(size);
    setPage(1);
  }, []);
  const nextPage = useCallback((): void => {
    setPage((p) => p + 1);
  }, []);
  const prevPage = useCallback((): void => {
    setPage((p) => Math.max(1, p - 1));
  }, []);
  return { page, pageSize, goToPage, setPageSize, nextPage, prevPage };
};

const useSort = <C extends string>(defaultSort: SortConfig<C>): SortControls<C> => {
  const [config, setConfig] = useState<SortConfig<C>>(defaultSort);
  const doSort = useCallback((column: C): void => {
    setConfig((prev) =>
      prev.column === column ?
        { column, direction: prev.direction === 'asc' ? 'desc' : 'asc' } :
        { column, direction: 'asc' },
    );
  }, []);
  return { config, doSort };
};

const useFilter = <F extends string>(): readonly [FilterConfig<F>, (next: FilterConfig<F>) => void] => {
  const [config, setConfig] = useState<FilterConfig<F>>({} as FilterConfig<F>);
  const doFilter = useCallback((next: FilterConfig<F>): void => {
    setConfig(next);
  }, []);
  return [config, doFilter];
};

/**
 * Pagination + debounced filtering, shared by the sorted and fixed-order hooks.
 *
 * `filterConfig` updates immediately (so inputs stay responsive) while
 * `committedFilter` — the value the query actually keys on — lags by
 * `debounceMs`. Any filter change also resets to page 1, since page N of the
 * old result set is meaningless against the new one.
 */
const usePaginatedFilter = <F extends string>(
  initialPageSize: number,
  debounceMs: number,
): {
  readonly pagination: PaginationControls;
  readonly filterConfig: FilterConfig<F>;
  readonly committedFilter: FilterConfig<F>;
  readonly doFilter: (next: FilterConfig<F>) => void;
  readonly resetPage: () => void;
} => {
  const pagination = usePagination(initialPageSize);
  const [filterConfig, setFilterConfig] = useFilter<F>();
  const [committedFilter, setCommittedFilter] = useState<FilterConfig<F>>({} as FilterConfig<F>);

  const { goToPage } = pagination;

  const resetPage = useCallback((): void => {
    goToPage(1);
  }, [goToPage]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelDebounce = useCallback((): void => {
    debounceRef.current !== null && clearTimeout(debounceRef.current);
  }, []);

  useEffect(() => cancelDebounce, [cancelDebounce]);

  const doFilter = useCallback(
    (next: FilterConfig<F>): void => {
      setFilterConfig(next);
      resetPage();
      cancelDebounce();
      // eslint-disable-next-line functional/immutable-data -- useRef for the debounce handle is idiomatic React
      debounceRef.current = setTimeout(() => {
        setCommittedFilter(next);
      }, debounceMs);
    },
    [setFilterConfig, resetPage, cancelDebounce, debounceMs],
  );

  return { pagination, filterConfig, committedFilter, doFilter, resetPage };
};

/**
 * Composes sort + pagination + debounced filtering + TanStack Query for "many" lists.
 * The master defines its filter system through the `F` key union.
 *
 * For a list whose order must never change — every financial statement — use
 * `useDateOrderedPaginatedQuery` instead.
 */
export const useFilteredPaginatedQuery = <TRow, TSortColumn extends string, F extends string>(
  params: FilteredQueryParams<TRow, TSortColumn, F>,
): FilteredQueryResult<TRow, TSortColumn, F> => {
  const { queryKey, defaultSort, pageSize = 20, debounceMs = 300, enabled = true, fetchPage } = params;

  const sort = useSort<TSortColumn>(defaultSort);
  const { pagination, filterConfig, committedFilter, doFilter, resetPage } =
    usePaginatedFilter<F>(pageSize, debounceMs);

  const { doSort: applySort, config: sortConfig } = sort;

  const doSort = useCallback(
    (column: TSortColumn): void => {
      applySort(column);
      resetPage();
    },
    [applySort, resetPage],
  );

  const query = useQuery({
    queryKey: [
      ...queryKey,
      sortConfig.column,
      sortConfig.direction,
      pagination.page,
      pagination.pageSize,
      ...Object.values(committedFilter),
    ] as const,
    queryFn: async () => {
      const from = (pagination.page - 1) * pagination.pageSize;
      const to = from + pagination.pageSize - 1;
      return fetchPage({ sort: sortConfig, from, to, filter: committedFilter });
    },
    enabled,
    placeholderData: (prev) => prev,
  });

  const asyncData = toAsyncData(
    query,
    () => {
      void query.refetch();
    },
    query.isFetching,
  );

  return {
    asyncData,
    sort: { config: sortConfig, doSort },
    filter: { config: filterConfig, doFilter },
    pagination,
  };
};

/**
 * Pagination + debounced filtering for a list with a FIXED order.
 *
 * There is no sort parameter and no sort in the result: the master pins the
 * ordering inside `fetchPage`. Financial statements require this — their
 * running balance is only monotonic in (value_date, id) order, so exposing a
 * sort control would render the balance column meaningless.
 */
export const useDateOrderedPaginatedQuery = <TRow, F extends string>(
  params: DateOrderedQueryParams<TRow, F>,
): PaginatedListResult<TRow, F> => {
  const { queryKey, pageSize = 20, debounceMs = 300, enabled = true, fetchPage } = params;

  const { pagination, filterConfig, committedFilter, doFilter } =
    usePaginatedFilter<F>(pageSize, debounceMs);

  const query = useQuery({
    queryKey: [
      ...queryKey,
      pagination.page,
      pagination.pageSize,
      ...Object.values(committedFilter),
    ] as const,
    queryFn: async () => {
      const from = (pagination.page - 1) * pagination.pageSize;
      const to = from + pagination.pageSize - 1;
      return fetchPage({ from, to, filter: committedFilter });
    },
    enabled,
    placeholderData: (prev) => prev,
  });

  const asyncData = toAsyncData(
    query,
    () => {
      void query.refetch();
    },
    query.isFetching,
  );

  return {
    asyncData,
    filter: { config: filterConfig, doFilter },
    pagination,
  };
};