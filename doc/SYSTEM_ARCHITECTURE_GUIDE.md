# System Architecture Guide

**Purpose:** Guide for LLMs generating code for this full-stack web application.

---

## System Components

```
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND (Next.js 16 + React 19 - CLIENT-ONLY)              │
│ - Static Site Generation (SSG) with Full Client Rendering   │
│ - NO Server Components or Server-Side Logic                 │
│ - App Router, TypeScript, CSS Modules                       │
│ - All auth/state managed client-side via localStorage       │
│ - Deployment: GitHub Pages (Static Export)                  │
└───────────────────┬─────────────────────────────────────────┘
                    │ (REST API via Supabase Client)
                    │ (Client → Supabase, No Server)
                    │
┌───────────────────▼─────────────────────────────────────────┐
│ BACKEND (Supabase)                                          │
│ - PostgreSQL Database with Row Level Security (RLS)         │
│ - Authentication (JWT-based)                                │
│ - Real-time Data via PostgREST API                          │
│ - Deployment: Supabase Cloud                                │
└─────────────────────────────────────────────────────────────┘
```

---

## Frontend-Backend Communication (Sub-System Integration)

### ⚠️ Client-Only Architecture Note
- **NO server-side code** - All communication is browser → Supabase directly
- **Frontend is static** - Served from GitHub Pages (CDN)
- **No server session management** - All state persisted in browser (localStorage)
- **RLS is critical** - Database security depends entirely on RLS policies

### API Contract
- **Client:** Supabase TypeScript SDK (`@supabase/supabase-js`)
- **Protocol:** REST API (PostgREST) + Authentication (JWT)
- **Base URL:** 
  - Dev: `http://127.0.0.1:54321` (local Supabase)
  - Prod: `https://your-project.supabase.co`
- **Auth:** JWT token in `Authorization: Bearer <token>` header
- **Token Storage:** localStorage (browser-side only, never sent to any server)

### Communication Patterns

**1. Data Fetching (Client-Side)**
```typescript
// Frontend calls Supabase directly
const { data, error } = await database
  .from('table_name')
  .select('*')
  .eq('id', id);
```

**2. Authentication Flow**
```
Frontend Login → Supabase Auth → JWT Token → Stored in Session
↓
All subsequent requests include JWT in Authorization header
↓
Backend RLS Policies verify auth.uid() for row-level access
```

**3. Real-Time Updates**
```typescript
// Frontend subscribes to table changes
database
  .channel('table_changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, (payload) => {
    // Handle new/updated/deleted rows
  })
  .subscribe();
```

### Error Handling Contract
```typescript
// Supabase response format
{ data: T | null, error: Error | null }

// Frontend handles:
error.message // String description
error.code    // PostgreSQL error code (if applicable)
```

---

## Environment Variables

### Frontend (.env.local / .env.production)
```
NEXT_PUBLIC_SUPABASE_URL=<url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<key>
```
**Rule:** All frontend vars must be `NEXT_PUBLIC_*` (embedded in HTML)

### Backend (Supabase Dashboard)
- JWT Secret
- Database Password
- Service Role Key (for admin operations)

---

## Deployment Methods

### Local Development
1. **Supabase Local:** `supabase start` (Docker required)
   - Database runs on `localhost:54321`
   - Auth enabled with test JWT tokens
   - API accessible via PostgREST

2. **Frontend Local:** `npm run dev` (Next.js dev server)
   - `.env.local` points to local Supabase
   - Hot reload enabled

### Staging/Production

**Frontend Deployment (GitHub Pages)**
```bash
npm run build              # SSG build
# Output: ./out/ (static HTML)
# Deploy via GitHub Actions or manual push to gh-pages branch
```

**Backend Deployment (Supabase Cloud)**
```bash
supabase link --project-id <prod-id>
supabase db push          # Deploy migrations to production
# Or manual SQL execution in Supabase Dashboard
```

### Environment Promotion Flow
```
Local Dev (Supabase local) 
  ↓ (migrations tested)
Staging (Supabase staging project)
  ↓ (verified with prod env vars in test)
Production (Supabase prod project + GitHub Pages)
```

---

## Data Flow Example: User Creates Item

```
1. Frontend (Browser): User submits form
   ↓
2. Frontend: useAsyncFn calls database.from('items').insert(data)
   ↓
3. Browser sends HTTP POST to Supabase API with JWT header
   ↓
4. Supabase API: Validates JWT from Authorization header
   ↓
5. Supabase: RLS policy checks auth.uid() == data.created_by
   ↓
6. Supabase: Insert into PostgreSQL
   ↓
7. Supabase: Returns { data: inserted_row, error: null } to browser
   ↓
8. Frontend: Updates local state, shows success toast
   
⚠️ CRITICAL: No server process involved. Security depends entirely on:
   - RLS policies (enforced by Supabase)
   - JWT validation (enforced by Supabase)
   - Client-side business logic (for UX only, NOT security)
```

---

## Security Model

### RLS (Row Level Security)
- **All tables** must have RLS enabled
- **Policies** define who can read/write/delete rows
- **Backend enforces** data access at database level (not app level)
- **JWT token** identifies user via `auth.uid()`

### Example RLS Policy
```sql
-- Users see only their own data
CREATE POLICY "user_data_select" ON user_data
    FOR SELECT USING (user_id = auth.uid());

-- Admins see everything
CREATE POLICY "admin_see_all" ON user_data
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ));
```

### Environment Secrets
- Never commit `.env.local` or API keys
- Use `.env.production` for GitHub Actions secrets
- Supabase anon key is **public** (limited by RLS)
- Service role key is **private** (admin access, never in frontend)

---

## Type Safety Across Systems

### Generate Backend Types
```bash
# In frontend directory
supabase gen types typescript --local > src/api/database.types.ts
```

This creates TypeScript types matching PostgreSQL schema:
```typescript
import { Database } from '@/api/database.types';

// Typed query
const result = await database
  .from('items')
  .select('*')
  .returns<Database['public']['Tables']['items']['Row'][]>();
```

---

## Development Workflow

1. **Start local environment:**
   ```bash
   supabase start              # Backend
   cd frontend && npm run dev  # Frontend (separate terminal)
   ```

2. **Make schema changes:**
   ```bash
   supabase migration new add_new_table
   # Edit migration file in database/supabase/migrations/
   supabase migration up       # Apply locally
   ```

3. **Regenerate types:**
   ```bash
   supabase gen types typescript --local > frontend/src/api/database.types.ts
   ```

4. **Deploy:**
   ```bash
   supabase db push            # Backend to staging/prod
   npm run build && deploy     # Frontend to GitHub Pages
   ```

---

## Common Integration Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| 401 Unauthorized | Expired JWT or missing auth header | Re-login, check token in localStorage |
| 403 Forbidden | RLS policy denies access | Check user_id matches, verify policy rules |
| 404 Not Found | Table/column doesn't exist | Run migrations, regenerate types |
| CORS Error | Frontend domain not allowed | Check Supabase CORS settings |
| Env vars undefined | `NEXT_PUBLIC_*` not set | Add to `.env.local`, restart dev server |

