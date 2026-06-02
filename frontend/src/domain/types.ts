// ── Shared domain types ──
// Pure types only — no I/O, no React, no framework code.

import type { Option } from 'fp-ts/Option';
import type { Either } from 'fp-ts/Either';

export type { Option, Either };

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
  | { readonly tag: 'ValidationError'; readonly message: string };

/** Generic async state for UI components. */
export type AsyncState<T> =
  | { readonly tag: 'idle' }
  | { readonly tag: 'loading' }
  | { readonly tag: 'success'; readonly data: T }
  | { readonly tag: 'error'; readonly error: AppError };