# System Architecture Guide

**Purpose:** Cross-system overview — how frontend and backend connect. Guide for LLMs.  
**Tech Stack:** Next.js 16.1.4 | React 19.2.3 | TypeScript 5.x | Supabase (PostgreSQL 15 + PostgREST + JWT Auth) | react-use 17.6.x  
**Related:** [Frontend Style Guide](./FRONTEND_STYLE_GUIDE.md) · [Backend Style Guide](./BACKEND_STYLE_GUIDE.md)

> **This guide covers only cross-system concerns.** For frontend rules see the [Frontend Style Guide](./FRONTEND_STYLE_GUIDE.md). For backend/database rules see the [Backend Style Guide](./BACKEND_STYLE_GUIDE.md).

---

## 1. System Components

```
┌──────────────────────────────────────────────────────────────┐
│  FRONTEND (Next.js 16.1.4 + React 19.2.3 — CLIENT-ONLY)     │
│  - Static Site Generation (SSG) with Full Client Rendering   │
│  - NO Server Components or Server-Side Logic                 │
│  - Deployment: GitHub Pages (Static Export)                  │
│  Rules → Frontend Style Guide                                │
└────────────────────┬─────────────────────────────────────────┘
                     │ (REST API via Supabase Client SDK)
                     │ (Browser → Supabase, No Server Involved)
                     │
┌────────────────────▼─────────────────────────────────────────┐
│  BACKEND (Supabase Cloud / Local)                            │
│  - PostgreSQL Database with Row Level Security (RLS)         │
│  - Authentication (JWT-based via GoTrue)                     │
│  - REST API via PostgREST (auto-generated from schema)       │
│  Rules → Backend Style Guide                                 │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. API Contract & Communication Patterns

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

### Authentication Flow

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

### Response Format

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

---

## 3. Data Flow Examples

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

## 4. Security Trust Boundary

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

| Secret | Safe in Frontend? | Where to Store |
|--------|-------------------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | `.env.local` / `.env.production` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes (limited by RLS) | `.env.local` / `.env.production` |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ NEVER | Supabase Dashboard only |
| `SUPABASE_DB_PASSWORD` | ❌ NEVER | Supabase Dashboard only |
| `JWT_SECRET` | ❌ NEVER | Supabase config only |

For detailed security rules see [Backend Style Guide § RLS](./BACKEND_STYLE_GUIDE.md#row-level-security-rls-b-001-b-002-b-003). For frontend UX-only security see [Frontend Framework Guide § Security Model](./FRONTEND_STYLE_GUIDE_FRAMEWORK.md#39-security-model).

---

## 5. Deployment & Environment Promotion

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

```bash
# Frontend (GitHub Pages)
cd frontend
npm run build               # SSG build → outputs to ./out/ (static HTML/JS/CSS)

# Backend (Supabase Cloud)
supabase link --project-id <prod-id>
supabase db push            # Applies all unapplied migrations to production
```

### Type Regeneration After Schema Changes

```
PostgreSQL Schema (migrations)
  ↓ supabase gen types typescript --local > frontend/src/api/database.types.ts
TypeScript Types (frontend/src/api/database.types.ts)
  ↓ imported in components/hooks
Typed Supabase Client Calls
```

---

## 6. Common Integration Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| 401 Unauthorized | Expired JWT or missing auth header | Re-login via `database.auth.signInWithPassword()`, check token in localStorage |
| 403 Forbidden | RLS policy denies access | Check `auth.uid()` matches, verify policy rules. See [Backend Guide § Testing](./BACKEND_STYLE_GUIDE.md#testing--debugging) |
| 404 Not Found | Table/column doesn't exist | Run migrations: `supabase db reset`, regenerate types |
| CORS Error | Frontend domain not allowed | Check Supabase Dashboard → API → CORS settings |
| Env vars undefined | `NEXT_PUBLIC_*` not set | Add to `.env.local`, restart dev server (`npm run dev`) |
| Types out of date | Schema changed, types not regenerated | Run: `supabase gen types typescript --local > frontend/src/api/database.types.ts` |
| Build fails | Server component used or dynamic feature | Ensure all interactive code uses `'use client'` directive. See [Frontend Framework Guide § 'use client'](./FRONTEND_STYLE_GUIDE_FRAMEWORK.md#32-use-client-directive) |
| Data not loading | Supabase local not running | Run `supabase start`, verify with `supabase status` |
| Auth not persisting | Page refresh loses session | Supabase SDK handles this via localStorage — check `database.auth.getSession()` on mount. See [Frontend Library Guide § Auth](./FRONTEND_STYLE_GUIDE_LIBRARY.md#27-auth-hook-pattern) |

---

## 7. Git Workflow Conventions

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

---

## 8. Cross-Reference Index

| Topic | Guide |
|-------|-------|
| TypeScript rules | [Frontend Language Guide](./FRONTEND_STYLE_GUIDE_LANGUAGE.md) |
| React & Supabase patterns | [Frontend Library Guide](./FRONTEND_STYLE_GUIDE_LIBRARY.md) |
| Next.js, routing, styling | [Frontend Framework Guide](./FRONTEND_STYLE_GUIDE_FRAMEWORK.md) |
| Component stratification (View*/Form*/Many*) | [Frontend Project Guide](./FRONTEND_STYLE_GUIDE_PROJECT.md) |
| Database schema, RLS, migrations | [Backend Style Guide](./BACKEND_STYLE_GUIDE.md) |
| Adding a new entity (checklist) | [Frontend Project Guide § 4.10](./FRONTEND_STYLE_GUIDE_PROJECT.md#410-adding-a-new-entity-checklist) |
| File structure (frontend) | [Frontend Framework Guide § 3.10](./FRONTEND_STYLE_GUIDE_FRAMEWORK.md#310-file-structure) |
| File structure (backend) | [Backend Style Guide § File Tree](./BACKEND_STYLE_GUIDE.md#project-file-tree--path-conventions) |
| Error handling (frontend) | [Frontend Library Guide § 2.5](./FRONTEND_STYLE_GUIDE_LIBRARY.md#25-error-handling-in-components) |
| Error handling (backend) | [Backend Style Guide § Common Errors](./BACKEND_STYLE_GUIDE.md#common-errors) |
| Naming conventions (frontend) | [Frontend Language Guide § 1.6](./FRONTEND_STYLE_GUIDE_LANGUAGE.md#16-naming-conventions) |
| Naming conventions (backend) | [Backend Style Guide § Naming](./BACKEND_STYLE_GUIDE.md#naming-conventions-b-009) |
