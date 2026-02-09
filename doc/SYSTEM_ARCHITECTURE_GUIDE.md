# System Architecture Guide

**Purpose:** Guide for LLMs generating code for this full-stack web application.  
**Tech Stack:** Next.js 16.1.4 | React 19.2.3 | TypeScript 5.x | Supabase (PostgreSQL 15 + PostgREST + JWT Auth) | react-use 17.6.x  
**Related:** [Frontend Style Guide](./FRONTEND_STYLE_GUIDE.md) · [Backend Style Guide](./BACKEND_STYLE_GUIDE.md)

---

## Quick Reference (TL;DR)

| Rule ID | Rule | Severity |
|---------|------|----------|
| A-001 | **Client-only architecture** — NO server components, NO SSR, NO middleware, NO API routes | 🔴 Critical |
| A-002 | **RLS is the security layer** — all access control is enforced at database level, not app level | 🔴 Critical |
| A-003 | **Static Export (SSG)** → GitHub Pages — frontend is pre-built HTML + JS | 🔴 Critical |
| A-004 | **Browser → Supabase directly** — no backend server, no proxy, no BFF | 🔴 Critical |
| A-005 | **JWT auth via Supabase SDK** — tokens stored in browser, validated by Supabase | 🟠 High |
| A-006 | **Types generated from DB schema** — single source of truth is PostgreSQL | 🟠 High |
| A-007 | **Environment promotion** — local → staging → production, migrations tested at each step | 🟠 High |
| A-008 | **Role-separated routes** — `/tenant/*`, `/landlord/*`, `/admin/*` with `RoleGuard` protection | 🟠 High |
| A-009 | **No dynamic routes** — use URL search params (`?id=xxx`) instead of `[id]` segments | 🔴 Critical |

---

## System Components

```
┌──────────────────────────────────────────────────────────────┐
│  FRONTEND (Next.js 16.1.4 + React 19.2.3 — CLIENT-ONLY)     │
│  - Static Site Generation (SSG) with Full Client Rendering   │
│  - NO Server Components or Server-Side Logic                 │
│  - App Router, TypeScript, CSS Modules                       │
│  - All auth/state managed client-side via localStorage       │
│  - Deployment: GitHub Pages (Static Export)                  │
└────────────────────┬─────────────────────────────────────────┘
                     │ (REST API via Supabase Client SDK)
                     │ (Browser → Supabase, No Server Involved)
                     │
┌────────────────────▼─────────────────────────────────────────┐
│  BACKEND (Supabase Cloud / Local)                            │
│  - PostgreSQL Database with Row Level Security (RLS)         │
│  - Authentication (JWT-based via GoTrue)                     │
│  - REST API via PostgREST (auto-generated from schema)       │
│  - Real-time via WebSocket (optional)                        │
│  - Deployment: Supabase Cloud                                │
└──────────────────────────────────────────────────────────────┘
```

---

## Complete Project File Tree

