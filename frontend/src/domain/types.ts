// ── Shared domain types ──
// Pure types only — no I/O, no React, no framework code.

import type { Option } from 'fp-ts/Option';
import type { Either } from 'fp-ts/Either';

export type { Option, Either };

/** Branded user ID — prevents mixing with plain strings. */
export type UserId = string & { readonly _brand: 'UserId' };

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