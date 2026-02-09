# Backend Style Guide

**Purpose:** Rules and patterns for Supabase/PostgreSQL backend code. Guide for LLMs.  
**Tech Stack:** PostgreSQL 15 | Supabase CLI | PostgREST API | JWT Auth  
**Related:** [Frontend Style Guide](./FRONTEND_STYLE_GUIDE.md) · [System Architecture Guide](./SYSTEM_ARCHITECTURE_GUIDE.md)

---

## Quick Reference (TL;DR)

| Rule ID | Rule | Severity |
|---------|------|----------|
| B-001 | **RLS is MANDATORY** on all public tables — frontend accesses DB directly | 🔴 Critical |
| B-002 | **ONE policy per action per table** — never multiple permissive policies for same action | 🔴 Critical |
| B-003 | **`(SELECT auth.uid())`** — always wrap in subquery to force single evaluation | 🔴 Critical |
| B-004 | **`SET search_path`** on all `SECURITY DEFINER` functions | 🔴 Critical |
| B-005 | **Default deny** — RLS enabled = no access until explicit policy allows it | 🔴 Critical |
| B-006 | **UUID primary keys** — `gen_random_uuid()`, never serial/integer | 🟠 High |
| B-007 | **Idempotent migrations** — `IF NOT EXISTS`, `IF EXISTS` everywhere | 🟠 High |
| B-008 | **One concern per migration** — schema, indexes, RLS, functions in separate files | 🟠 High |
| B-009 | **snake_case** for all SQL identifiers — tables, columns, functions | 🟠 High |
| B-010 | **Never store secrets in migrations** — use env vars or Supabase Dashboard | 🔴 Critical |

---

## Project File Tree & Path Conventions

```
database/supabase/
├── config.toml                              # Supabase local config
├── migrations/                              # Ordered migration files
│   ├── 20260124000000_schema.sql            # Table definitions
│   ├── 20260124000100_indexes.sql           # Indexes
│   ├── 20260124000200_constraints.sql       # Foreign keys, constraints
│   ├── 20260124000300_functions_triggers.sql # Functions, triggers
│   ├── 20260124000400_security.sql          # RLS policies
│   ├── 20260124000500_views.sql             # Views, materialized views
│   └── 20260124000700_seed_data.sql         # Test data only
└── snippets/                                # Reusable SQL snippets (not auto-applied)
```

### File Placement Rules
- **New table** → Add to `_schema.sql` or create new migration: `YYYYMMDDHHMMSS_add_[table]_table.sql`
- **New index** → Add to `_indexes.sql` or new migration: `YYYYMMDDHHMMSS_add_[table]_indexes.sql`
- **New RLS policy** → Add to `_security.sql` or new migration: `YYYYMMDDHHMMSS_add_[table]_policies.sql`
- **New function** → Add to `_functions_triggers.sql` or new migration
- **Never mix concerns** — schema changes, RLS, and functions go in separate files

### Migration Naming: `YYYYMMDDHHMMSS_description.sql`
```
20260124000000_schema.sql              # Initial schema
20260201000000_add_projects_table.sql  # Add feature
20260201000100_add_projects_indexes.sql
20260201000200_add_projects_policies.sql
```

---

## Naming Conventions [B-009]

| Element | Convention | Example |
|---------|-----------|---------|
| Tables | `snake_case` (consistent plural or singular) | `items`, `user_roles` |
| Columns | `snake_case` lowercase | `created_at`, `is_active` |
| Primary key | `id UUID` | `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` |
| Foreign keys | `referenced_table_id` or specific name | `created_by`, `project_id` |
| Timestamps | `created_at`, `updated_at` | `TIMESTAMP DEFAULT now()` |
| Ownership | `created_by` (user reference) | `UUID REFERENCES auth.users(id)` |
| Status booleans | `is_` or `active` prefix | `is_verified`, `active` |
| Enum types | `snake_case` | `user_role`, `item_status` |
| Functions | `snake_case` verb-first | `get_user_items()`, `is_admin()` |
| Policies | `{who}_{action}_{table}` | `authenticated_users_read_items` |
| Indexes | `{table}_{column(s)}_idx` | `items_created_by_idx` |
| Triggers | `{table}_{purpose}` | `items_timestamp`, `items_audit` |

