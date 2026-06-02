# Frontend — Generation Rules for LLM Agents

> Generate a React frontend from a Supabase backend.
> Code-level rules: `.clinerules/FUNCTIONAL_TS.md`
> System overview: `doc/SYSTEM.md`

## Stack (fixed)

| Layer | Choice |
|-------|--------|
| Build + Dev | Vite |
| UI | React 18, TypeScript `strict: true` |
| Styling | Tailwind CSS |
| Routing | React Router v6 `createHashRouter` |
| Server state | TanStack Query |
| Pattern matching | ts-pattern |
| API | @supabase/supabase-js |

## Directory Structure

```
src/
├── api/
│   ├── database.ts              # single supabase client — create once, never duplicate
│   └── database.types.ts         # generated: supabase gen types
├── domain/
│   ├── entities.ts               # type aliases from generated Database types + const arrays
│   └── types.ts                  # Result<T, E>, ok/err, AppError union, AsyncState
├── shared/
│   ├── routes.ts                 # ROUTES object + buildRoute (see §Routing)
│   └── form.ts                   # FormState helpers
├── data/                         # one file per DB table — CRUD + TanStack hooks
│   └── <table>.ts
├── features/                     # pure display components — props in, JSX out
│   └── <table>/
│       ├── <TableName>List.tsx   # table/list display
│       └── <TableName>Form.tsx   # create/edit form
├── pages/                        # stateful route targets — call data/ hooks, wire to features
│   ├── Layout.tsx                # sidebar + user menu + <Outlet />
│   ├── <TableName>Page.tsx       # list page
│   ├── <TableName>DetailPage.tsx # detail page (receives params as typed props)
│   └── DashboardPage.tsx
├── App.tsx                       # route table + auth guard + param extraction wrappers
└── main.tsx                      # QueryClientProvider + mount
```

## Layer Rules (import discipline)

| Layer | Can import | Must not import |
|-------|-----------|-----------------|
| `domain/` | `api/database.types` (types only) | no I/O, no React |
| `shared/` | nothing | no domain, no app code |
| `data/` | `domain/`, `api/` | no React components |
| `features/` | `domain/`, `shared/` | no `data/`, no `useQuery`/`useMutation` |
| `pages/` | `data/`, `features/`, `domain/`, `shared/` | no other `pages/` |
| `App.tsx` | everything | — |

**State vs pure separation:** `pages/` call `useQuery`/`useMutation` and pass data down. `features/` receive data via props — they may use `useState` for local form fields only. Never `useQuery` in `features/`.

## For Each DB Table — Generate These 4 Files

### 1. `domain/entities.ts` — type aliases
- `Row`, `Insert`, `Update` aliases from `Database['public']['Tables']['<table>']`
- `as const` arrays for any CHECK-constrained columns (statuses, types)

### 2. `data/<table>.ts` — CRUD + TanStack hooks
- CRUD async functions: `fetchAll`, `fetchById`, `save`, `update`, `delete`
- All CRUD functions return `Promise<Result<T, AppError>>` — never throw
- Wrap Supabase errors with a `toAppError` helper mapping `PostgrestError` → `AppError`
- TanStack hooks (`useQuery`, `useMutation`) unwrap `Result` at the boundary:
  use `match` to branch on `{ tag: 'ok' }` / `{ tag: 'err' }` inside `mutationFn`
- `useQuery` key: `['<table>'] as const`

### 3. `features/<table>/` — pure display components
- **List** — `readonly items[]` + `onEdit`/`onDelete` callbacks as props
- **Form** — optional `item` for edit mode, `onSubmit: (data: Insert) => Promise<void>`, `onCancel`

### 4. `pages/<Name>Page.tsx` — stateful page
- Calls `data/` hooks, passes data down to `features/`
- Uses `ts-pattern` `match` for loading / error / success states
- Local UI state only: `useState` for editing mode, form visibility

## Routing

**`shared/routes.ts`** — pure constants, zero imports. Typed `RouteParams` record → `ROUTES` object → `buildRoute<K>(route, params)` builder.

**`App.tsx`** — the only place calling `useParams`, `createHashRouter`:
- Public routes (login, signup) at top level
- Protected routes behind an `AuthGuard` wrapper that checks `useSessionQuery`
- Lazy-loaded page components via `lazy(() => import(...))`
- Param wrappers for parameterized routes — extract `useParams`, pass as typed props to detail pages
- Pages never call `useParams` themselves

**Links** — always use `buildRoute`: `<NavLink to={buildRoute('<route>', {})}>`

## What NOT to Do

- ❌ No raw strings in `to`/`path` — always `buildRoute` or `ROUTES.*.path`
- ❌ No `useParams` in page components — extraction happens in `App.tsx` wrappers
- ❌ No `useQuery`/`useMutation` in `features/` — only in `pages/`
- ❌ No `database` calls in `pages/` or `features/` — only in `data/`
- ❌ No `throw` anywhere — use `Result<T, E>` (FUNCTIONAL_TS.md §7)
- ❌ No `switch` statements — use `ts-pattern` (FUNCTIONAL_TS.md §6)
- ❌ No `if/else if` chains for value mapping — use lookup objects
- ❌ No `let`, `var`, non-null assertions (`!`), or `any`

## Pipeline

```
pages/ → data/<table>.ts → api/database → Supabase
  ↑            ↑
stateful   CRUD + hooks (Result-based, no throw)
           (one file per table)
```

## CI

```bash
npm run lint && npm run typecheck && npm run test && npm run build