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
| Local dev | Supabase CLI (backend) + Vite (frontend) |

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
# Backend — requires Supabase CLI + Docker
cd backend
supabase start          # starts PostgreSQL, Auth, API, Studio on local ports

# Frontend
cd frontend
cp .env.example .env    # VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm install
npm run dev             # Vite dev server on :5173
```

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
- **RLS must be enabled** on every table in an exposed schema (including `public`).
- **Supabase Auth JWT claims** from `raw_user_meta_data` are user-editable — never use them for authorization.

## Key Design Decisions

| Decision | Reason |
|----------|--------|
| No custom server | Supabase provides the API — PostgREST, Auth, Storage |
| Hash router | GitHub Pages cannot rewrite URLs server-side |
| Single SPA | Simpler CI/CD, shared auth; role modules lazy-loaded for isolation |
| SQL migrations | Schema-as-code, version controlled, repeatable |
| Static CSS (Tailwind) | No runtime CSS-in-JS overhead |