---

## Core Rules [B-001 through B-010]

### ❌ Don't Do
- Tables without RLS enabled
- Multiple permissive policies for the same action on the same table
- `auth.uid()` without subquery wrapper — always `(SELECT auth.uid())`
- `SECURITY DEFINER` functions without `SET search_path`
- Direct SQL without parameterized queries (SQL injection risk)
- Bypass RLS with service role key in frontend — NEVER
- Mix schema changes with seed data in one migration file
- Store secrets or credentials in migration files
- Use serial/integer for primary keys — always UUID
- Allow users to set their own role via `signUp({ data: { role: 'admin' }})` — roles must be assigned server-side only

### ✅ Do
- Enable RLS on every public table immediately after creation
- Consolidate all conditions for one action into ONE policy using `OR`
- Wrap `auth.uid()` in `(SELECT ...)` subquery
- Add `SET search_path = public` to all `SECURITY DEFINER` functions
- Use `IF NOT EXISTS` / `IF EXISTS` in all migrations
- Test locally with `supabase db reset` before pushing
- Regenerate frontend types after schema changes: `supabase gen types typescript`

---

## Table Structure [B-006]

### Standard Table Template
```sql
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true
);

-- ⚠️ ALWAYS enable RLS immediately after table creation [B-001]
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
```

### Decision Tree: Column Types
```
What kind of data?
├── Unique identifier → UUID PRIMARY KEY DEFAULT gen_random_uuid()
├── User reference    → UUID REFERENCES auth.users(id) ON DELETE CASCADE
├── Table reference   → UUID REFERENCES other_table(id) ON DELETE CASCADE/RESTRICT
├── Short text        → TEXT NOT NULL (with CHECK constraint if needed)
├── Long text         → TEXT (nullable)
├── Number            → INTEGER / NUMERIC(precision, scale)
├── Boolean flag      → BOOLEAN DEFAULT true/false
├── Fixed choices     → Create ENUM type or TEXT with CHECK constraint
├── Timestamp         → TIMESTAMPTZ DEFAULT now()
├── JSON data         → JSONB (prefer over JSON)
└── Soft delete       → deleted_at TIMESTAMPTZ (nullable, NULL = not deleted)
```

---

## Row Level Security (RLS) [B-001, B-002, B-003]

### ⚠️ Critical Performance Rule: One Policy Per Action

**NEVER create multiple permissive policies for the same action on the same table!**

PostgreSQL evaluates **ALL permissive policies** for each query. Multiple policies = severe performance degradation.

```sql
-- ❌ WRONG: Multiple SELECT policies (both evaluated every query!)
CREATE POLICY "admins_read" ON items FOR SELECT USING (is_admin());
CREATE POLICY "users_read_own" ON items FOR SELECT USING (created_by = auth.uid());
-- Performance: 2x slower! Both policies checked for EVERY row.

-- ✅ CORRECT: ONE SELECT policy with OR logic
CREATE POLICY "authenticated_users_read_items" ON items
    FOR SELECT
    TO authenticated
    USING (
        is_admin()
        OR
        created_by = (SELECT auth.uid())
    );
-- Performance: Optimal! Single evaluation per query.
```

**Performance Impact:**
- Multiple policies = N × evaluations per query
- `FOR ALL` includes all actions (SELECT/INSERT/UPDATE/DELETE) — creates redundancy
- Consolidating policies = 2-10x faster queries

### auth.uid() Performance Optimization [B-003]

**ALWAYS wrap auth.uid() in a subquery to force single evaluation:**

```sql
-- ❌ WRONG: Re-evaluated for EVERY row
USING (auth.uid() = created_by)
-- On 1000 rows = 1000 calls to auth.uid()

-- ✅ CORRECT: Evaluated ONCE and cached
USING ((SELECT auth.uid()) = created_by)
-- On 1000 rows = 1 call to auth.uid()
```

### Decision Tree: Which RLS Pattern to Use

