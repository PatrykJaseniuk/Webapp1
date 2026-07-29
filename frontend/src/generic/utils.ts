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
}) => ReactNode;

export type SortDirection = 'asc' | 'desc';

export type SortConfig<C extends string> = {
  readonly column: C;
  readonly direction: SortDirection;
};

export type AsyncData<T> =
  | { readonly tag: 'pending' }
  | { readonly tag: 'rejected'; readonly message: string; readonly onRetry: () => void }
  | { readonly tag: 'fulfilled'; readonly data: T };

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
    }))
    .exhaustive();