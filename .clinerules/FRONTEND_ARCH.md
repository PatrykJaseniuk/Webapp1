# Frontend Architecture — Master/Slave Component Rules
# ======================================================

# Apply to every masterComponent, slaveComponent and page you generate or modify.
# Layers on top of FUNCTIONAL_TS.md and FUNCTIONAL_TSX.md.
#
# PRECEDENCE (resolve any conflict in this order):
#   FRONTEND_ARCH.md > FUNCTIONAL_TSX.md > FUNCTIONAL_TS.md
# KEYWORDS: MUST / SHOULD / NEVER carry RFC 2119 semantics.
# Formatting is owned entirely by Prettier — these rules never prescribe layout style.

# ───────────────────────────────────────────────────────────────
# 0. FILE STRUCTURE & CANONICAL LOCATIONS
# ───────────────────────────────────────────────────────────────

# src/
# ├── main/               App bootstrap + route tree (routes.tsx) + router
# ├── backendConnector/   Supabase client + generated DB types
# ├── generic/            Zero-domain-knowledge shared types & helpers
# ├── hooks/              Auth context (useAuth, AppRole)
# ├── masterComponents/   CONTAINERS — logic, data, side effects
# ├── slaveComponents/    PURE RENDER — UI only, no logic
# └── pages/              WIRING — connect master + slave

# Canonical imports — each symbol has exactly ONE source of truth:
#   AsyncData, toAsyncData, NavLink, NavLinkWithId  →  '@/generic'
#   backendConnector (Supabase client)              →  '@/backendConnector/backendConnector'
#   Database (generated DB types)                   →  '@/backendConnector'
#   useAuth, AppRole                                →  '@/hooks/AuthContext'
#   route objects (xxxDetailRoute), router          →  '@/main/routes'

# ───────────────────────────────────────────────────────────────
# 1. MASTER (masterComponents/) — CONTAINER
# ───────────────────────────────────────────────────────────────

- Own ALL side effects. Data fetching ONLY via TanStack Query:
  `useQuery` for reads, `useMutation` for writes, `useNavigate` for redirects.
  NEVER fetch inside `useEffect`; NEVER hand-roll promise/loading state.

- Query conventions:
  - `queryKey: ['<entity>', ...identifiers]` — first element is the table/entity
    name; include `role` in the key when the result depends on it.

    
- Own ALL navigation and link building. Render `<Link>` from
  `@tanstack/react-router` inside render-props typed `NavLink` / `NavLinkWithId`
  (types imported by the MASTER from `@/generic`) and pass them down via SProps
  (convention: a single `navLinkTo` object). Route paths come from
  `main/routes.tsx`.

- Define and export exactly ONE type — the slave's props interface
  (e.g. `LeaseAgreementSProps`). Exception: a form master MAY additionally
  export its form-input type (e.g. `LoginInput`) when it is referenced by
  `SProps['onSubmit']`. All other data-internal types stay private to the file.
- Derive DB row types from the generated schema, never hand-write them:
      type LeaseAgreementDbRow = Database['public']['Tables']['lease_agreements']['Row'];
- Receive the slave as a prop: `Slave: ComponentType<LeaseAgreementSProps>`.
  NEVER import slaves or pages.
- NEVER read URL params and NEVER call `useAuth`. Receive `id`, `role`, etc.
  as plain props from the Page.
- Do not define rendering functionality (no JSX beyond the single `<Slave .../>`
  return and inline `<Link>` elements inside navLinkTo render-props).
- Every master's file name and export name ends with 'M':
  'LeaseAgreementM.tsx', `LeaseAgreementDetailM`.

# ───────────────────────────────────────────────────────────────
# 2. SLAVE (slaveComponents/) — PURE RENDER
# ───────────────────────────────────────────────────────────────

- Pure functions. Zero side effects. Zero DB knowledge. Zero application
  knowledge. Zero local React state (`useState`, `useReducer`, `useRef` for
  data). The only "state" a slave knows is the `asyncData` prop (see §2a).

