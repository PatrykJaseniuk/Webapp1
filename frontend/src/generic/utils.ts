// ──────────────────────────────────────────────
// Slave data state — three-state discriminated union
// ──────────────────────────────────────────────

/**
 * Three-state discriminated union for async data lifecycle.
 * Passed as the `asyncData` prop from master to slaves.
 * Masters derive this from TanStack Query results via `toAsyncData`;
 * slaves match on `tag` and render the appropriate view — guaranteed exhaustive.
 */
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { CSSProperties, ReactNode } from 'react';
import { match } from 'ts-pattern';

export type NavLink = (args: {
  readonly style: CSSProperties;
  readonly content: string;
}) => ReactNode;

export type NavLinkWithId = (args: {
  readonly id: string;
  readonly style: CSSProperties;
  readonly content: string;
  readonly ariaLabel?: string;
}) => ReactNode;

export type SortDirection = 'asc' | 'desc';

export type SortConfig<C extends string> = {
  readonly column: C;
  readonly direction: SortDirection;
};

export type AsyncData<T> =
  | { readonly tag: 'pending' }
  | { readonly tag: 'rejected'; readonly message: string; readonly onRetry: () => void }
  | { readonly tag: 'fulfilled'; readonly data: T; readonly isFetching?: boolean };

// ──────────────────────────────────────────────
// Pagination hook
// ──────────────────────────────────────────────

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
export const usePagination = (
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
  const goToPage = (n: number): void => {
    setPage(Math.max(1, n));
  };
  const setPageSize = (size: number): void => {
    setPageSizeState(size);
    setPage(1);
  };
  return [
    { page, pageSize },
    {
      goToPage,
      setPageSize,
      nextPage: (): void => {
        setPage((p) => p + 1);
      },
      prevPage: (): void => {
        setPage((p) => Math.max(1, p - 1));
      },
    },
  ];
};

// ──────────────────────────────────────────────
// Sort hook
// ──────────────────────────────────────────────

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
export const useSort = <C extends string>(
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

// ──────────────────────────────────────────────
// TanStack Query → AsyncData converter
// ──────────────────────────────────────────────

/**
 * Converts a TanStack Query result (from `useQuery` or `useMutation`)
 * into the three-state `AsyncData<T>` discriminated union used by slaves.
 *
 * - `status === 'pending'` → `{ tag: 'pending' }`
 * - `status === 'error'`   → `{ tag: 'rejected', message, onRetry }`
 * - `status === 'success'` → `{ tag: 'fulfilled', data }`
 */
export const toAsyncData = <T>(
  result: {
    readonly status: 'pending' | 'error' | 'success';
    readonly error: Error | null;
    readonly data: T | undefined;
  },
  onRetry: () => void,
  isFetching?: boolean,
): AsyncData<T> =>
  match(result.status)
    .with('pending', () => ({ tag: 'pending' as const }))
    .with('error', () => ({
      tag: 'rejected' as const,
      message: result.error?.message ?? 'Unknown error',
      onRetry,
    }))
    .with('success', () => ({
      tag: 'fulfilled' as const,
      data: result.data as T,
      ...(isFetching === true && { isFetching }),
    }))
    .exhaustive();

// ──────────────────────────────────────────────
// Paginated query hook — DRY for "Many" masters
// ──────────────────────────────────────────────

export type PaginatedQueryParams<TRow, TSortColumn extends string, TExtraKeyParts extends readonly unknown[] = readonly []> = {
  readonly queryKeyBase: string;
  readonly defaultSortColumn: TSortColumn;
  readonly defaultSortDirection: SortDirection;
  readonly pageSize: number;
  readonly extraQueryKeyParts?: TExtraKeyParts;
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
    readonly goToPage: (n: number) => void;
    readonly setPageSize: (size: number) => void;
    readonly prevPage: () => void;
    readonly nextPage: () => void;
  };
};

