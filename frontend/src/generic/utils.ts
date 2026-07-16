
// ──────────────────────────────────────────────
// Slave data state — three-state discriminated union
// ──────────────────────────────────────────────

/**
 * Three-state discriminated union for async data lifecycle.
 * Passed as the `asyncData` prop from master to slaves.
 * Masters derive this from `useAsync` output; slaves match on `tag`
 * and render the appropriate view — guaranteed exhaustive.
 */
export type AsyncData<T> =
  | { readonly tag: 'pending' }
  | { readonly tag: 'rejected'; readonly message: string; readonly onRetry: () => void }
  | { readonly tag: 'fulfilled'; readonly data: T };

