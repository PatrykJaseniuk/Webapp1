# System Architecture

> **Audience:** LLM agents working on this project.
> Covers: local dev setup, CI/CD pipelines, hosting, and cross-cutting rules.

## Overview

| Aspect | Choice |
|--------|--------|
| Type | Single SPA + managed backend |
| Frontend | Static SPA on GitHub Pages |
| Backend | Supabase Cloud (PostgreSQL, Auth, Storage, Realtime, Edge Functions) |
| CI/CD | GitHub Actions |
| Local dev | Makefile orchestrating Supabase CLI + Vite |

## Architecture Pattern

```
Browser (SPA) ──supabase-js──→ Supabase Cloud
                  ├─ Auth (JWT)
                  ├─ Database (PostgREST REST API)
                  ├─ Storage (S3-compatible)
                  └─ Realtime (WebSocket)
```

No middle-tier server. The SPA calls Supabase APIs directly from the browser.
All access is gated by PostgreSQL Row Level Security policies.

## Hosting

| Component | Platform | Details |
|-----------|----------|---------|
| Frontend | GitHub Actions Artifact | Build output (`dist/`) uploaded as workflow artifact |
| Backend | Supabase Cloud | Managed PostgreSQL, Auth, Storage |

## Local Development

```bash
# One-time setup
make setup

# Full pure rebuild — starts from clean state every time
make dev
```

### What `make dev` does

```
supabase start        → fresh local Postgres + services
supabase db reset     → drop & rebuild DB entirely from .sql migration files
supabase gen types    → derive types from the schema → backendConnector/__generated__/
npm run dev           → Vite dev server on :5173
[Ctrl+C]              → trap triggers supabase stop (zero residual state)
```

**Key properties:**
- **Pure** — every launch rebuilds the database from the same migration files. No hidden state, no stale data.
- **Clean on exit** — `trap ... INT TERM EXIT` ensures `supabase stop` always runs, removing all Docker containers.
- **Generated types are always fresh** — `database.types.ts` is overwritten by `supabase gen types` and placed in `frontend/src/backendConnector/__generated__/`. Never edit it manually.

### Manual commands (rarely needed)

```bash
make stop       # stop and clean up
make clean      # stop + remove dist/, node_modules/, .env
make typecheck  # tsc --noEmit
make lint       # ESLint + supabase db lint
make build      # full rebuild → production build → cleanup
```

## Frontend Directory Structure

```
src/
├── backendConnector/   Supabase client + generated database types
│   ├── backendConnector.ts    (createClient<Database>)
│   └── __generated__/         (database.types.ts — auto-generated, do not edit)
├── generic/            Shared utilities and form state
│   ├── utils.ts               (Result, AppError, AsyncState, UserId)
│   └── form.ts                (FormState discriminated union + smart constructors)
├── hooks/              React context providers
│   └── AuthContext.tsx
├── main/               Application bootstrap
│   ├── main.tsx               (ReactDOM entry)
│   ├── App.tsx                (router, AuthProvider, route generation)
│   ├── routes.tsx             (route tree + buildRoute)
│   └── index.css              (Tailwind + global styles)
├── masterComponents/   Layout and auth shell components
│   └── (AppLayout, Login, Signup, RoleGuard, RoleRedirect)
├── pages/              Top-level route page components
│   └── (<Role>DashboardPage, LoginPage, NotFoundPage, etc.)
└── slaveComponents/    Feature-level presentational components
    └── (Dashboard views, form components, loading/error states)
```

## CI/CD

### Workflow 1: `ci.yml` — triggered on push to `main`

**Check phase:**
1. `backend-check` — `supabase start` → `db reset` → `db lint` → `gen types --local` → upload types as artifact
2. `frontend-lint` — ESLint with functional/* rules
3. `frontend-typecheck` — `tsc --noEmit` (uses fresh types from artifact)
4. `frontend-test` — Vitest (uses fresh types from artifact)

**Deploy phase (push to main only, all 4 checks must pass):**
5. `deploy-backend` — `supabase db push` to production
6. `build-frontend` — generates types from production → `npm run build` → upload `dist/` as artifact

### Workflow 2: `supabase-ci.yml` — triggered on migration file changes
1. `supabase db lint` — validates migration syntax
2. `supabase db diff --linked` — dry-run drift check

### Required GitHub Secrets
| Secret | Purpose |
|--------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL — injected at Vite build time |
| `VITE_SUPABASE_ANON_KEY` | Supabase publishable anon key |
| `SUPABASE_ACCESS_TOKEN` | Personal access token for CLI operations |
| `PRODUCTION_DB_PASSWORD` | Production database password for `supabase db push` |
| `PRODUCTION_PROJECT_ID` | Supabase production project reference ID |

## Cross-Cutting Rules

- **Never expose `service_role` key** in frontend code or env vars prefixed `NEXT_PUBLIC_` / `VITE_`.
- **Schema changes**: iterate with `execute_sql` (MCP) or `supabase db query`, then generate a clean migration with `supabase db pull`.
- **Always create migration files** with `supabase migration new <name>` — never invent filenames.
- **Use real Postgres ENUMs** (`CREATE TYPE ... AS ENUM (...)`), not `text` columns with `CHECK` constraints. `supabase gen types` auto-detects them.
- **RLS must be enabled** on every table in an exposed schema (including `public`).
- **Supabase Auth JWT claims** from `raw_user_meta_data` are user-editable — never use them for authorization.
- **Never edit `frontend/src/backendConnector/__generated__/database.types.ts`** — it is rebuilt by `make dev` and protected by ESLint ignore + `.gitattributes` `linguist-generated=true`.
- **Database-derived types** come from `@/backend` via `Tables<'name'>`, `TablesInsert<'name'>`, `Enums<'name'>` — no hand-duplicated aliases.
- **Runtime enum arrays** come from `Constants.public.Enums.*` — no hand-duplicated `as const` arrays.
- **Generated types are in `backendConnector/__generated__/`** — clearly signals "do not edit"; rebuilt every launch; ESLint + `.gitattributes` enforced.

## Key Design Decisions

| Decision | Reason |
|----------|--------|
| No custom server | Supabase provides the API — PostgREST, Auth, Storage |
| Hash router | Compatible with static hosting and artifact-based deployment |
| Single SPA | Simpler CI/CD, shared auth; role modules lazy-loaded for isolation |
| SQL migrations | Schema-as-code, version controlled, repeatable |
| Static CSS (Tailwind) | No runtime CSS-in-JS overhead |
| Pure dev pipeline | `make dev` always resets the DB from migration files — reproducible, no stale state |
| Structured source layout | `backendConnector/`, `generic/`, `main/`, `masterComponents/`, `pages/`, `slaveComponents/` — grouped by responsibility |
| Generated types in `__generated__/` | Clearly signals "do not edit"; rebuilt every launch; ESLint + `.gitattributes` enforced |
| Real Postgres ENUMs | Single source of truth in the database — types auto-generated, no hand-duplication |
| RBAC at both layers | Backend: RLS policies on `user_roles`. Frontend: `RoleGuard` components derived from `allowedRoles` on each route entry — no duplicated access logic |
