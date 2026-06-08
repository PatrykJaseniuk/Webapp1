// ── Project-specific domain types ──
// Defined once at project start. Would differ between projects.
// Does NOT import from volatile0/domain for these types — owns them directly.

// ──────────────────────────────────────────────
// RBAC — role types
// ──────────────────────────────────────────────

/** Application roles matching the `app_role` PG enum. */
export type AppRole = 'admin' | 'landlord' | 'tenant';

// ──────────────────────────────────────────────
// Auth DTOs — pure domain inputs
// ──────────────────────────────────────────────

export type LoginInput = {
  readonly email: string;
  readonly password: string;
};

export type SignupInput = {
  readonly email: string;
  readonly password: string;
  readonly firstName: string;
  readonly lastName: string;
};

// ──────────────────────────────────────────────
// Auth state
// ──────────────────────────────────────────────

/** Centralised auth state for the entire frontend. */
export type AuthState =
  | { readonly tag: 'loading' }
  | { readonly tag: 'unauthenticated' }
  | { readonly tag: 'authenticated'; readonly userId: string; readonly email: string; readonly role: AppRole };