```
Webapp1/
├── database/                              # Backend: Supabase + PostgreSQL
│   ├── readme.md                          # Database-specific docs
│   └── supabase/
│       ├── config.toml                    # Local Supabase configuration
│       ├── migrations/                    # SQL migration files (ordered)
│       │   ├── 20260124000000_schema.sql
│       │   ├── 20260124000100_indexes.sql
│       │   ├── 20260124000200_constraints.sql
│       │   ├── 20260124000300_functions_triggers.sql
│       │   ├── 20260124000400_security.sql
│       │   ├── 20260124000500_views.sql
│       │   └── 20260124000700_seed_data.sql
│       └── snippets/                      # Reusable SQL (not auto-applied)
├── doc/                                   # Documentation (style guides, ref docs)
│   ├── FRONTEND_STYLE_GUIDE.md            # Frontend coding rules for LLMs
│   ├── BACKEND_STYLE_GUIDE.md             # Backend/DB coding rules for LLMs
│   ├── SYSTEM_ARCHITECTURE_GUIDE.md       # This file — system overview
│   ├── IMPLEMENTATION_PLAN.md             # Step-by-step build plan for frontend
│   └── readme.md                          # Doc index
├── frontend/                              # Frontend: Next.js + React
│   ├── next.config.ts                     # SSG + static export config
│   ├── package.json                       # Dependencies & scripts
│   ├── tsconfig.json                      # TypeScript config (paths: @/ → src/)
│   ├── public/                            # Static assets (images, icons)
│   └── src/
│       ├── api/                           # Supabase client & auto-generated types
│       │   ├── database.ts                # Supabase client instance
│       │   └── database.types.ts          # Auto-generated from DB schema
│       ├── app/                           # Next.js App Router — role-separated routes
│       │   ├── layout.tsx                 # Root layout (HTML shell)
│       │   ├── globals.css                # CSS reset + design tokens
│       │   ├── page.tsx                   # Landing → redirect by role
│       │   ├── login/page.tsx             # Public: login
│       │   ├── signup/page.tsx            # Public: signup
│       │   ├── tenant/                    # 🔒 Tenant routes (role: tenant)
│       │   │   ├── dashboard/page.tsx
│       │   │   ├── properties/page.tsx    # ?id=xxx → detail
│       │   │   ├── leases/page.tsx        # ?id=xxx → detail
│       │   │   ├── billing/page.tsx
│       │   │   ├── meters/page.tsx
│       │   │   └── profile/page.tsx
│       │   ├── landlord/                  # 🔒 Landlord routes (roles: landlord, admin)
│       │   │   ├── dashboard/page.tsx
│       │   │   ├── properties/page.tsx    # ?id=xxx | ?action=new
│       │   │   ├── tenants/page.tsx       # ?id=xxx | ?action=new
│       │   │   ├── leases/page.tsx        # ?id=xxx | ?action=new
│       │   │   ├── billing/page.tsx       # ?id=xxx | ?action=new
│       │   │   ├── payments/page.tsx      # ?action=new
│       │   │   ├── meters/page.tsx        # ?action=new
│       │   │   ├── utility-prices/page.tsx
│       │   │   └── expenses/page.tsx      # ?action=new
│       │   └── admin/                     # 🔒 Admin routes (role: admin)
│       │       └── users/page.tsx
│       ├── components/                    # Domain-grouped flat components
│       │   ├── shared/                    # Reusable across all roles
│       │   │   ├── Spinner.tsx + .module.css
│       │   │   ├── ErrorBanner.tsx + .module.css
│       │   │   ├── EmptyState.tsx + .module.css
│       │   │   ├── RoleGuard.tsx + .module.css
│       │   │   ├── AppLayout.tsx + .module.css
│       │   │   └── Sidebar.tsx + .module.css
│       │   ├── auth/                      # Login/signup components
│       │   │   ├── LoginForm.tsx + .module.css
│       │   │   └── SignupForm.tsx + .module.css
│       │   ├── tenant/                    # Tenant-specific views
│       │   │   ├── TenantDashboard.tsx + .module.css
│       │   │   ├── TenantProperties.tsx + .module.css
│       │   │   ├── TenantLeases.tsx + .module.css
│       │   │   ├── TenantBilling.tsx + .module.css
│       │   │   ├── TenantMeters.tsx + .module.css
│       │   │   └── TenantProfile.tsx + .module.css
│       │   ├── landlord/                  # Landlord management views
│       │   │   ├── LandlordDashboard.tsx + .module.css
│       │   │   ├── PropertiesPage.tsx     # Mini-router (list/detail/form)
│       │   │   ├── PropertiesList.tsx + .module.css
│       │   │   ├── PropertyDetail.tsx + .module.css
│       │   │   ├── PropertyForm.tsx + .module.css
│       │   │   ├── TenantsPage.tsx
│       │   │   ├── TenantsList.tsx + .module.css
│       │   │   ├── TenantDetail.tsx + .module.css
│       │   │   ├── TenantForm.tsx + .module.css
│       │   │   ├── LeasesPage.tsx
│       │   │   ├── LeasesList.tsx + .module.css
│       │   │   ├── LeaseDetail.tsx + .module.css
│       │   │   ├── LeaseForm.tsx + .module.css
│       │   │   ├── BillingPage.tsx
│       │   │   ├── BillingList.tsx + .module.css
│       │   │   ├── BillingForm.tsx + .module.css
│       │   │   ├── PaymentsPage.tsx
│       │   │   ├── PaymentsList.tsx + .module.css
│       │   │   ├── PaymentForm.tsx + .module.css
│       │   │   ├── MetersPage.tsx
│       │   │   ├── MetersList.tsx + .module.css
│       │   │   ├── MeterForm.tsx + .module.css
│       │   │   ├── ReadingForm.tsx + .module.css
│       │   │   ├── ReadingsHistory.tsx + .module.css
│       │   │   ├── UtilityPricesList.tsx + .module.css
│       │   │   ├── UtilityPriceForm.tsx + .module.css
│       │   │   ├── ExpensesList.tsx + .module.css
│       │   │   └── ExpenseForm.tsx + .module.css
│       │   └── admin/                     # Admin-specific views
│       │       ├── UserRolesList.tsx + .module.css
│       │       └── UserRoleForm.tsx + .module.css
│       ├── hooks/                         # Custom React hooks
│       │   ├── useAuth.ts                 # Auth state, login, signup, logout
│       │   └── useUserRole.ts             # Fetch user role from user_roles table
│       └── utils/                         # Pure utility functions
│           ├── formatCurrency.ts          # PLN currency formatting
│           └── formatDate.ts              # Date formatting helpers
```