- Imports — whitelist:
  - TYPE imports: exactly ONE from its master — the slave props interface
    (e.g. `LeaseAgreementSProps`). Form slaves MAY additionally import the
    form-input type (e.g. `LoginInput`). Never import data-internal types.
  - VALUE imports: `ts-pattern`, sibling pure-render slaves
    (`LoadingSpinnerS`, `ErrorMessageS`, ...), React type helpers.
  - NEVER import: `@/backendConnector`, `@/generic`, `@/hooks`, `@/pages`,
    `@/main`, `@tanstack/react-router`, `@tanstack/react-query`, other masters,
    domain slaves that should arrive via props.

- Derive every data type inline from the slave props — never redefine them:

    type Data = Extract<LeaseAgreementSProps['asyncData'], { tag: 'fulfilled' }>['data'];
    type LeaseStatus = NonNullable<Data['leaseAgreement']>['lease_status'];
    const LEASE_STATUS_LABEL: Readonly<Record<LeaseStatus, string>> = { ... };
    const pillClass = (status: LeaseStatus): string => ...;

- Never use loose `Record<string, string>` or `(x: string)` for enum-based
  lookups/helpers — derive tight key types from the data shape as above.
- Every slave's file name and export name ends with 'S':
  'LeaseAgreementS.tsx', `LeaseAgreementDetailS`.

# ───────────────────────────────────────────────────────────────
# 2a. SLAVE THREE-STATE PATTERN
# ───────────────────────────────────────────────────────────────

- Every slave that receives async data MUST render all three states of
  `AsyncData<T>` (defined in `@/generic`):

    type AsyncData<T> =
      | { tag: 'pending' }
      | { tag: 'rejected'; message: string; onRetry: () => void }
      | { tag: 'fulfilled'; data: T };

- Accept a single `asyncData: AsyncData<T>` prop — never separate
  `isLoading` / `error` / `data` props.
- Render via `match(asyncData).with({ tag: 'pending' }, ...).with({ tag: 'rejected' }, ...).with({ tag: 'fulfilled' }, ...).exhaustive()`.
- The `rejected` branch MUST offer retry via the provided `onRetry` callback
  (e.g. `ErrorMessage` with a retry button).
- All three branches MUST share one wrapper container with a stable minimum
  height (`min-h-[300px]` for tables, `min-h-[400px]` for forms) to prevent
  layout shifts. `LoadingSpinner` / `ErrorMessage` fill their parent
  (`flex items-center justify-center`) without forcing their own height.
- List ("many") slaves: render the empty-state message inside the `fulfilled`
  branch when the array is empty. Never create a separate union tag for empty.

# ───────────────────────────────────────────────────────────────
# 2b. FORM PATTERN
# ───────────────────────────────────────────────────────────────

- Form slaves render uncontrolled inputs (`defaultValue`, never
  `value` + `onChange`).
- The slave defines a pure module-level `extractFormData(fd: FormData)`
  function returning a typed input object, and exports it for reuse/tests.
- The master owns the whole form lifecycle: submission via `useMutation`,
  validation of the extracted input (validate at this boundary — a zod
  schema is the recommended tool), and field/server error state. It passes
  down `onSubmit` plus the mutation state inside `asyncData`.
- The slave's `<form>` calls `e.preventDefault()`, extracts data via
  `FormData`, and invokes the master's `onSubmit` with the extracted object.
- Example signature:

    export type LeaseAgreementFormSProps = {
      readonly asyncData: AsyncData<LeaseAgreementDetailData>;
      readonly initialData: LeaseAgreementDetailData;  // for defaultValue population
      readonly onSubmit: (data: LeaseAgreementFormInput) => void;
      readonly navLinkTo: { readonly cancel: NavLink };
    };

# ───────────────────────────────────────────────────────────────
# 2c. SLAVE NAVIGATION
# ───────────────────────────────────────────────────────────────

- Slaves are ROUTING-SYSTEM AGNOSTIC. They NEVER import `Link`, `useNavigate`,
  or anything else from `@tanstack/react-router`. They NEVER use
  `window.location` or raw `<a href>` for internal navigation.
