# Frontend — React SPA

> **Audience:** LLM agents working on the frontend.
> Covers: directory structure, routing, auth, error handling, component patterns.


## Directory Structure

```
src/
├── main/               App bootstrap and routing (main.tsx, App.tsx, routes.tsx)
├── backendConnector/   Supabase client + generated DB types (never edit __generated__/)
├── generic/            Pure FP utilities — FormState, Result, AppError, AsyncState, UserId, NavItem
├── hooks/              Hooks and contexts (AuthContext, useAuth, etc.)
├── masterComponents/   Container components with logic — auth gating, redirects, data fetching,
│                       layout orchestration (Login, Signup, RoleGuard, RoleRedirect, AppLayout)
├── slaveComponents/    Presentational/render components — the actual UI rendering lives here
│                       (NotFound, ErrorDisplay, AccessDenied, LoginForm, SignupForm, LoadingSpinner,
│                        AdminDashboard, LandlordDashboard, TenantDashboard, AppLayoutShell)
└── pages/              Route-level thin wrappers — they compose master + slave components, never
                        contain their own JSX/render logic. LayoutPage wires the layout; all other
                        pages match one route endpoint each.
```

## Component Layering Rules

### Dependency Direction

- **`masterComponents/`** — never imports from `slaveComponents/`. Receives slave components via `ComponentType` props. Owns the props types that slave components conform to.
- **`slaveComponents/`** — may import **type-only** from `masterComponents/` (the master defines the contract). Contains JSX, Tailwind classes, and presentational logic. Does not import from `pages/`.
- **`pages/`** — the wiring layer. Imports from both `masterComponents/` and `slaveComponents/`, connects them, and returns a single JSX tree. Contains no rendering logic.
- **`generic/`** — shared types used by both master and slave layers. No domain knowledge.

### Master→Slave Wiring

Components that pair a master (logic) with a slave (rendering) follow a consistent pattern:

- The master defines the slave's props type.
- The master receives the slave as a `ComponentType` prop.
- The slave imports the props type from the master.
- The page imports both and connects them.

This applies to `Login`/`LoginForm`, `Signup`/`SignupForm`, and `AppLayout`/`AppLayoutShell`.

## Routing

- **Hash router** (`createHashRouter`) — required for GitHub Pages (no server-side URL rewriting).
- All routes defined in `main/routes.tsx`.
- Root `/` has an `errorElement` for global error boundary coverage.

### Route Table

| Path         | Component               | Notes                                    |
|-------------|-------------------------|------------------------------------------|
| `/`          | redirect to `/login`   | index route with `Navigate`              |
| `/admin`     | `LayoutPage` → `AdminDashboardPage`    | layout route with shared sidebar + header |
| `/landlord`  | `LayoutPage` → `LandlordDashboardPage` | layout route with shared sidebar + header |
| `/tenant`    | `LayoutPage` → `TenantDashboardPage`   | layout route with shared sidebar + header |
| `/login`     | `LoginPage`            | redirects authenticated users to dashboard |
| `/signup`    | `SignupPage`           |                                          |
| `*`          | `NotFoundPage`         | catch-all for unknown URLs               |

### Structure

Routes are nested under one root `'/'` route. The root `errorElement` catches errors thrown by any child component.

Dashboard routes (`admin`, `landlord`, `tenant`) use a **layout route** pattern: `LayoutPage` renders the shared sidebar and content area with `<Outlet />`, and dashboard page components render only their specific content as index children. Auth and error pages are flat routes with no layout wrapping.

## App Layout

Dashboard pages (admin, landlord, tenant) are wrapped in a shared layout shell providing sidebar navigation and a top header with logout. Auth pages, error pages, and the not-found page are standalone fullscreen and do not use the layout.

- **`masterComponents/AppLayout`** — owns the per-role navigation link definitions (`NAV_LINKS`) as a default argument. Reads auth state via `useAuth`, derives sidebar items by role, handles logout with redirect to `/login`.
- **`slaveComponents/AppLayoutShell`** — receives nav items, email, and logout handler as props. Renders the sidebar, header bar, and content area. Contains no app-level route or navigation knowledge.
- **`generic/NavItem`** — the shared type for a single navigation link (label + path). Used by both layers, defined in the neutral `generic/` directory.
- **`pages/LayoutPage`** — the wiring layer. Connects `AppLayout` (master) and `AppLayoutShell` (slave) and renders `<Outlet />` for child route content. Used as a layout route in `routes.tsx`.

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