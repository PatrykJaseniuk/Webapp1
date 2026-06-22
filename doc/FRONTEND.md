# Frontend — React SPA

> **Audience:** LLM agents working on the frontend.
> Covers: directory structure, routing, auth, component patterns.

## Directory Structure

```
src/
├── main/               App bootstrap and routing (main.tsx, App.tsx, routes.tsx)
├── backendConnector/   Supabase client + generated DB types (never edit __generated__/)
├── generic/            Pure FP utilities — FormState, Result, AppError, AsyncState, UserId
├── contexts/           Auth context — AuthState discriminated union, AuthProvider, useAuth hook
├── masterComponents/   Container components with logic (Login, Signup, RoleGuard, RoleRedirect)
├── slaveComponents/    Presentational components (forms, dashboards, loading/error states)
├── pages/              Route-level page components (LoginPage, SignupPage, *DashboardPage)
└── hooks/              (reserved, currently empty)
```

## Routing

- **Hash router** (`createHashRouter`) — required for GitHub Pages (no server-side URL rewriting).
- Routes defined in `main/routes.tsx`: `/`, `/landlord`, `/tenant`, `/login`, `/signup`.

## Auth

- `AuthContext` manages session state via `supabase-js` — listens for `onAuthStateChange`.
- Role derived from `get_user_role()` RPC call to Supabase.
- `RoleGuard` wraps protected routes; `RoleRedirect` sends authenticated users to their dashboard.

## Backend Connector

- Single Supabase client instance: `backendConnector` in `backendConnector/backendConnector.ts`.
- DB types auto-generated in `__generated__/database.types.ts` — import via `@/backendConnector`.

## Imports

- Path alias `@/*` maps to `src/*` (configured in `tsconfig.json`).
- Use `import type` for type-only imports.