### Where New Code Goes

| What you're creating | Where to put it |
|---------------------|-----------------|
| New DB table | `database/supabase/migrations/YYYYMMDDHHMMSS_add_[table]_schema.sql` |
| New RLS policy | `database/supabase/migrations/YYYYMMDDHHMMSS_add_[table]_policies.sql` |
| New DB function | `database/supabase/migrations/YYYYMMDDHHMMSS_add_[name]_function.sql` |
| New page route (tenant) | `frontend/src/app/tenant/[route]/page.tsx` (thin wrapper + `RoleGuard`) |
| New page route (landlord) | `frontend/src/app/landlord/[route]/page.tsx` (thin wrapper + `RoleGuard`) |
| New page route (admin) | `frontend/src/app/admin/[route]/page.tsx` (thin wrapper + `RoleGuard`) |
| New shared component | `frontend/src/components/shared/[Name].tsx` + `.module.css` |
| New tenant component | `frontend/src/components/tenant/[Name].tsx` + `.module.css` |
| New landlord component | `frontend/src/components/landlord/[Name].tsx` + `.module.css` |
| New admin component | `frontend/src/components/admin/[Name].tsx` + `.module.css` |
| New custom hook | `frontend/src/hooks/use[Name].ts` |
| New utility function | `frontend/src/utils/[name].ts` |
| Updated DB types | `frontend/src/api/database.types.ts` (auto-generated, never edit manually) |

### Routing Rules [A-008, A-009]

- **No dynamic route segments** (`[id]`, `[slug]`) — use search params instead: `?id=xxx`, `?action=new`
- **Role-separated routes** — each role has its own URL namespace:
  - `/tenant/*` — protected by `RoleGuard allowedRoles={['tenant']}`
  - `/landlord/*` — protected by `RoleGuard allowedRoles={['landlord', 'admin']}`
  - `/admin/*` — protected by `RoleGuard allowedRoles={['admin']}`
- **Page components are thin wrappers** — they import a `RoleGuard` + a domain component
- **No conditional role rendering inside components** — each role gets its own dedicated components

---

## Frontend-Backend Communication [A-004]

### ⚠️ Client-Only Architecture

