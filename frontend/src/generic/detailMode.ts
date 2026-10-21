/**
 * The two modes a detail (single-record) master can be in:
 *  - `create` – no existing row; the form starts empty
 *  - `edit`   – an existing row is loaded; the form is pre-populated
 *
 * Every detail master re-exports this as its own `*DetailMode` alias so the
 * public API (`PropertyDetailMode`, `TenantDetailMode`, …) stays stable.
 */
export type DetailMode =
  | { readonly tag: 'create' }
  | { readonly tag: 'edit'; readonly id: string };
