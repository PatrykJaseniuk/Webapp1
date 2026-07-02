// ── Shared generic types ──
// Generic FP helpers, UI primitives — no domain knowledge.

import type { Option } from 'fp-ts/Option';
import type { Either } from 'fp-ts/Either';

export type { Option, Either };

// ──────────────────────────────────────────────
// Navigation
// ──────────────────────────────────────────────

import type { ReactNode, ComponentType } from 'react';

/** Router-agnostic link component contract — used by slaves to avoid importing react-router-dom. */
export type LinkComponent = ComponentType<{
  readonly to: string | { readonly pathname: string };
  readonly children: ReactNode;
  readonly className?: string;
}>;

// ──────────────────────────────────────────────
// Result — explicit error handling, no throw
// ──────────────────────────────────────────────

export type Result<T, E> =
  | { readonly tag: 'ok'; readonly value: T }
  | { readonly tag: 'err'; readonly error: E };

export const ok = <T, E>(value: T): Result<T, E> =>
  ({ tag: 'ok', value });

export const err = <T, E>(error: E): Result<T, E> =>
  ({ tag: 'err', error });

// ──────────────────────────────────────────────
// Branded types
// ──────────────────────────────────────────────

/** Branded user ID — prevents mixing with plain strings. */
export type UserId = string & { readonly _brand: 'UserId' };

// ──────────────────────────────────────────────
// AppError — domain error variants
// ──────────────────────────────────────────────

/** Application-wide error variants. */
export type AppError =
  | { readonly tag: 'NetworkError'; readonly message: string }
  | { readonly tag: 'NotFound'; readonly resource: string }
  | { readonly tag: 'Unauthorized' }
  | { readonly tag: 'Forbidden' }
  | { readonly tag: 'ValidationError'; readonly message: string };

/** Generic async state for UI components. */
export type AsyncState<T> =
  | { readonly tag: 'idle' }
  | { readonly tag: 'loading' }
  | { readonly tag: 'success'; readonly data: T }
  | { readonly tag: 'error'; readonly error: AppError };

// ──────────────────────────────────────────────
// Slave component props
// ──────────────────────────────────────────────

/** Shared props contract for slaves that receive async-fetched data. */
export type SlaveAsyncProps<T> = {
  readonly data: T;
  readonly isLoading: boolean;
  readonly error: string | null;
};

// ──────────────────────────────────────────────
// Slave data state — three-state discriminated union
// ──────────────────────────────────────────────

/**
 * Three-state prop passed from master to data-displaying slaves.
 * The slave matches on `tag` and renders the appropriate view.
 * Replaces separate loading/error/data props — guaranteed exhaustive.
 */
export type SlaveDataState<T> =
  | { readonly tag: 'pending' }
  | { readonly tag: 'rejected'; readonly message: string; readonly onRetry: () => void }
  | { readonly tag: 'fulfilled'; readonly data: T };