- **NO server-side code** — All communication is browser → Supabase directly
- **Frontend is static** — Served from GitHub Pages (CDN), just HTML + JS + CSS
- **No server session management** — All state persisted in browser (localStorage)
- **RLS is critical** — Database security depends entirely on RLS policies (see [Backend Guide § RLS](./BACKEND_STYLE_GUIDE.md#row-level-security-rls))

### API Contract

| Property | Value |
|----------|-------|
| Client SDK | `@supabase/supabase-js` 2.91.x |
| Protocol | REST API (PostgREST) + Auth (GoTrue) |
| Base URL (dev) | `http://127.0.0.1:54321` |
| Base URL (prod) | `https://your-project.supabase.co` |
| Auth | JWT token in `Authorization: Bearer <token>` header |
| Token storage | Browser localStorage (managed by Supabase SDK) |
| Response format | `{ data: T \| null, error: PostgrestError \| null }` |

### Communication Patterns

**1. Data Fetching (Client-Side) — see [Frontend Guide § Data Fetching](./FRONTEND_STYLE_GUIDE.md#data-fetching-patterns-f-008)**
```typescript
// Browser sends HTTP GET to Supabase PostgREST
const { data, error } = await database
  .from('table_name')
  .select('*')
  .eq('id', id);
```

**2. Authentication Flow**
```
User enters email/password in browser
  ↓
Frontend calls: database.auth.signInWithPassword({ email, password })
  ↓
Supabase Auth (GoTrue) validates credentials, returns JWT + refresh token
  ↓
Supabase SDK stores tokens in localStorage automatically
  ↓
All subsequent API calls include JWT in Authorization header (automatic)
  ↓
Supabase PostgREST extracts auth.uid() from JWT for RLS policy evaluation
  ↓
RLS policies determine which rows the user can access
```

**3. Real-Time Updates (Optional)**
```typescript
database
  .channel('table_changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'items'
  }, (payload) => {
    // Handle new/updated/deleted rows
  })
  .subscribe();
```

### Response Format & Error Handling

```typescript
// Every Supabase call returns this shape:
{ data: T | null, error: PostgrestError | null }

// Error object structure:
{
  message: string;   // Human-readable description
  code: string;      // PostgreSQL error code (e.g., '42501' for RLS denied)
  details: string;   // Additional context
  hint: string;      // Suggested fix
}
```

**Error handling strategy (cross-reference):**
- Frontend error handling: [Frontend Guide § Error Handling](./FRONTEND_STYLE_GUIDE.md#error-handling-strategy-f-003)
- Backend error codes: [Backend Guide § Common Errors](./BACKEND_STYLE_GUIDE.md#common-errors)

---

## Data Flow Examples

### User Creates an Item

```
1. Browser: User submits form
   ↓
2. Component: useAsyncFn calls database.from('items').insert(data)
   ↓
3. Browser: Sends HTTP POST to Supabase REST API
   Headers: { Authorization: "Bearer <jwt>", Content-Type: "application/json" }
   ↓
4. Supabase PostgREST: Extracts JWT, validates signature
   ↓
5. PostgreSQL: RLS INSERT policy evaluates:
   WITH CHECK (created_by = (SELECT auth.uid()))
   ↓
6. PostgreSQL: If policy passes → INSERT row → return data
   If policy fails → return error: "new row violates row-level security policy"
   ↓
7. Supabase: Returns { data: inserted_row, error: null } to browser
   ↓
8. Component: Updates local state, triggers refreshKey for list refetch
```

### User Logs In

```
1. Browser: User enters email + password
   ↓
2. Component: useAuth().login(email, password) calls
   database.auth.signInWithPassword({ email, password })
   ↓
3. Browser: HTTP POST to Supabase Auth (GoTrue) endpoint
   ↓
4. GoTrue: Validates credentials against auth.users table
   ↓
5. GoTrue: Returns { access_token, refresh_token, user }
   ↓
6. Supabase SDK: Stores tokens in localStorage automatically
   ↓
7. Hook: onAuthStateChange fires → updates auth state → UI re-renders
   ↓
8. All future API calls automatically include JWT
```

### Role Check Flow

```
1. Browser: database.from('items').select('*')
   ↓
2. Supabase: JWT → auth.uid() = 'user-123'
   ↓
3. PostgreSQL RLS evaluation:
   USING (
     is_admin()                          -- Calls helper function
     OR created_by = (SELECT auth.uid()) -- Checks ownership
   )
   ↓
4. is_admin() function:
   SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
   ↓
5. Result: Returns only rows matching policy conditions
```

---

## Security Model [A-002]

### Security Architecture

```
                    TRUST BOUNDARY
                         │
  ┌──────────────────────┼──────────────────────────┐
  │    UNTRUSTED          │         TRUSTED           │
  │    (Browser)          │         (Supabase)        │
  │                       │                           │
  │  - UI rendering       │  - JWT validation         │
  │  - UX validation      │  - RLS policy enforcement │
  │  - Permission hints   │  - auth.uid() extraction  │
  │  - localStorage       │  - Data access control    │
  │                       │  - Role verification      │
  │  ⚠️ Can be tampered   │  ✅ Cannot be bypassed    │
  └──────────────────────┼──────────────────────────┘
```

### Security Rules

| # | Rule | Enforced By |
|---|------|-------------|
| 1 | All tables have RLS enabled | PostgreSQL ([B-001](./BACKEND_STYLE_GUIDE.md#quick-reference-tldr)) |
| 2 | Users can only access their own data (unless admin) | RLS policies ([B-002](./BACKEND_STYLE_GUIDE.md#row-level-security-rls-b-001-b-002-b-003)) |
| 3 | JWT identifies the user for every request | Supabase Auth + PostgREST |
| 4 | Admin role assigned server-side only (never client) | DB trigger on signup |
| 5 | `anon` key is public and safe to expose | Limited by RLS |
| 6 | `service_role` key NEVER in frontend | Bypasses RLS — admin only |
| 7 | Client-side checks are UX hints, not security | [F-009](./FRONTEND_STYLE_GUIDE.md#quick-reference-tldr) |

### Environment Secrets

| Secret | Safe in Frontend? | Where to Store |
|--------|-------------------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | `.env.local` / `.env.production` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes (limited by RLS) | `.env.local` / `.env.production` |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ NEVER | Supabase Dashboard only |
| `SUPABASE_DB_PASSWORD` | ❌ NEVER | Supabase Dashboard only |
| `JWT_SECRET` | ❌ NEVER | Supabase config only |

---

## Type Safety Across Systems [A-006]

### Single Source of Truth: PostgreSQL Schema

```
PostgreSQL Schema (migrations)
  ↓ supabase gen types typescript --local
TypeScript Types (frontend/src/api/database.types.ts)
  ↓ imported in components/hooks
Typed Supabase Client Calls
```

### Generate & Use Types
```bash
# After any schema change, regenerate types:
supabase gen types typescript --local > frontend/src/api/database.types.ts
```

```typescript
// frontend/src/api/database.types.ts — AUTO-GENERATED, NEVER EDIT
import type { Database } from '@/api/database.types';

// Extract specific types for convenience
type Item = Database['public']['Tables']['items']['Row'];      // SELECT result
type NewItem = Database['public']['Tables']['items']['Insert']; // INSERT payload
type ItemUpdate = Database['public']['Tables']['items']['Update']; // UPDATE payload
```

**Cross-references:**
- Frontend usage: [Frontend Guide § Import Conventions](./FRONTEND_STYLE_GUIDE.md#import-conventions)
- Backend type generation: [Backend Guide § Type Safety](./BACKEND_STYLE_GUIDE.md#type-safety-typescript-integration)

---

## Environment Variables

### Frontend (.env.local / .env.production)
```bash
NEXT_PUBLIC_SUPABASE_URL=<url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<key>
```
**Rule:** All frontend vars must be `NEXT_PUBLIC_*` — embedded in static HTML at build time. See [F-010](./FRONTEND_STYLE_GUIDE.md#environment-variables-f-010).

### Backend (Supabase Dashboard / config.toml)
- JWT Secret — managed by Supabase
- Database Password — managed by Supabase
- Service Role Key — admin operations only, NEVER in frontend

---

## Deployment Architecture [A-003, A-007]

### Local Development
```bash
# Terminal 1: Backend
cd database
supabase start              # Starts PostgreSQL + Auth + PostgREST (Docker)
supabase status             # Shows local URLs and keys

# Terminal 2: Frontend
cd frontend
npm run dev                 # Next.js dev server at localhost:3000
                            # .env.local points to local Supabase (127.0.0.1:54321)
```

### Build & Deploy

**Frontend (GitHub Pages):**
```bash
cd frontend
npm run build               # SSG build → outputs to ./out/ (static HTML/JS/CSS)
# Deploy via GitHub Actions or manual push to gh-pages branch
```

**Backend (Supabase Cloud):**
```bash
supabase link --project-id <prod-id>
supabase db push            # Applies all unapplied migrations to production
```

### Environment Promotion Flow
```
Local Dev (Supabase local + Next.js dev)
  ↓ supabase db reset (test all migrations)
  ↓ npm run build (verify SSG works)
Staging (Supabase staging project + staging GitHub Pages)
  ↓ supabase db push (apply to staging)
  ↓ Verify with production-like env vars
Production (Supabase prod project + GitHub Pages)
  ↓ supabase db push (apply to prod)
  ↓ GitHub Actions deploys frontend
```

---

## Development Workflow

### Adding a New Feature (End-to-End)

```
Step 1: Database Schema
  → Create migration: database/supabase/migrations/YYYYMMDDHHMMSS_add_[feature]_schema.sql
  → Define table with RLS enabled
  → See [Backend Guide § Table Structure](./BACKEND_STYLE_GUIDE.md#table-structure-b-006)

Step 2: Indexes
  → Create migration: YYYYMMDDHHMMSS_add_[feature]_indexes.sql
  → Add indexes for filtered/sorted columns
  → See [Backend Guide § Indexes](./BACKEND_STYLE_GUIDE.md#indexes)

Step 3: RLS Policies
  → Create migration: YYYYMMDDHHMMSS_add_[feature]_policies.sql
  → ONE policy per action, consolidated with OR
  → See [Backend Guide § RLS](./BACKEND_STYLE_GUIDE.md#row-level-security-rls-b-001-b-002-b-003)

Step 4: Apply & Generate Types
  → supabase db reset (test migrations)
  → supabase gen types typescript --local > frontend/src/api/database.types.ts

Step 5: Frontend Components
  → Create component folder: frontend/src/components/[Feature]/
  → Create page wrapper: frontend/src/app/[feature]/page.tsx
  → Use useAsync/useAsyncFn for data fetching
  → See [Frontend Guide § Complete Page Template](./FRONTEND_STYLE_GUIDE.md#complete-page-template)

Step 6: Test
  → Verify RLS policies with different user roles
  → Test component loading/error/success states
  → Run: npm run build (ensure SSG works)
```

### Quick Command Reference

| Task | Command |
|------|---------|
| Start local Supabase | `supabase start` |
| Stop local Supabase | `supabase stop` |
| Reset DB (rerun all migrations) | `supabase db reset` |
| Create new migration | `supabase migration new <name>` |
| Apply pending migrations | `supabase migration up` |
| Generate TypeScript types | `supabase gen types typescript --local > frontend/src/api/database.types.ts` |
| Start frontend dev server | `cd frontend && npm run dev` |
| Build frontend for production | `cd frontend && npm run build` |
| Link to Supabase project | `supabase link --project-id <id>` |
| Push migrations to production | `supabase db push` |
| Check Supabase status | `supabase status` |

---

## Common Integration Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| 401 Unauthorized | Expired JWT or missing auth header | Re-login via `database.auth.signInWithPassword()`, check token in localStorage |
| 403 Forbidden | RLS policy denies access | Check `auth.uid()` matches, verify policy rules. See [Backend Guide § Testing](./BACKEND_STYLE_GUIDE.md#testing--debugging) |
| 404 Not Found | Table/column doesn't exist | Run migrations: `supabase db reset`, regenerate types |
| CORS Error | Frontend domain not allowed | Check Supabase Dashboard → API → CORS settings |
| Env vars undefined | `NEXT_PUBLIC_*` not set | Add to `.env.local`, restart dev server (`npm run dev`) |
| Types out of date | Schema changed, types not regenerated | Run: `supabase gen types typescript --local > frontend/src/api/database.types.ts` |
| Build fails | Server component used or dynamic feature | Ensure all interactive code uses `'use client'` directive. See [Frontend Guide § 'use client'](./FRONTEND_STYLE_GUIDE.md#use-client-directive-rule) |
| Data not loading | Supabase local not running | Run `supabase start`, verify with `supabase status` |
| Auth not persisting | Page refresh loses session | Supabase SDK handles this via localStorage — check `database.auth.getSession()` on mount. See [Frontend Guide § Auth](./FRONTEND_STYLE_GUIDE.md#authentication-flow-patterns) |

---

## Cross-Reference Index

For quick navigation between guides:

| Topic | Frontend Guide | Backend Guide |
|-------|---------------|---------------|
| Data fetching | [§ Data Fetching Patterns](./FRONTEND_STYLE_GUIDE.md#data-fetching-patterns-f-008) | — |
| Error handling | [§ Error Handling Strategy](./FRONTEND_STYLE_GUIDE.md#error-handling-strategy-f-003) | [§ Common Errors](./BACKEND_STYLE_GUIDE.md#common-errors) |
| Authentication | [§ Auth Flow Patterns](./FRONTEND_STYLE_GUIDE.md#authentication-flow-patterns) | [§ Auth Context](./BACKEND_STYLE_GUIDE.md#authentication-context) |
| RLS / Security | [§ Permission Checks (UX)](./FRONTEND_STYLE_GUIDE.md#permission-checks-ux-only--security-is-rls) | [§ RLS](./BACKEND_STYLE_GUIDE.md#row-level-security-rls-b-001-b-002-b-003) |
| Type safety | [§ Import Conventions](./FRONTEND_STYLE_GUIDE.md#import-conventions) | [§ Type Safety](./BACKEND_STYLE_GUIDE.md#type-safety-typescript-integration) |
| Component structure | [§ Component Structure](./FRONTEND_STYLE_GUIDE.md#component-structure) | — |
| Table structure | — | [§ Table Structure](./BACKEND_STYLE_GUIDE.md#table-structure-b-006) |
| Migrations | — | [§ Migrations](./BACKEND_STYLE_GUIDE.md#migrations-b-007-b-008) |
| File paths | [§ File Tree](./FRONTEND_STYLE_GUIDE.md#project-file-tree--path-conventions) | [§ File Tree](./BACKEND_STYLE_GUIDE.md#project-file-tree--path-conventions) |
| Naming | [§ Naming Conventions](./FRONTEND_STYLE_GUIDE.md#naming-conventions) | [§ Naming Conventions](./BACKEND_STYLE_GUIDE.md#naming-conventions-b-009) |
| Environment vars | [§ Env Variables](./FRONTEND_STYLE_GUIDE.md#environment-variables-f-010) | [§ Env & Secrets](./BACKEND_STYLE_GUIDE.md#environment--secrets-b-010) |
| Deployment | — | [§ Deployment](./BACKEND_STYLE_GUIDE.md#deployment) |
| Common mistakes | [§ Common Mistakes](./FRONTEND_STYLE_GUIDE.md#common-mistakes) | [§ Common Mistakes](./BACKEND_STYLE_GUIDE.md#common-mistakes) |

---

## Git Workflow Conventions

### Branch Naming
```
main                    # Production-ready code
feature/[feature-name]  # New feature development
fix/[bug-description]   # Bug fixes
db/[migration-name]     # Database schema changes
```

### Commit Message Format
```
type(scope): description

Examples:
feat(frontend): add items list page with data fetching
feat(db): add items table schema and RLS policies
fix(frontend): handle auth token expiration in useAuth hook
fix(db): consolidate duplicate SELECT policies on items table
refactor(frontend): extract ErrorBanner into reusable component
docs: update style guides with decision trees
```

**Types:** `feat`, `fix`, `refactor`, `docs`, `chore`, `test`  
**Scopes:** `frontend`, `db`, `docs`

### What Constitutes a Single PR
- **Feature PR:** Schema migration(s) + types regeneration + frontend component(s)
- **DB-only PR:** Migration(s) + types regeneration
- **Frontend-only PR:** Component(s) / hook(s) / page(s) (no schema changes)
- **Docs PR:** Style guide or documentation updates only
