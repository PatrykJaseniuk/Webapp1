# Frontend Architecture — Master/Slave Component Rules
# ======================================================

# Apply to every masterComponent and slaveComponent you generate or modify.
# Layers on top of FUNCTIONAL_TS.md and FUNCTIONAL_TSX.md.

# ───────────────────────────────────────────────────────────────
# FILE STRUCTURE
# ───────────────────────────────────────────────────────────────

# src/
# ├── main/               App bootstrap + routing + URL definitions
# ├── backendConnector/   Supabase client + generated DB types
# ├── generic/            Zero-domain-knowledge shared types
# ├── hooks/              Auth context + useUrls + role hooks
# ├── masterComponents/   CONTAINERS — logic, data, side effects
# ├── slaveComponents/    PURE RENDER — UI only, no logic
# └── pages/              WIRING — connect master + slave

# ───────────────────────────────────────────────────────────────
# 1. MASTER (masterComponents/) — CONTAINER
# ───────────────────────────────────────────────────────────────

- Own all side effects: `useAsync`, `useAsyncFn`, `useNavigate` (for logout redirects etc.).
- Own URL generation: call `useUrls()` from `@/hooks/useUrls` to build all URLs.
- Define and export exactly ONE type — the slave's props interface
  (e.g. `LeaseAgreementSProps`). All data-internal types (data shapes,
  helpers, nested row types) are private to the master.
- Do not define rendering functionality
- Receive slave components as argument, do not import from slaves
- Do not read url params
- Every master component's **file name** ends with letter 'M' : 'AppLayoutM.tsx', 'LeaseAgreementM.tsx', etc.
- Every master component's **export name** ends with letter 'M' : 'LeaseAgreementDetailM', 'PropertiesListM', etc.
- When fetching multiple related queries in parallel (e.g. lease + transactions + attachments),
  return raw Supabase results from `useAsync`, derive the unioned error in-band via `??` chain,
  and construct the data object with `??` fallbacks. Never wrap the returned data type in an
  outer `| null` — only nested fields may be `| null` (e.g. `leaseAgreement: T | null` for "not found").
    const { loading, error: fetchError, value } = useAsync(async () => {
      const [a, b, c] = await Promise.all([...]);
      return { a, b, c };
    }, [deps]);
    const error = fetchError ?? value?.a.error ?? value?.b.error;
    const data: Data = { fieldA: value?.a.data ?? null, fieldB: value?.b.data ?? [] };

# ───────────────────────────────────────────────────────────────
# 2. SLAVE (slaveComponents/) — PURE RENDER
# ───────────────────────────────────────────────────────────────

- Define rendering functionality
- Pure functions. Zero side effects. Zero DB knowledge. Zero application knowledge.
  Zero local React state (`useState`, `useReducer`, `useRef` for data storage).
  Internal state is only allowed through the `asyncData` prop (see §2a).
- Import exactly ONE type from its master: the slave props interface
  (e.g. `LeaseAgreementSProps`). Never import data-internal types from the master.
- Derive the fulfilled-data type inline from the slave props:
    type Data = Extract<SlaveProps['asyncData'], { tag: 'fulfilled' }>['data'];
- Derive strict enum-key types from the data shape and use them for all
  lookup objects and helper function signatures. Never use loose
  `Record<string, string>` or `(x: string)` for enum-based values.
  Example:
    type LeaseStatus = Data['lease']['lease_status'];
    type TxnType = Data['transactions'][number]['type'];
    const LABELS: Readonly<Record<LeaseStatus, string>> = { ... };
    const pillClass = (status: LeaseStatus): string => ...;
- Import types ONLY from: `react` + their master.
  EXCEPTION: may import from `@tanstack/react-router` (see §2c).
- Types are not defined in slave component's file (the single inline
  derivation above is the only exception).
- May import pure-render sibling slave components (e.g. `LoadingSpinner`, `ErrorMessage`)
  but NEVER masters, pages, or `@/backendConnector`.
- NEVER: `@/backendConnector`, `Database`, `useAsync`, `useAsyncFn`, `useUrls`.
- Every slave component's name ends with letter 'S' : 'AppLayoutS.tsx', 'LeaseAgreementS.tsx', etc.

# ───────────────────────────────────────────────────────────────
# 2a. SLAVE THREE-STATE PATTERN
# ───────────────────────────────────────────────────────────────

