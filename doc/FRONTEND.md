# Frontend — Vite + React

> **Audience:** LLM agents working on the frontend.
> Covers: stack, project structure, layer rules, data fetching, routing, code style.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Build | Vite |
| UI | React 18, TypeScript `strict: true` |
| Styling | Tailwind CSS (zero runtime, JIT) |
| Routing | React Router v6 `createHashRouter` |
| FP | fp-ts, ts-pattern |
| API | @supabase/supabase-js |
| Testing | Vitest + fast-check |

## Project Structure

```
frontend/
└── src/
    ├── api/
    │   ├── database.ts          # single supabase client (rule R-010)
    │   └── database.types.ts    # generated: supabase gen types
    ├── domain/                  # pure types + business logic (no I/O, no React)
    ├── shared/                  # FP utils, UI primitives (no domain knowledge)
    ├── infra/                   # Supabase adapters — effectful I/O boundary
    ├── application/             # hooks (useAuth, useAsync), route guards
    ├── features/                # role-scoped screens, lazy-loaded
    │   ├── role-a/
    │   └── role-b/
    ├── App.tsx
    └── main.tsx
```

## Layer Rules (import discipline)

| Layer | Can import | Must not import |
|-------|-----------|-----------------|
| `domain/` | nothing | no I/O, no React, no framework code |
| `shared/` | `domain/` | no app-specific code |
| `infra/` | `domain/`, `shared/` | no React components |
| `application/` | `domain/`, `infra/`, `shared/` | no `features/` code |
| `features/` | `application/`, `infra/`, `domain/`, `shared/` | no other `features/` |

## Supabase Client

**Single instance** — rule R-010 from `.clinerules/FRONTEND_STYLE_GUIDE_LIBRARY.md`:

```typescript
// src/api/database.ts — the ONLY place a client is created
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const database = createClient<Database>(supabaseUrl, supabaseAnonKey);
```

## Data Fetching Rules

Per `.clinerules/FRONTEND_STYLE_GUIDE_LIBRARY.md`:

| Rule | When | Pattern |
|------|------|---------|
| R-006 | Data on mount / page load | `useAsync` |
| R-007 | Data on user action (click, submit) | `useAsyncFn` |
| R-008 | Refetch after mutation | `refreshKey` — increment counter to trigger reload |
| R-009 | Rendering lists | Never use array index as `key` — use unique IDs |

```typescript
// R-006: fetch on mount
const { data, loading, error } = useAsync(() =>
  database.from('table').select('*')
);

// R-007: fetch on user action
const [fetchData, { data, loading }] = useAsyncFn(
  (id: string) => database.from('table').select('*').eq('id', id)
);

// R-008: refetch after mutation
const [refreshKey, setRefreshKey] = useState(0);
const { data } = useAsync(() => fetchData(), [refreshKey]);
// After mutation: setRefreshKey(k => k + 1)
```

## Auth + Routing

1. Supabase Auth handles sign-in → JWT stored in browser
2. Session listener updates global auth state
3. Role fetched from roles table (not from JWT claims)
4. Route guards check role before rendering feature modules
5. Feature modules loaded via `React.lazy()` — unused role code stays on disk

## Routing (Hash Router)

**Hash router required** — GitHub Pages has no server-side URL rewriting:

```typescript
const router = createHashRouter([
  { path: '/login', element: <Login /> },
  {
    element: <RequireRole roles={['admin']} />,
    children: [
      { path: '/admin', element: <AdminDashboard /> },
    ],
  },
  { path: '*', element: <Navigate to="/" /> },
]);
```

## Code Style

Governed by `.clinerules/` (global FUNCTIONAL_TS.md):

- No classes — plain objects + standalone functions
- Immutable data — `Readonly<T>`, `ReadonlyArray<T>`, `as const`
- Errors as `Result<T, E>`, absence as `Option<T>` (fp-ts)
- Discriminated unions for state machines
- `pipe` / `flow` for composition
- No `let` (prefer `const`), no `any` (use `unknown` + narrowing)
- ESLint: `functional/immutable-data`, `functional/no-let`, `functional/no-loop-statements`, `import/no-cycle`

## CI Commands

```bash
npm run lint      # ESLint with functional/* rules
npm run typecheck # tsc --noEmit (strict mode)
npm run test      # Vitest
npm run build     # Vite build → dist/
```

## Key Decisions

| Decision | Reason |
|----------|--------|
| Hash router | GH Pages cannot rewrite URLs |
| Lazy-loaded role features | Unused role code never sent to the browser |
| Single supabase client | Rule R-010 — one instance, typed with generated types |
| `domain/` has zero deps | Pure logic, testable without mocking |
| `infra/` is the I/O boundary | All Supabase calls live here, nowhere else |
| Tailwind CSS | Zero runtime — no JS overhead in static SPA |