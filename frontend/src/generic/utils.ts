// ──────────────────────────────────────────────
// Slave data state — three-state discriminated union
// ──────────────────────────────────────────────

/**
 * Three-state discriminated union for async data lifecycle.
 * Passed as the `asyncData` prop from master to slaves.
 * Masters derive this from TanStack Query results via `toAsyncData`;
 * slaves match on `tag` and render the appropriate view — guaranteed exhaustive.
 */
import { useState } from 'react';
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
  pageSize: number,
): readonly [
  { readonly page: number; readonly pageSize: number },
  {
    readonly goToPage: (n: number) => void;
    readonly nextPage: () => void;
    readonly prevPage: () => void;
  },
] => {
  const [page, setPage] = useState(initialPage);
  return [
    { page, pageSize },
    {
      goToPage: (n: number): void => {
        setPage(Math.max(1, n));
      },
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

export type PaginatedQueryParams<TRow, TSortColumn extends string> = {
  readonly queryKeyBase: string;
  readonly defaultSortColumn: TSortColumn;
  readonly defaultSortDirection: SortDirection;
  readonly pageSize: number;
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

  const query = useQuery({
    queryKey: [queryKeyBase, sortConfig.column, sortConfig.direction, pagination.page, pagination.pageSize],
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