```
Who accesses this table?
├── Public read, authenticated write
│   → "public_read" (USING true) + "authenticated_insert/update/delete" (owner checks)
├── Only authenticated users, owner-based
│   → One policy per action, all TO authenticated, USING created_by = (SELECT auth.uid())
├── Role-based (admin + regular users)
│   → Consolidated: USING (is_admin() OR created_by = (SELECT auth.uid()))
├── Admin-only table
│   → All policies: USING (is_admin()) / WITH CHECK (is_admin())
└── System/internal table
    → No public access — access only via SECURITY DEFINER functions
```

### Complete Policy Pattern (Recommended)

For a typical table with role-based access:

```sql
-- ============================================
-- SELECT: ONE consolidated policy for all roles
-- ============================================
CREATE POLICY "authenticated_users_read_items" ON items
    FOR SELECT
    TO authenticated
    USING (
        -- Admins see everything
        is_admin()
        OR
        -- Users see their own items
        created_by = (SELECT auth.uid())
        OR
        -- Public items visible to authenticated users
        is_public = true
    );

-- ============================================
-- INSERT: Who can create new items
-- ============================================
CREATE POLICY "authenticated_users_insert_items" ON items
    FOR INSERT
    TO authenticated
    WITH CHECK (
        -- Users can only create items owned by themselves
        created_by = (SELECT auth.uid())
    );

-- ============================================
-- UPDATE: Who can modify items
-- ============================================
CREATE POLICY "authenticated_users_update_items" ON items
    FOR UPDATE
    TO authenticated
    USING (
        -- Can only update if admin or owner
        is_admin()
        OR
        created_by = (SELECT auth.uid())
    )
    WITH CHECK (
        -- After update, must still satisfy these conditions
        is_admin()
        OR
        created_by = (SELECT auth.uid())
    );

-- ============================================
-- DELETE: Who can remove items
-- ============================================
CREATE POLICY "authenticated_users_delete_items" ON items
    FOR DELETE
    TO authenticated
    USING (
        -- Only admins or owners can delete
        is_admin()
        OR
        created_by = (SELECT auth.uid())
    );
```

### Policy Naming Convention

**Format:** `{who}_{action}_{table}`

| Pattern | Example |
|---------|---------|
| Authenticated + read | `authenticated_users_read_items` |
| Admin + delete | `admins_delete_users` |
| Public + read | `public_read_posts` |
| Owner + update | `owners_update_properties` |

### Simple Patterns

**Public read, owner write:**
```sql
CREATE POLICY "public_read_items" ON items
    FOR SELECT USING (true);

CREATE POLICY "authenticated_insert_items" ON items
    FOR INSERT
    TO authenticated
    WITH CHECK (created_by = (SELECT auth.uid()));

CREATE POLICY "owners_update_items" ON items
    FOR UPDATE
    TO authenticated
    USING (created_by = (SELECT auth.uid()))
    WITH CHECK (created_by = (SELECT auth.uid()));

CREATE POLICY "owners_delete_items" ON items
    FOR DELETE
    TO authenticated
    USING (created_by = (SELECT auth.uid()));
```

**Admin-only table:**
```sql
CREATE POLICY "admins_read_config" ON config
    FOR SELECT
    TO authenticated
    USING (is_admin());

CREATE POLICY "admins_insert_config" ON config
    FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

CREATE POLICY "admins_update_config" ON config
    FOR UPDATE
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "admins_delete_config" ON config
    FOR DELETE
    TO authenticated
    USING (is_admin());
```

---

## Helper Functions (SECURITY DEFINER) [B-004]

**All `SECURITY DEFINER` functions MUST include `SET search_path`** to prevent search path injection attacks.

### Decision Tree: When to Use SECURITY DEFINER

```
Does the function need to...
├── Read data the calling user can't access via RLS? → SECURITY DEFINER
├── Perform admin-only operations? → SECURITY DEFINER + is_admin() check
├── Just query data within the user's RLS scope? → Regular function (no DEFINER)
└── Aggregate/transform data from user's own rows? → Regular function (no DEFINER)
```

### Check if Admin
```sql
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
  );
END;
$$;
```

### Check if Owns Resource
```sql
CREATE OR REPLACE FUNCTION owns_item(item_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM items
    WHERE id = item_id AND created_by = (SELECT auth.uid())
  );
END;
$$;
```

