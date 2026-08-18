import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toAsyncData, type AsyncData } from './asyncData';

type SortDirection = 'asc' | 'desc';

type SortConfig<C extends string> = {
  readonly column: C;
  readonly direction: SortDirection;
};

/**
 * Manages server-side pagination state for table components.
 * Returns a tuple of [state, controls].
 *
 * @param initialPage  First page (1-based).
 * @param pageSize     Number of rows per page.
 *
 * Controls:
 *   - goToPage(n) — jump to absolute page
 *   - nextPage()  — advance one page
 *   - prevPage()  — go back one page (no-op when page === 1)
 */
const usePagination = (
  initialPage: number,
  initialPageSize: number,
): readonly [
  { readonly page: number; readonly pageSize: number },
  {
    readonly goToPage: (n: number) => void;
    readonly setPageSize: (size: number) => void;
    readonly nextPage: () => void;
    readonly prevPage: () => void;
  },
] => {
  const [page, setPage] = useState(initialPage);
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
  return [
    { page, pageSize },
    { goToPage, setPageSize, nextPage, prevPage },
  ];
};

/**
 * Manages server-side sort state for table components.
 * Returns a tuple of [current config, toggle handler].
 *
 * @param defaultColumn  The column name to sort by on initial render.
 * @param defaultDirection  Initial direction ('asc' | 'desc').
 *
 * Toggle behaviour:
 *   - clicking the active column flips asc ↔ desc
 *   - clicking a new column sets it to asc
 */
const useSort = <C extends string>(
  defaultColumn: C,
  defaultDirection: SortDirection,
): readonly [SortConfig<C>, (column: C) => void] => {
  const [sortConfig, setSortConfig] = useState<SortConfig<C>>({
    column: defaultColumn,
    direction: defaultDirection,
  });

  const doSort = (column: C): void => {
    setSortConfig((prev) =>
      prev.column === column ?
        { column, direction: prev.direction === 'asc' ? 'desc' : 'asc' } :
        { column, direction: 'asc' },
    );
  };

  return [sortConfig, doSort];
};

type PaginatedQueryResult<TRow, TSortColumn extends string> = {
  readonly asyncData: AsyncData<{ readonly rows: readonly TRow[]; readonly totalCount: number }>;
  readonly sort: {
    readonly config: SortConfig<TSortColumn>;
    readonly doSort: (column: TSortColumn) => void;
  };
  readonly pagination: {
    readonly page: number;
    readonly pageSize: number;
    readonly goToPage: (n: number) => void;
    readonly setPageSize: (size: number) => void;
    readonly prevPage: () => void;
    readonly nextPage: () => void;
  };
};

export type ManyRecordsSlaveProps<TRow, TSortColumn extends string, TNavLinkTo, TFilterValues extends Record<string, string>> = {
  readonly asyncData: AsyncData<{ readonly rows: readonly TRow[]; readonly totalCount: number }>;
  readonly navLinkTo: TNavLinkTo;
  readonly sort: {
    readonly config: SortConfig<TSortColumn>;
    readonly doSort: (column: TSortColumn) => void;
  };
  readonly pagination: {
    readonly page: number;
    readonly pageSize: number;
    readonly goToPage: (n: number) => void;
    readonly setPageSize: (size: number) => void;
    readonly prevPage: () => void;
    readonly nextPage: () => void;
  };
  readonly filter: FilterControls<TFilterValues>;
};

type FilteredQueryParams<TRow, TSortColumn extends string, TFilterValues extends Record<string, string>, TExtraKeyParts extends readonly unknown[] = readonly []> = {
  readonly queryKeyBase: string;
  readonly defaultSortColumn: TSortColumn;
  readonly defaultSortDirection?: SortDirection;
  readonly pageSize?: number;
  readonly extraQueryKeyParts?: TExtraKeyParts;
  readonly initialFilter?: TFilterValues;
  readonly textFilterKey?: keyof TFilterValues & string;
  readonly debounceMs?: number;
  readonly queryFn: (
    sort: SortConfig<TSortColumn>,
    from: number,
    to: number,
    filter: TFilterValues,
  ) => Promise<{ readonly rows: readonly TRow[]; readonly totalCount: number }>;
};

type FilterSetter = (v: string) => void;

type FilterSetters<TFilterValues extends Record<string, string>> = {
  readonly [K in keyof TFilterValues & string as `set${Capitalize<K>}`]: FilterSetter;
};

type FilterControls<TFilterValues extends Record<string, string>> =
  TFilterValues
  & FilterSetters<TFilterValues>
  & Readonly<{
      readonly clearFilter: () => void;
      readonly isFilterActive: boolean;
      readonly activeFilterCount: number;
      readonly filterResetKey: number;
    }>;

export type FilteredQueryResult<TRow, TSortColumn extends string, TFilterValues extends Record<string, string>> =
  PaginatedQueryResult<TRow, TSortColumn> & {
    readonly filter: FilterControls<TFilterValues>;
  };

