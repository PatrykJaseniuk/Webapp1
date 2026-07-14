# Frontend Architecture — Master/Slave Component Rules
# ======================================================

# Apply to every masterComponent and slaveComponent you generate or modify.
# Layers on top of FUNCTIONAL_TS.md and FUNCTIONAL_TSX.md.

# ───────────────────────────────────────────────────────────────
# FILE STRUCTURE
# ───────────────────────────────────────────────────────────────

# src/
# ├── main/               App bootstrap + routing
# ├── backendConnector/   Supabase client + generated DB types
# ├── generic/            Zero-domain-knowledge shared types
# ├── hooks/              Auth context + role hooks
# ├── masterComponents/   CONTAINERS — logic, data, side effects
# ├── slaveComponents/    PURE RENDER — UI only, no logic
# └── pages/              WIRING — connect master + slave

# ───────────────────────────────────────────────────────────────
# 1. MASTER (masterComponents/) — CONTAINER
# ───────────────────────────────────────────────────────────────

- Own all side effects: `useAsync`, `useAsyncFn`, `useNavigate`.
- Define and export the slave's interface
- Do not define rendering functionality
- Receive slave components as argument, do not import from slaves
- Do not read url params
- Every master component's name ends with letter 'M' : 'AppLayoutM.tsx', 'LeaseAgreementM.tsx', etc.

# ───────────────────────────────────────────────────────────────
# 2. SLAVE (slaveComponents/) — PURE RENDER
# ───────────────────────────────────────────────────────────────

- Define rendering functionality
- Pure functions. Zero side effects. Zero DB knowledge. Zero application knowledge.
  Zero local React state (`useState`, `useReducer`, `useRef` for data storage).
  Internal state is only allowed through the `SlaveDataState` prop (see §2a).
- Import types ONLY from: `react` + `@/generic` + their master.
- Types are not defined in slave component's file
- May import pure-render sibling slave components (e.g. `LoadingSpinner`, `ErrorMessage`)
  but NEVER masters, pages, or `@/backendConnector`.
- NEVER: `@/backendConnector`, `Database`, `useNavigate`, `useAsync`, `useAsyncFn`.
- Have zero knowledge about url routes of whole application (url strings are sent by arguments)
- Every slave component's name ends with letter 'S' : 'AppLayoutS.tsx', 'LeaseAgreementS.tsx', etc.

# ───────────────────────────────────────────────────────────────
# 2a. SLAVE THREE-STATE PATTERN
# ───────────────────────────────────────────────────────────────

- Every slave that receives fetched data MUST handle three states: pending, rejected, fulfilled.
- Accept a single `state: SlaveDataState<T>` prop (from `@/generic`) instead of separate
  `isLoading`, `error`, `data` props.
- Use `match(state).with({ tag: 'pending' }, ...).with({ tag: 'rejected' }, ...).with({ tag: 'fulfilled' }, ...).exhaustive()`
  to guarantee every state is rendered. This is the ONLY kind of "state" slaves handle —
  it models the data-fetch lifecycle, not application state.
- The master converts `useAsync` output into `SlaveDataState<T>` and passes it down.
- The master does NOT switch between Loading/Error/Data components — the slave does.
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
      readonly state: SlaveDataState<LeaseAgreementDetailData>;
      readonly initialData: LeaseAgreementDetailData;   // for defaultValue population
      readonly onSubmit: (data: LeaseAgreementFormInput) => void;
      readonly getCancelUrl: () => string;
    };

# ───────────────────────────────────────────────────────────────
# 3. PAGE (pages/) — WIRING
# ───────────────────────────────────────────────────────────────

- url strings can be composed only in page components
- Router endpoint
- Read params from url and send them to master as regular props
- Import BOTH the master and the slave, then wire them together:
  the page instantiates the master, passing the slave as a prop.
- Return a single JSX tree. Zero rendering logic. Zero business logic. Zero side effects.
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

# ❌ Slave imports `@/backendConnector` or `Database`
# ❌ Slave uses `useNavigate`, `useAsync`, `useAsyncFn`
# ❌ Slave imports domain-specific components from other slaves that should
#     come through props (e.g. a table-row component imported directly instead
#     of being passed as a render-prop or children)
# ❌ Slave holds `FormState` or any form lifecycle state
# ❌ Controlled inputs (`value`+`onChange`) in form slaves — use uncontrolled
#     (`defaultValue`) with `FormData` extraction instead (see §2b)
# ❌ Slave imports anything from `pages/`
# ❌ Master switches between Loading/Error/Data components (delegate to slave)
# ❌ Page passes `LoadingComponent` or `ErrorComponent` to a master
# ❌ Page conditionally renders different masters based on URL state —
#     routing belongs in `main/routes.tsx`, not in pages