### Simple Data Helper (No SECURITY DEFINER — respects RLS)
```sql
CREATE OR REPLACE FUNCTION get_user_items(p_user_id uuid)
RETURNS TABLE (id uuid, name text, created_at timestamptz)
LANGUAGE sql
STABLE
AS $$
  SELECT id, name, created_at
  FROM items
  WHERE created_by = p_user_id
  ORDER BY created_at DESC;
$$;
```

### Admin-Only Function
```sql
CREATE OR REPLACE FUNCTION admin_delete_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- ⚠️ Always verify admin status inside SECURITY DEFINER functions
  PERFORM 1 WHERE is_admin();
  -- If not admin, PERFORM returns no rows; we raise an exception
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;
```

---

## Migrations [B-007, B-008]

### Migration Template
```sql
-- Migration: YYYYMMDDHHMMSS_description.sql
-- Purpose: [Brief description of what this migration does]

-- Forward migration
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  active BOOLEAN DEFAULT true
);

ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Rollback (in comments for reference)
-- DROP TABLE IF EXISTS items;
```

### Safe Practices
- **Idempotent:** Use `IF NOT EXISTS`, `IF EXISTS`, `CREATE OR REPLACE`
- **No data loss:** Add columns with defaults, rename carefully
- **Test locally:** `supabase db reset` before pushing
- **One concern:** Schema changes separate from functions, RLS, etc.
- **Timestamps:** Use `TIMESTAMPTZ` (not `TIMESTAMP`) for timezone awareness

### Adding Columns Safely
```sql
-- ✅ Safe: Add column with default (no table rewrite in PG 11+)
ALTER TABLE items ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- ✅ Safe: Add nullable column
ALTER TABLE items ADD COLUMN IF NOT EXISTS description TEXT;

-- ❌ Unsafe: Add NOT NULL column without default (fails if rows exist)
ALTER TABLE items ADD COLUMN category TEXT NOT NULL;
-- Fix: Add with default first, then make NOT NULL
ALTER TABLE items ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';
ALTER TABLE items ALTER COLUMN category SET NOT NULL;
```

---

## Indexes

### Decision Tree: When to Add an Index

```
Does the column appear in...
├── WHERE clause (frequently filtered)    → B-tree index
├── JOIN condition (foreign key)          → B-tree index
├── ORDER BY (sorting)                    → B-tree index (with direction)
├── Full-text search                      → GIN index on TSVECTOR
├── JSONB queries                         → GIN index on JSONB column
└── Only in SELECT (no filter/sort/join)  → No index needed
```

### Performance Indexes
```sql
-- Frequently filtered columns
CREATE INDEX IF NOT EXISTS items_created_by_idx ON items(created_by);
CREATE INDEX IF NOT EXISTS items_active_idx ON items(active) WHERE active = true;

-- Foreign key lookups
CREATE INDEX IF NOT EXISTS items_project_id_idx ON items(project_id);

-- Sorting
CREATE INDEX IF NOT EXISTS items_created_at_idx ON items(created_at DESC);

-- Composite for common filters
CREATE INDEX IF NOT EXISTS items_user_active_idx ON items(created_by, active);
```

### Text Search
```sql
ALTER TABLE items ADD COLUMN IF NOT EXISTS search_text TSVECTOR;

CREATE INDEX IF NOT EXISTS items_search_idx ON items USING GIN(search_text);

CREATE TRIGGER items_search_update BEFORE INSERT OR UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION tsvector_update_trigger(search_text, 'pg_catalog.english', name, description);
```

---

## Triggers

### Automatic Timestamps
```sql
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply to any table with updated_at column
CREATE TRIGGER items_timestamp BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();
```

### Audit Log
```sql
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  user_id UUID REFERENCES auth.users(id),
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO audit_log (table_name, operation, user_id, old_data, new_data)
  VALUES (
    TG_TABLE_NAME,
    TG_OP,
    (SELECT auth.uid()),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD)::jsonb END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)::jsonb END
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Attach to table
CREATE TRIGGER items_audit AFTER INSERT OR UPDATE OR DELETE ON items
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger();
```