- All navigation arrives via `navLinkTo` render-props typed `NavLink` /
  `NavLinkWithId` (from the master's SProps). The slave invokes them with
  content and lets the master render the actual router `<Link>`:
    {navLinkTo.tenant({ id: l.tenant_id, style: {}, content: tenantName })}
    {navLinkTo.leases({ style: {}, content: '← Back to list' })}
# ───────────────────────────────────────────────────────────────
# 3. PAGE (pages/) — ROLE-ROUTER
# ───────────────────────────────────────────────────────────────

- Wire the system together: read route params + auth state, dispatch to the
  correct Master. Zero data fetching, zero business logic.
- Read URL params from the ROUTE OBJECT (type-safe), never from the global
  hook:  `const { id } = leaseDetailRoute.useParams();`  — route objects are
  exported from `@/main/routes` for this purpose.
- Read auth state (`useAuth`) and route with `match(authState).with(...).exhaustive()`:
  - `loading` → render `<LoadingSpinner />` directly
  - `unauthenticated` → render `<AccessDenied loginLink={...} />`
    (pages MAY build static links with `<Link>` from the router)
  - `authenticated` with wrong role → render `<AccessDenied />`
  - `authenticated` with correct role → `<Master Slave={S} id={id} role={role} />`
- The Page is the ONLY place that reads `useAuth` for dispatching. Masters
  receive `role` as a prop when their data depends on it.
- Return a single JSX tree via `match().exhaustive()`.
- Zero URL building beyond static links — navigation elements are generated
  by masters.
- Every page's file name and export name ends with 'P':
  'LeaseAgreementP.tsx', `LeaseAgreementDetailPage`.

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
- `<TableName>M`  — Master for a single record. Implements create, read, update.
- `<TableName>S`  — Slave for a single record. Defines the GUI for its master.
- `<TableName>P`  — Page for a single record.
- `<TableNames>M` — Master for many records (pluralized name + 'M').
- `<TableNames>S` — Slave for many records. Defines the GUI for its master.
- `<TableNames>P` — Page for many records.

COMPOSITE SCREENS: components that do not mirror a single table (dashboards,
layout shells, summary widgets — e.g. `DashboardSummaryM` + `AdminDashboardS` /
`LandlordDashboardS` / `TenantDashboardS`) still follow the SAME M/S/P
discipline: a master owns their data (possibly aggregated from several
tables), slaves stay pure render, a page wires them.

# ───────────────────────────────────────────────────────────────
# ANTI-PATTERNS
# ───────────────────────────────────────────────────────────────

# ❌ Slave imports `@/backendConnector`, `@/generic`, `@/hooks`, `@/pages`, `@/main`
# ❌ Slave imports `@tanstack/react-router` or `@tanstack/react-query`
# ❌ Slave imports more than one type from its master (form-input type excepted)
# ❌ Slave imports data-internal types (e.g. `LeaseAgreementData`) from its master
# ❌ Slave uses `Record<string, string>` or `(x: string)` for enum-based
#     label lookups / helper functions — derive tight key types from `<Name>SProps`
# ❌ Slave uses `window.location.href` or raw `<a href>` for internal navigation —
#     navigation arrives via `navLinkTo` render-props (see §2c)
# ❌ Slave holds form lifecycle state, or uses controlled inputs
#     (`value` + `onChange`) — uncontrolled + `FormData` extraction (see §2b)
# ❌ Slave imports domain-specific components that should come through props
# ❌ Master imports a slave or a page — the slave arrives via the `Slave` prop
# ❌ Master reads URL params or calls `useAuth` — those are Page inputs, passed as props
# ❌ Master fetches via `useEffect` / raw `fetch` — use `useQuery` / `useMutation`
# ❌ Master exports data-internal types separately from the slave props
# ❌ Master switches between Loading/Error/Data rendering — delegate to the slave's match
# ❌ Master swallows query errors or returns rejected promises implicitly —
#     use `Promise.reject(combinedError)` inside `queryFn` to signal errors to TanStack Query
# ❌ Page fetches data or imports `@/backendConnector`
# ❌ Page passes `LoadingComponent` or `ErrorComponent` to a master
# ❌ Page conditionally renders different masters based on URL state —
#     routing belongs in `main/routes.tsx`, not in pages
# ❌ Page composes navigation URLs for masters — masters own link building
# ❌ Floating promises anywhere: `query.refetch()`, `navigate(...)`,
#     `invalidateQueries(...)` MUST be awaited or prefixed with `void`
#     (enforced by `@typescript-eslint/no-floating-promises`)

# ───────────────────────────────────────────────────────────────
# END OF RULES
# ───────────────────────────────────────────────────────────────