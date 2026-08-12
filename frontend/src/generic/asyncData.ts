// ──────────────────────────────────────────────
// Slave data state — three-state discriminated union
// ──────────────────────────────────────────────

import { match } from 'ts-pattern';

export type AsyncData<T> =
  | { readonly tag: 'pending' }
  | { readonly tag: 'rejected'; readonly message: string; readonly onRetry: () => void }
  | { readonly tag: 'fulfilled'; readonly data: T; readonly isFetching?: boolean };

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