---

## Authentication Context

### User Roles Table
```sql
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- ⚠️ ONE consolidated SELECT policy [B-002]
CREATE POLICY "authenticated_users_read_roles" ON user_roles
    FOR SELECT
    TO authenticated
    USING (
        -- Users see own role, admins see all
        user_id = (SELECT auth.uid())
        OR
        is_admin()
    );

-- Only admins can modify roles
CREATE POLICY "admins_insert_roles" ON user_roles
    FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

CREATE POLICY "admins_update_roles" ON user_roles
    FOR UPDATE
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "admins_delete_roles" ON user_roles
    FOR DELETE
    TO authenticated
    USING (is_admin());
```

### ⚠️ Security Warning: Role Assignment

```sql
-- ❌ WRONG: Never let users self-assign roles via signUp metadata!
-- Frontend: database.auth.signUp({ data: { role: 'admin' } })
-- This is a SECURITY VULNERABILITY — users could make themselves admin.

-- ✅ CORRECT: Assign roles server-side only
-- Option 1: Database trigger on new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Option 2: Admin manually assigns roles via admin panel
-- (Uses RLS policy: only admins can INSERT/UPDATE user_roles)
```

---

## Common Patterns

### Soft Delete
```sql
ALTER TABLE items ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Include in RLS: exclude deleted records
CREATE POLICY "authenticated_users_read_items" ON items
    FOR SELECT
    TO authenticated
    USING (
        deleted_at IS NULL
        AND (
            is_admin()
            OR created_by = (SELECT auth.uid())
        )
    );

-- Soft delete function
CREATE OR REPLACE FUNCTION soft_delete_item(item_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE items
  SET deleted_at = now()
  WHERE id = item_id AND created_by = (SELECT auth.uid());
$$;
```

### Enum Types
```sql
CREATE TYPE user_role AS ENUM ('user', 'admin', 'moderator');

-- Use in table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'user'
);
```

### Cascade vs Restrict
```sql
-- CASCADE: When parent deleted, children auto-deleted
-- Use for: child data that makes no sense without parent
project_id UUID REFERENCES projects(id) ON DELETE CASCADE

-- RESTRICT: Prevent parent deletion if children exist
-- Use for: important data that shouldn't be silently removed
category_id UUID REFERENCES categories(id) ON DELETE RESTRICT

-- SET NULL: Set FK to NULL when parent deleted
-- Use for: optional relationships
assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL
```

---

## Type Safety (TypeScript Integration)

### Generate Types
```bash
# Run from project root — outputs to frontend
supabase gen types typescript --local > frontend/src/api/database.types.ts
```

### Use in Frontend (see [Frontend Guide § Data Fetching](./FRONTEND_STYLE_GUIDE.md#data-fetching-patterns-f-008))
```typescript
import { database } from '@/api/database';
import type { Database } from '@/api/database.types';

type Item = Database['public']['Tables']['items']['Row'];
type NewItem = Database['public']['Tables']['items']['Insert'];

// Typed fetch
const { data } = await database
  .from('items')
  .select('*')
  .returns<Item[]>();

// Typed insert
const { data } = await database
  .from('items')
  .insert({ name: 'Item', created_by: userId } satisfies NewItem)
  .select()
  .returns<Item>();
```

**Rule:** Regenerate types after every schema change: `supabase gen types typescript --local`

---

## Environment & Secrets [B-010]

### Local Development (database/supabase/config.toml)
```toml
[api]
enabled = true
port = 54321

[db]
port = 5432

[auth]
enable_signup = true
enable_email_confirmations = false
```

### Secrets Management
```bash
# Local: .env.supabase (never committed)
SUPABASE_DB_PASSWORD=dev_password
JWT_SECRET=dev_secret_key

# Production: Set via Supabase Dashboard only
# Never commit production keys
# Use GitHub Actions secrets for CI/CD
```

### Key Types & Security
| Key | Where | Access Level |
|-----|-------|-------------|
| `anon` key | Frontend (public) | Limited by RLS — safe to expose |
| `service_role` key | Server/admin only | Bypasses RLS — NEVER in frontend |
| Database password | Supabase Dashboard | Direct DB access — NEVER in frontend |
| JWT secret | Supabase config | Token signing — NEVER in frontend |

