
// ──────────────────────────────────────────────
// Slave data state — three-state discriminated union
// ──────────────────────────────────────────────

/**
 * Three-state discriminated union for async data lifecycle.
 * Passed as the `asyncData` prop from master to slaves.
 * Masters derive this from `useAsync` output; slaves match on `tag`
 * and render the appropriate view — guaranteed exhaustive.
 */
import { match } from 'ts-pattern';

export type AsyncData<T> =
  | { readonly tag: 'pending' }
  | { readonly tag: 'rejected'; readonly message: string; readonly onRetry: () => void }
  | { readonly tag: 'fulfilled'; readonly data: T };

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
      data: result.data!,
    }))
    .exhaustive();