/**
 * All-in-one hook for "Many" masters: sort + pagination + filters + TanStack Query.
 *
 * `initialFilter` is mount-time configuration (like `defaultSortColumn`): its keys
 * define the filter fields and generated setters (`setXxx`), its values are the
 * "cleared" state that `clearFilter` restores and `isFilterActive` compares against.
 * It is captured once on mount — later changes to the passed object are ignored.
 * Omit it to disable filtering (the hook then behaves as plain pagination and
 * `filter` contains trivial no-op controls).
 *
 * Defaults: `defaultSortDirection: 'asc'`, `pageSize: 20`, `debounceMs: 300`.
 * `textFilterKey` marks the single debounced filter field; all other setters
 * apply to the query immediately. Every filter change resets the page to 1.
 */
export const useFilteredPaginatedQuery = <TRow, TSortColumn extends string, TFilterValues extends Record<string, string> = Record<string, string>, TExtraKeyParts extends readonly unknown[] = readonly []>(
  params: FilteredQueryParams<TRow, TSortColumn, TFilterValues, TExtraKeyParts>,
): FilteredQueryResult<TRow, TSortColumn, TFilterValues> => {
  const { queryKeyBase, defaultSortColumn, defaultSortDirection = 'asc', pageSize = 20, extraQueryKeyParts, initialFilter, textFilterKey, debounceMs = 300, queryFn } = params;

  const [initialValues] = useState<TFilterValues>(() => initialFilter ?? ({} as TFilterValues));
  const filterKeys = useMemo<readonly (keyof TFilterValues & string)[]>(
    () => Object.keys(initialValues) as readonly (keyof TFilterValues & string)[],
    [initialValues],
  );

  const [displayValues, setDisplayValues] = useState<TFilterValues>(initialValues);
  const [queryValues, setQueryValues] = useState<TFilterValues>(initialValues);
  const [filterResetKey, setFilterResetKey] = useState(0);

  const [sortConfig, onSort] = useSort<TSortColumn>(defaultSortColumn, defaultSortDirection);
  const [pagination, { goToPage, setPageSize, ...pageControls }] = usePagination(1, pageSize);

  const resetPage = useCallback((): void => {
    goToPage(1);
  }, [goToPage]);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelDebounce = useCallback((): void => {
    debounceTimerRef.current !== null && clearTimeout(debounceTimerRef.current);
  }, []);

  useEffect(() => cancelDebounce, [cancelDebounce]);

  const scheduleQueryUpdate = useCallback(
    (key: keyof TFilterValues & string, v: string): void => {
      cancelDebounce();
      // eslint-disable-next-line functional/immutable-data -- useRef for timer handle is the idiomatic React debounce pattern
      debounceTimerRef.current = setTimeout(() => {
        setQueryValues((prev) => ({ ...prev, [key]: v }));
      }, debounceMs);
    },
    [cancelDebounce, debounceMs],
  );

  const filterSetters = useMemo<FilterSetters<TFilterValues>>(
    () =>
      Object.freeze(
        Object.fromEntries(
          filterKeys.map((key) => [
            `set${key.charAt(0).toUpperCase()}${key.slice(1)}`,
            (v: string): void => {
              setDisplayValues((prev) => ({ ...prev, [key]: v }));
              resetPage();
              key === textFilterKey ?
                scheduleQueryUpdate(key, v) :
                setQueryValues((prev) => ({ ...prev, [key]: v }));
            },
          ]),
        ),
      ) as FilterSetters<TFilterValues>,
    [filterKeys, textFilterKey, resetPage, scheduleQueryUpdate],
  );

  const clearFilter = useCallback((): void => {
    cancelDebounce();
    setDisplayValues(initialValues);
    setQueryValues(initialValues);
    setFilterResetKey((k) => k + 1);
    resetPage();
  }, [cancelDebounce, initialValues, resetPage]);

  const isFilterActive = useMemo(
    () => filterKeys.some((key) => displayValues[key] !== initialValues[key]),
    [displayValues, initialValues, filterKeys],
  );

  const activeFilterCount = useMemo(
    () => filterKeys.filter((key) => displayValues[key] !== initialValues[key]).length,
    [displayValues, initialValues, filterKeys],
  );

  const filter = useMemo<FilterControls<TFilterValues>>(
    () => ({ ...displayValues, ...filterSetters, clearFilter, isFilterActive, activeFilterCount, filterResetKey }),
    [displayValues, filterSetters, clearFilter, isFilterActive, activeFilterCount, filterResetKey],
  );

  const doSort = (column: TSortColumn): void => {
    onSort(column);
    resetPage();
  };
  const sort = { config: sortConfig, doSort };

  const paginationProps = {
    page: pagination.page,
    pageSize: pagination.pageSize,
    goToPage,
    setPageSize,
    prevPage: pageControls.prevPage,
    nextPage: pageControls.nextPage,
  };

  const query = useQuery({
    queryKey: [queryKeyBase, sortConfig.column, sortConfig.direction, pagination.page, pagination.pageSize, ...(extraQueryKeyParts ?? []), ...Object.values(queryValues)] as const,
    queryFn: async () => {
      const from = (pagination.page - 1) * pagination.pageSize;
      const to = from + pagination.pageSize - 1;
      return queryFn(sortConfig, from, to, queryValues);
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

  return { asyncData, sort, pagination: paginationProps, filter };
};