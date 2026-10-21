import { formatRawError } from './dbError';

/**
 * The four-state machine every detail master passes to its slave as
 * `submitState`. Replaces the 5 identical local `SubmitState` type
 * declarations.
 */
export type SubmitState =
  | { readonly tag: 'idle' }
  | { readonly tag: 'submitting' }
  | { readonly tag: 'success' }
  | { readonly tag: 'error'; readonly message: string };

/**
 * Discriminated-union inputs to `deriveSubmitState`.
 *
 * `formatInsertUpdateError` and `formatDeleteError` let each master choose
 * its own error-message policy without duplicating the state-machine logic.
 *
 * Default (Property / LeaseAgreement / FinancialEntry):
 *   insert / update → raw message; delete → Postgres-code-mapped message
 *
 * Tenant:
 *   insert / update → Postgres-code-mapped; delete → Postgres-code-mapped
 *
 * Treasury:
 *   all three      → Postgres-code-mapped
 */
export type SubmitStateDeps = {
  readonly isPending: boolean;
  readonly validationError: string | null;
  readonly insertError: Error | null;
  readonly updateError: Error | null;
  readonly deleteError: Error | null;
  readonly insertSuccess: boolean;
  readonly updateSuccess: boolean;
  /** Format for insert / update mutation errors. Default: raw message. */
  readonly formatInsertUpdateError?: (error: Error | null) => string;
  /** Format for delete mutation errors. Default: raw message. */
  readonly formatDeleteError?: (error: Error | null) => string;
};

/**
 * Derives the `SubmitState` from the current mutation + validation state.
 *
 * Priority (highest first):
 *   1. any mutation pending            → `submitting`
 *   2. field validation error present  → `error` (validation message)
 *   3. insert / update error           → `error` (formatted)
 *   4. delete error                    → `error` (formatted)
 *   5. insert / update succeeded       → `success`
 *   6. otherwise                       → `idle`
 */
export const deriveSubmitState = (deps: SubmitStateDeps): SubmitState => {
  const {
    isPending,
    validationError,
    insertError,
    updateError,
    deleteError,
    insertSuccess,
    updateSuccess,
    formatInsertUpdateError = formatRawError,
    formatDeleteError = formatRawError,
  } = deps;

  const insertUpdateError = insertError ?? updateError;

  return isPending
    ? { tag: 'submitting' as const }
    : validationError !== null
      ? { tag: 'error' as const, message: validationError }
      : insertUpdateError !== null
        ? { tag: 'error' as const, message: formatInsertUpdateError(insertUpdateError) }
        : deleteError !== null
          ? { tag: 'error' as const, message: formatDeleteError(deleteError) }
          : insertSuccess || updateSuccess
            ? { tag: 'success' as const }
            : { tag: 'idle' as const };
};
