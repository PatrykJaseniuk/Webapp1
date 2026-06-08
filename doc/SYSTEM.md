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
| Frontend | GitHub Pages | Static files served from `gh-pages` branch |
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
supabase gen types    → derive types from the schema → volatile0/infra/__generated__/
npm run dev           → Vite dev server on :5173
[Ctrl+C]              → trap triggers supabase stop (zero residual state)
```

**Key properties:**
- **Pure** — every launch rebuilds the database from the same migration files. No hidden state, no stale data.
- **Clean on exit** — `trap ... INT TERM EXIT` ensures `supabase stop` always runs, removing all Docker containers.
- **Generated types are always fresh** — `database.types.ts` is overwritten by `supabase gen types` and placed in `frontend/src/volatile0/infra/__generated__/`. Never edit it manually.

### Manual commands (rarely needed)

```bash
make stop       # stop and clean up
make clean      # stop + remove dist/, node_modules/, .env
make typecheck  # tsc --noEmit
make lint       # ESLint + supabase db lint
make build      # full rebuild → production build → cleanup
```

## Frontend Directory Structure — Volatility Levels

Files are grouped into three directories by **change frequency** during development:

```
src/
├── volatile0/   ══ STABLE ══   infrastructure, domain types, generic utilities, app bootstrap
│   ├── bootstrap/    (main.tsx, index.css, vite-env.d.ts)
│   ├── infra/        (backendConnector.ts, __generated__/database.types.ts)
│   ├── domain/       (types.ts — Result, AppError, AsyncState, AppRole, AuthState, DTOs)
│   └── generic/      (form.ts, utils.ts)
├── volatile1/   ══ MODERATE ══  routes, auth — changes when app structure changes
│   ├── routes/       (ROUTE_TREE → ROUTES + buildRoute)
│   └── auth/         (AuthContext.tsx, AuthForm.tsx, RoleGuard.tsx, UserMenu.tsx)
└── volatile2/   ══ VOLATILE ══  features, pages, layout, App.tsx — daily work
    ├── app/          (App.tsx — router, AuthProvider, route generation)
    ├── layout/       (Layout.tsx — role-derived sidebar)
    ├── pages/        (<Role>DashboardPage.tsx, <Name>Page.tsx, <Name>DetailPage.tsx)
    └── <feature>/    (hooks.ts, <Name>List.tsx, <Name>Form.tsx)
```

| Level | When it changes | May import |
|-------|----------------|------------|
| `volatile0/` | **Never** (set up at project start) | External libs only. Never `volatile1/` or `volatile2/` |
| `volatile1/` | **Rarely** (new route, auth concern) | `volatile0/` groups. Never `volatile2/` |
| `volatile2/` | **Daily** (every new feature) | `volatile0/` + `volatile1/` groups |

No loose files at `src/` root. Everything lives under one of the three volatility directories.

## CI/CD

### Workflow 1: `ci.yml` — triggered on push to `main`
1. `npm run lint` — ESLint with functional/* rules
2. `npm run typecheck` — `tsc --noEmit`
3. `npm run test` — Vitest
4. `npm run build` — Vite, env vars injected from GitHub Secrets
5. Deploy `dist/` to GitHub Pages (`gh-pages` branch)

### Workflow 2: `supabase-ci.yml` — triggered on migration file changes
1. `supabase db lint` — validates migration syntax
2. `supabase db diff --linked` — dry-run drift check

### Required GitHub Secrets
| Secret | Purpose |
|--------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL — injected at Vite build time |
| `VITE_SUPABASE_ANON_KEY` | Supabase publishable anon key |
| `SUPABASE_ACCESS_TOKEN` | Personal access token for CLI operations |

## Cross-Cutting Rules

- **Never expose `service_role` key** in frontend code or env vars prefixed `NEXT_PUBLIC_` / `VITE_`.
- **Schema changes**: iterate with `execute_sql` (MCP) or `supabase db query`, then generate a clean migration with `supabase db pull`.
- **Always create migration files** with `supabase migration new <name>` — never invent filenames.
- **Use real Postgres ENUMs** (`CREATE TYPE ... AS ENUM (...)`), not `text` columns with `CHECK` constraints. `supabase gen types` auto-detects them.
- **RLS must be enabled** on every table in an exposed schema (including `public`).
- **Supabase Auth JWT claims** from `raw_user_meta_data` are user-editable — never use them for authorization.
- **Never edit `frontend/src/volatile0/infra/__generated__/database.types.ts`** — it is rebuilt by `make dev` and protected by ESLint ignore + `.gitattributes` `linguist-generated=true`.
- **Database-derived types** come from `@/backend` via `Tables<'name'>`, `TablesInsert<'name'>`, `Enums<'name'>` — no hand-duplicated aliases.
- **Runtime enum arrays** come from `Constants.public.Enums.*` — no hand-duplicated `as const` arrays.
- **No files at `src/` root** — everything under `volatile0/`, `volatile1/`, or `volatile2/`.

## Key Design Decisions

| Decision | Reason |
|----------|--------|
| No custom server | Supabase provides the API — PostgREST, Auth, Storage |
| Hash router | GitHub Pages cannot rewrite URLs server-side |
| Single SPA | Simpler CI/CD, shared auth; role modules lazy-loaded for isolation |
| SQL migrations | Schema-as-code, version controlled, repeatable |
| Static CSS (Tailwind) | No runtime CSS-in-JS overhead |
| Pure dev pipeline | `make dev` always resets the DB from migration files — reproducible, no stale state |
| Volatility-based directory structure | `volatile0/` (stable), `volatile1/` (moderate), `volatile2/` (volatile) — grouped by change frequency + dependency direction |
| Generated types in `__generated__/` | Clearly signals "do not edit"; rebuilt every launch; ESLint + `.gitattributes` enforced |
| Real Postgres ENUMs | Single source of truth in the database — types auto-generated, no hand-duplication |
| RBAC at both layers | Backend: RLS policies on `user_roles`. Frontend: `RoleGuard` components derived from `allowedRoles` on each route entry — no duplicated access logic |