- Every slave that receives async data MUST handle three states: pending, rejected, fulfilled.
- Accept a single `asyncData: AsyncData<T>` prop (from their master's SProps) instead of separate
  `isLoading`, `error`, `data` props.
- Use `match(state).with({ tag: 'pending' }, ...).with({ tag: 'rejected' }, ...).with({ tag: 'fulfilled' }, ...).exhaustive()`
  to guarantee every state is rendered. This is the ONLY kind of "state" slaves handle —
  it models the data-fetch lifecycle, not application state.
- The master converts `useAsync` output into `AsyncData<T>` and passes it down.
- All three state renderings must share the same wrapper container with a stable minimum
  height (e.g. `min-h-[300px]` for tables, `min-h-[400px]` for forms) to prevent
  layout shifts when transitioning between states.
  `LoadingSpinner` and `ErrorMessage` must fill their parent container
  (`flex items-center justify-center`) without forcing their own height.
- For list ("many") components: render an empty-state message inside the `fulfilled`
  branch when the array is empty (e.g. "No leases found."). Do not create a separate
  discriminated-union tag for empty data.

# ───────────────────────────────────────────────────────────────
# 2b. FORM PATTERN
# ───────────────────────────────────────────────────────────────

- Form slaves render uncontrolled inputs (`defaultValue`, never `value` + `onChange`).
- The slave defines a pure `extractFormData` function that reads `FormData` from
  the `<form>` element and returns a typed input object.
- The master holds form lifecycle state (`useState` for submission status, validation
  errors, etc.) and passes down an `onSubmit` callback.
- The slave's `<form>` calls `e.preventDefault()`, extracts data via `FormData`, and
  invokes the master's `onSubmit` callback with the extracted data.
- Example signature:
    export type LeaseAgreementFormSlaveProps = {
      readonly asyncData: AsyncData<LeaseAgreementDetailData>;
      readonly initialData: LeaseAgreementDetailData;   // for defaultValue population
      readonly onSubmit: (data: LeaseAgreementFormInput) => void;
      readonly getCancelUrl: () => string;
    };

# ───────────────────────────────────────────────────────────────
# 2c. SLAVE NAVIGATION
# ───────────────────────────────────────────────────────────────

- Slaves are ROUTING-SYSTEM AGNOSTIC. They NEVER import `Link`, `useNavigate`,
  or anything from `@tanstack/react-router`.
- All navigation is provided by the master via props: {nav}
    
# ───────────────────────────────────────────────────────────────
# 3. PAGE (pages/) — WIRING
# ───────────────────────────────────────────────────────────────

- Router endpoint
- Read params from url (`useParams`) and send them to master as regular props
- Import BOTH the master and the slave, then wire them together:
  the page instantiates the master, passing the slave as a prop.
- Return a single JSX tree. Zero rendering logic. Zero business logic. Zero side effects.
- Zero URL building — URLs are generated by masters via `useUrls()`.
- Every page component's name ends with letter 'P' : 'LoginP.tsx', 'LeaseAgreementP.tsx', etc.

# ───────────────────────────────────────────────────────────────
# 4. CRUD
# ───────────────────────────────────────────────────────────────

For every database table, the frontend mirrors it with these components.
The component name is derived from the table name by taking the singular
English noun and applying PascalCase.

  Mapping examples:
    Table                  | Singular    | Single component  | Many component
    ───────────────────────┼─────────────┼───────────────────┼────────────────
    lease_agreements       | LeaseAgreement | LeaseAgreementM / LeaseAgreementS | LeaseAgreementsM / LeaseAgreementsS
    properties             | Property    | PropertyM / ...   | PropertiesM / ...
    tenants                | Tenant      | TenantM / ...     | TenantsM / ...
    transactions           | Transaction | TransactionM / ...| TransactionsM / ...
    user_roles             | UserRole    | UserRoleM / ...   | UserRolesM / ...

Components per table:
- `<TableName>M`  — Master for a single record. Implements create, read, update functionality.
- `<TableName>S`  — Slave for a single record. Defines the GUI for its master.
- `<TableName>P`  — Page for a single record.
- `<TableNames>M` — Master for many records (note: 's' before 'M' = pluralized
                     table name, e.g. "LeaseAgreements" + "M"). Implements read of many records.
- `<TableNames>S` — Slave for many records. Defines the GUI for its master.
- `<TableNames>P` — Page for many records.

# ───────────────────────────────────────────────────────────────
# ANTI-PATTERNS
# ───────────────────────────────────────────────────────────────

# ❌ Slave imports `@/generic`
# ❌ Slave imports `@/backendConnector` or `Database`
# ❌ Slave uses `useAsync`, `useAsyncFn`, `useUrls`
# ❌ Slave imports more than one type from its master
# ❌ Slave imports data-internal types (e.g. `LeaseAgreementData`) from its master
# ❌ Slave uses `Record<string, string>` or `(x: string)` for enum-based
#     label lookups / helper functions — derive tight key types from the
#     data shape inferred from `<Name>SProps` instead
# ❌ Slave imports domain-specific components from other slaves that should
#     come through props (e.g. a table-row component imported directly instead
#     of being passed as a render-prop or children)
# ❌ Slave holds `FormState` or any form lifecycle state
# ❌ Controlled inputs (`value`+`onChange`) in form slaves — use uncontrolled
#     (`defaultValue`) with `FormData` extraction instead (see §2b)
# ❌ Slave imports anything from `pages/`
# ❌ Slave uses `window.location.href` or raw `<a href>` for internal navigation —
#     use `<Link>` or `useNavigate()` instead (see §2c)
# ❌ Master exports data-internal types separately from slave props
# ❌ Master switches between Loading/Error/Data components (delegate to slave)
# ❌ Page passes `LoadingComponent` or `ErrorComponent` to a master
# ❌ Page conditionally renders different masters based on URL state —
#     routing belongs in `main/routes.tsx`, not in pages
# ❌ Page composes URLs or uses `useLocation()` for URL building —
#     URL generation belongs in masters via `useUrls()`