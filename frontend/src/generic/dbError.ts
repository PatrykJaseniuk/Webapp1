/**
 * Shared error-formatting helpers for CRUD masters.
 *
 * Replaces the per-master local `formatDeleteError` / `formatMutationError`
 * helpers, which differed only in the Postgres-code → message table and the
 * fallback string.
 */

/**
 * Extracts the Postgres error code (e.g. `'23503'`, `'23505'`) from a rejected
 * Supabase error, if present. Returns `undefined` when the error carries no
 * `code` field or is `null`.
 */
export const getPgErrorCode = (error: Error | null): string | undefined =>
  (error as { readonly code?: string } | null)?.code;

/**
 * Renders a Supabase / network error using its raw `message` property.
 * Used when no Postgres-specific message is needed (insert / update errors for
 * Property, LeaseAgreement, and FinancialEntry).
 */
export const formatRawError = (error: Error | null): string =>
  error?.message ?? 'Unknown error';

/**
 * Maps a Postgres error code to a friendly Polish message. Falls back to the
 * raw error message (or the generic fallback) when no code matches.
 *
 * @param error        the rejected error (may be `null`)
 * @param codeMessages Postgres-code → Polish message, e.g. `{ '23503': '...' }`
 * @param fallback     message when neither the code matches nor a raw message exists
 */
export const formatDbError = (
  error: Error | null,
  codeMessages: Readonly<Record<string, string>>,
  fallback: string,
): string => {
  const code = getPgErrorCode(error);
  const mapped = code !== undefined ? (codeMessages[code] ?? null) : null;
  return mapped !== null ? mapped : error?.message ?? fallback;
};
