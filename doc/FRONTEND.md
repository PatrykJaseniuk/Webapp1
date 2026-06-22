# Frontend — React SPA

> **Audience:** LLM agents working on the frontend.
> Covers: directory structure, routing, auth, error handling, component patterns.

## Directory Structure

```
src/
├── main/               App bootstrap and routing (main.tsx, App.tsx, routes.tsx)
├── backendConnector/   Supabase client + generated DB types (never edit __generated__/)
├── generic/            Pure FP utilities — FormState, Result, AppError, AsyncState, UserId
├── hooks/              Hooks and contexts (AuthContext, useAuth, etc.)
├── masterComponents/   Container components with logic (Login, Signup, RoleGuard, RoleRedirect)
├── slaveComponents/    Presentational/render components — the actual UI rendering lives here
│                       (NotFound, ErrorDisplay, AccessDenied, LoginForm, SignupForm, LoadingSpinner,
│                        AdminDashboard, LandlordDashboard, TenantDashboard)
└── pages/              Route-level thin wrappers — they compose master + slave components, never
                        contain their own JSX/render logic. Each page matches one route endpoint.
```

### Component Layering Rule

- **`pages/`** — thin endpoint. Imports from `masterComponents/` and `slaveComponents/`, returns a single JSX tree composed from them. No inline rendering.
- **`slaveComponents/`** — actual UI. Contains JSX, Tailwind classes, and pure presentational logic (e.g. `useRouteError()`). Does NOT import from `pages/` or `masterComponents/`.
- **`masterComponents/`** — logic containers. Provide auth gating, redirects, data fetching wrappers. Render via `children`.

Example:
```
pages/NotFoundPage.tsx  →  import { NotFound } from "@/slaveComponents/NotFound"  →  <NotFound />
pages/ErrorPage.tsx     →  import { ErrorDisplay } from "@/slaveComponents/ErrorDisplay"  →  <ErrorDisplay />
pages/LoginPage.tsx     →  import { Login } from "@/masterComponents/Login" + { LoginForm } from "@/slaveComponents/LoginForm"
```

## Routing

- **Hash router** (`createHashRouter`) — required for GitHub Pages (no server-side URL rewriting).
- All routes defined in `main/routes.tsx`.
- Root `/` has an `errorElement` for global error boundary coverage.

### Route Table

| Path         | Component               | Notes                                    |
|-------------|-------------------------|------------------------------------------|
| `/`          | redirect to `/login`   | index route with `Navigate`              |
| `/admin`     | `AdminDashboardPage`    | protected by `RoleGuard`                 |
| `/landlord`  | `LandlordDashboardPage` | protected by `RoleGuard`                 |
| `/tenant`    | `TenantDashboardPage`  | protected by `RoleGuard`                 |
| `/login`     | `LoginPage`            | redirects authenticated users to dashboard |
| `/signup`    | `SignupPage`           |                                          |
| `*`          | `NotFoundPage`         | catch-all for unknown URLs               |

### Structure

Routes are nested under one root `'/'` route:

```tsx
createHashRouter([
  {
    path: '/',
    errorElement: <ErrorPage />,   // catches errors thrown by any child component
    children: [
      { index: true, element: <Navigate to="/login" replace /> },
      { path: 'admin', Component: AdminDashboardPage },
      // ...
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
```

## Error & Not Found Handling

The app has two layers of error UX, both following the `pages/` → `slaveComponents/` pattern:

### 1. Unknown routes (404)

`*` catch-all → `NotFoundPage` (thin wrapper) → `NotFound` (render UI).

`slaveComponents/NotFound.tsx` renders a centered "404 — Page not found" message with a link to `/login`.

### 2. Component errors (error boundary)

Root `errorElement: <ErrorPage />` → `ErrorPage` (thin wrapper) → `ErrorDisplay` (render UI + logic).

`slaveComponents/ErrorDisplay.tsx` uses `useRouteError()` + `isRouteErrorResponse()` to distinguish:
- **404 errors** (route-level) → same 404 UI as `NotFound`
- **Other errors** → "Something went wrong" message with a link to `/login`

This means a component crash (thrown error, unhandled promise rejection in render) no longer shows the raw `Unexpected Application Error!` screen — it shows a styled error page instead.

## Auth

- `AuthContext` in `hooks/` manages session state via `supabase-js` — listens for `onAuthStateChange`.
- Role derived from `get_user_role()` RPC call to Supabase.
- `RoleGuard` wraps protected routes; `RoleRedirect` sends authenticated users to their dashboard.

## Backend Connector

- Single Supabase client instance: `backendConnector` in `backendConnector/backendConnector.ts`.
- DB types auto-generated in `__generated__/database.types.ts` — import via `@/backendConnector`.

## Imports

- Path alias `@/*` maps to `src/*` (configured in `tsconfig.json`).
- Use `import type` for type-only imports.