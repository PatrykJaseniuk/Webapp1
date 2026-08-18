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

/**
 * A filter value is either a plain text / enum value or a numeric range.
 * Key presence in the filter config means "this filter is applied".
 */
export type FilterValue = string | { readonly from: number; readonly to: number };

export type FilterConfig<F extends string = string> = Readonly<Partial<Record<F, FilterValue>>>;

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

export type FilteredQueryResult<TRow, TSortColumn extends string, F extends string> = {
  readonly asyncData: AsyncData<{ readonly rows: readonly TRow[]; readonly totalCount: number }>;
  readonly sort: SortControls<TSortColumn>;
  readonly filter: FilterControls<F>;
  readonly pagination: PaginationControls;
};

export type ManyRecordsSlaveProps<TRow, TSortColumn extends string, TNavLinkTo, F extends string> = {
  readonly asyncData: FilteredQueryResult<TRow, TSortColumn, F>['asyncData'];
  readonly navLinkTo: TNavLinkTo;
  readonly sort: SortControls<TSortColumn>;
  readonly filter: FilterControls<F>;
  readonly pagination: PaginationControls;
};

export type FilteredQueryParams<TRow, TSortColumn extends string, F extends string> = {
  readonly queryKey: readonly string[];
  readonly defaultSort: SortConfig<TSortColumn>;
  readonly pageSize?: number;
  readonly debounceMs?: number;
  readonly fetchPage: (args: {
    readonly sort: SortConfig<TSortColumn>;
    readonly from: number;
    readonly to: number;
    readonly filter: FilterConfig<F>;
  }) => Promise<{ readonly rows: readonly TRow[]; readonly totalCount: number }>;
};

/** Extracts a plain-text filter value, yielding '' for missing/range values. */
export const filterTextValue = (value: FilterValue | undefined): string =>
  typeof value === 'string' ? value : '';

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
 * Composes sort + pagination + debounced filtering + TanStack Query for "many" lists.
 * The master defines its filter system through the `F` key union.
 */
export const useFilteredPaginatedQuery = <TRow, TSortColumn extends string, F extends string>(
  params: FilteredQueryParams<TRow, TSortColumn, F>,
): FilteredQueryResult<TRow, TSortColumn, F> => {
  const { queryKey, defaultSort, pageSize = 20, debounceMs = 300, fetchPage } = params;

  const sort = useSort<TSortColumn>(defaultSort);
  const pagination = usePagination(pageSize);
  const [filterConfig, setFilterConfig] = useFilter<F>();
  const [committedFilter, setCommittedFilter] = useState<FilterConfig<F>>({} as FilterConfig<F>);

  const { goToPage } = pagination;
  const { doSort: applySort, config: sortConfig } = sort;

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