export const usePaginatedQuery = <TRow, TSortColumn extends string, TExtraKeyParts extends readonly unknown[] = readonly []>(
  params: PaginatedQueryParams<TRow, TSortColumn, TExtraKeyParts>,
): PaginatedQueryResult<TRow, TSortColumn> => {
  const { queryKeyBase, defaultSortColumn, defaultSortDirection, pageSize, extraQueryKeyParts, queryFn } = params;
  const [sortConfig, onSort] = useSort<TSortColumn>(defaultSortColumn, defaultSortDirection);
  const [pagination, { goToPage, setPageSize, ...pageControls }] = usePagination(1, pageSize);

  const doSort = (column: TSortColumn): void => {
    onSort(column);
    goToPage(1);
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
    queryKey: [queryKeyBase, sortConfig.column, sortConfig.direction, pagination.page, pagination.pageSize, ...(extraQueryKeyParts ?? [])] as const,
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

// ──────────────────────────────────────────────
// Filtered paginated query — absorbs filter state + page-reset
// ──────────────────────────────────────────────

export type FilteredQueryParams<TRow, TSortColumn extends string, TFilterValues extends Record<string, string>, TExtraKeyParts extends readonly unknown[] = readonly []> = {
  readonly queryKeyBase: string;
  readonly defaultSortColumn: TSortColumn;
  readonly defaultSortDirection: SortDirection;
  readonly pageSize: number;
  readonly extraQueryKeyParts?: TExtraKeyParts;
  readonly filterKeys: readonly (keyof TFilterValues & string)[];
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

export type FilterSetters<TFilterValues extends Record<string, string>> = {
  readonly [K in keyof TFilterValues & string as `set${Capitalize<K>}`]: FilterSetter;
};

export type FilterControls<TFilterValues extends Record<string, string>> =
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

export const useFilteredPaginatedQuery = <TRow, TSortColumn extends string, TFilterValues extends Record<string, string>, TExtraKeyParts extends readonly unknown[] = readonly []>(
  params: FilteredQueryParams<TRow, TSortColumn, TFilterValues, TExtraKeyParts>,
): FilteredQueryResult<TRow, TSortColumn, TFilterValues> => {
  const { queryKeyBase, defaultSortColumn, defaultSortDirection, pageSize, extraQueryKeyParts, filterKeys, queryFn, textFilterKey, debounceMs = 300 } = params;

  const emptyFilter = useMemo<TFilterValues>(
    () => Object.fromEntries(filterKeys.map((key) => [key, ''])) as TFilterValues,
    [filterKeys],
  );

  const [displayValues, setDisplayValues] = useState<TFilterValues>(emptyFilter);
  const [queryValues, setQueryValues] = useState<TFilterValues>(emptyFilter);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      debounceTimerRef.current !== null &&
        clearTimeout(debounceTimerRef.current);
    },
    [],
  );

  const filterSetters = useMemo<FilterSetters<TFilterValues>>(
    () =>
      Object.freeze(
        Object.fromEntries(
          filterKeys.map((key) => [
            `set${key.charAt(0).toUpperCase()}${key.slice(1)}`,
            (v: string): void => {
              setDisplayValues((prev) => ({ ...prev, [key]: v }));
              const isTextField = key === textFilterKey;
              isTextField ?
                (() => {
                  debounceTimerRef.current !== null &&
                    clearTimeout(debounceTimerRef.current);
                  // eslint-disable-next-line functional/immutable-data -- useRef for timer handle is the idiomatic React debounce pattern
                  debounceTimerRef.current = setTimeout(() => {
                    setQueryValues((prev) => ({ ...prev, [key]: v }));
                  }, debounceMs);
                })() :
                setQueryValues((prev) => ({ ...prev, [key]: v }));
            },
          ]),
        ),
      ) as FilterSetters<TFilterValues>,
    [filterKeys, textFilterKey, debounceMs],
  );

  const [filterResetKey, setFilterResetKey] = useState(0);

  const clearFilter = useCallback((): void => {
    setDisplayValues(emptyFilter);
    setQueryValues(emptyFilter);
    setFilterResetKey((k) => k + 1);
  }, [emptyFilter]);

  const isFilterActive = useMemo(
    () => filterKeys.some((key) => displayValues[key] !== ''),
    [displayValues, filterKeys],
  );

  const activeFilterCount = useMemo(
    () => filterKeys.filter((key) => (displayValues[key] ?? '').length > 0).length,
    [displayValues, filterKeys],
  );

  const filter = useMemo<FilterControls<TFilterValues>>(
    () => ({ ...displayValues, ...filterSetters, clearFilter, isFilterActive, activeFilterCount, filterResetKey }),
    [displayValues, filterSetters, clearFilter, isFilterActive, activeFilterCount, filterResetKey],
  );

  const queryValuesRef = useRef(queryValues);
  // eslint-disable-next-line functional/immutable-data
  queryValuesRef.current = queryValues;

  const queryDeps = Object.values(queryValues);

  const [sortConfig, onSort] = useSort<TSortColumn>(defaultSortColumn, defaultSortDirection);
  const [pagination, { goToPage, setPageSize, ...pageControls }] = usePagination(1, pageSize);

  const doSort = (column: TSortColumn): void => {
    onSort(column);
    goToPage(1);
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
    queryKey: [queryKeyBase, sortConfig.column, sortConfig.direction, pagination.page, pagination.pageSize, ...(extraQueryKeyParts ?? []), ...queryDeps] as const,
    queryFn: async () => {
      const from = (pagination.page - 1) * pagination.pageSize;
      const to = from + pagination.pageSize - 1;
      return queryFn(sortConfig, from, to, queryValuesRef.current);
    },
    placeholderData: (prev) => prev,
  });

  useEffect(() => {
    goToPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, queryDeps);

  const asyncData = toAsyncData(
    query,
    () => {
      void query.refetch();
    },
    query.isFetching,
  );

  return { asyncData, sort, pagination: paginationProps, filter };
};