---

## Testing & Debugging

### Test RLS Policies
```sql
-- Check what policies exist on a table
SELECT * FROM pg_policies WHERE tablename = 'items';

-- Test as specific user (local dev only)
SET request.jwt.claims = '{"sub": "user-uuid-here"}';
SELECT * FROM items; -- Should only return rows allowed by RLS
RESET request.jwt.claims;
```

### View Query Performance
```sql
EXPLAIN ANALYZE
SELECT * FROM items WHERE created_by = (SELECT auth.uid());
-- Look for: Seq Scan vs Index Scan, row estimates vs actual
```

### Verify RLS Is Enabled
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
-- rowsecurity = true means RLS is enabled
```

### Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `new row violates row-level security policy` | RLS policy denies INSERT | Check `WITH CHECK` in INSERT policy |
| `permission denied for schema public` | User lacks schema access | Grant via Supabase Dashboard |
| `function does not exist` | Function name/args mismatch | Check function signature, recreate |
| `table does not exist` | Migration not applied | Run migrations: `supabase db reset` |
| `permission denied for table` | RLS blocking or missing GRANT | Verify RLS policies, check `TO` role |
| `could not serialize access` | Concurrent transaction conflict | Retry the operation |

---

## Deployment

### Local Development
```bash
supabase start              # Start local Supabase (Docker required)
supabase status             # Check status & connection details
supabase db reset           # Reset DB, re-run all migrations
```

### Push to Production
```bash
supabase link --project-id <prod-id>
supabase db push            # Push migrations to prod
# Or manual SQL in Supabase Dashboard
```

### Verify Deployment
```sql
-- Check migrations applied
SELECT * FROM supabase_migrations.schema_migrations;

-- Verify RLS enabled on all tables
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Test a policy
SELECT * FROM items; -- Should enforce RLS
```

---

## Pre-Deployment Checklist

- [ ] **RLS enabled on ALL public tables** [B-001]
- [ ] **ONE policy per action per table** — no duplicate permissive policies [B-002]
- [ ] **`(SELECT auth.uid())`** used everywhere (not bare `auth.uid()`) [B-003]
- [ ] **`SET search_path`** on all `SECURITY DEFINER` functions [B-004]
- [ ] All migrations use `IF NOT EXISTS` / `IF EXISTS` [B-007]
- [ ] No hardcoded credentials in migrations [B-010]
- [ ] Indexes created for common query patterns
- [ ] Foreign keys have CASCADE/RESTRICT/SET NULL as appropriate
- [ ] New user trigger creates default role (never client-assigned)
- [ ] Database types regenerated: `supabase gen types typescript --local`
- [ ] Migration tested locally: `supabase db reset` succeeds
- [ ] RLS policies tested with different user roles

---

## Common Mistakes

| # | Mistake | Fix |
|---|---------|-----|
| 1 | Multiple SELECT policies on same table | Consolidate into ONE policy with `OR` logic [B-002] |
| 2 | Bare `auth.uid()` in policies | Always wrap: `(SELECT auth.uid())` [B-003] |
| 3 | Missing `SET search_path` on SECURITY DEFINER | Add `SET search_path = public` to every DEFINER function [B-004] |
| 4 | Letting users self-assign roles via signUp metadata | Use database trigger to assign default role |
| 5 | Using `TIMESTAMP` instead of `TIMESTAMPTZ` | Always use `TIMESTAMPTZ` for timezone awareness |
| 6 | Mixing schema + RLS + functions in one migration | Separate concerns into different migration files [B-008] |
| 7 | Using `FOR ALL` in policies | Split into explicit `FOR SELECT`, `FOR INSERT`, etc. |
| 8 | Forgetting to enable RLS after CREATE TABLE | Always `ALTER TABLE x ENABLE ROW LEVEL SECURITY` immediately |
| 9 | Service role key in frontend code | NEVER — frontend uses anon key only, security via RLS |
| 10 | Non-idempotent migrations (fail on re-run) | Use `IF NOT EXISTS`, `CREATE OR REPLACE`, `IF EXISTS` |
