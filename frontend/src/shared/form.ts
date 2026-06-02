// ── Form utilities ──
// Generic discriminated union and immutable helpers for forms.
// No domain knowledge — works with any entity type.

// ──────────────────────────────────────────────
// FormState — models the lifecycle of a form
// ──────────────────────────────────────────────

export type FormState<T> =
  | { readonly tag: 'idle' }
  | { readonly tag: 'editing'; readonly data: Readonly<T> }
  | { readonly tag: 'submitting'; readonly data: Readonly<T> }
  | { readonly tag: 'success'; readonly data: Readonly<T> }
  | { readonly tag: 'error'; readonly data: Readonly<T>; readonly message: string };

// ──────────────────────────────────────────────
// Smart constructors
// ──────────────────────────────────────────────

export const formIdle = <T>(): FormState<T> => ({ tag: 'idle' });

export const formEditing = <T>(data: Readonly<T>): FormState<T> => ({ tag: 'editing', data });

export const formSubmitting = <T>(data: Readonly<T>): FormState<T> => ({ tag: 'submitting', data });

export const formSuccess = <T>(data: Readonly<T>): FormState<T> => ({ tag: 'success', data });

export const formError = <T>(data: Readonly<T>, message: string): FormState<T> => ({
  tag: 'error',
  data,
  message,
});

// ──────────────────────────────────────────────
// Immutable field update helper
// ──────────────────────────────────────────────

/** Returns a new form data object with a single field updated. Never mutates. */
export const setField = <T, K extends keyof T>(
  data: Readonly<T>,
  key: K,
  value: T[K],
): T => ({
  ...data,
  [key]: value,
});