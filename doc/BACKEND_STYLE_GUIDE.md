# Backend Style Guide

**Purpose:** Rules and patterns for Supabase/PostgreSQL backend code. Guide for LLMs.

---

## Core Rules

### Database Principles (Client-Side Access)
- **RLS is MANDATORY** - All tables must have RLS enabled (frontend accesses directly)
- **Type safety** - Use TypeScript for database helpers
- **Migrations** - One file per logical change
- **Immutability** - Don't modify data in place, use SQL operations
- **Security** - Default deny, explicit allow in policies
- **Client-Side API** - Frontend accesses via Supabase SDK → RLS policies enforce access

### ❌ Don't Do
- Direct SQL without parameterized queries (SQL injection)
- Bypass RLS with service role in frontend
- Mutations outside of transactions (when applicable)
- Store secrets in migration files
- Mix schema changes with seed data in one file

### ✅ Do
- Parameterized queries (always)
- RLS policies for all access
- Helper functions with `SECURITY DEFINER`
- Clear naming: `table_name`, `created_by`, `created_at`
- Idempotent migrations (safe to re-run)

---

## Table Structure

### Standard Columns
```sql
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
```

### Naming Conventions
- **Tables:** `snake_case` singular or plural (consistent)
- **Columns:** `snake_case` lowercase
- **Primary key:** `id UUID` (not serial)
- **Foreign keys:** `table_name_id` or specific name
- **Timestamps:** `created_at`, `updated_at`
- **Ownership:** `created_by` (user reference)
- **Status:** `active`, `is_verified`, `status` (enum)

---

## Row Level Security (RLS)

### Enable RLS
```sql
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Default deny all (explicit allow in policies)
DROP POLICY IF EXISTS "default_deny" ON items;
CREATE POLICY "default_deny" ON items
  FOR ALL USING (false);
```

### Basic Policies

**Users see own data:**
```sql
CREATE POLICY "users_see_own" ON items
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "users_create" ON items
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "users_update_own" ON items
  FOR UPDATE USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "users_delete_own" ON items
  FOR DELETE USING (created_by = auth.uid());
```

**Admins see all:**
```sql
CREATE POLICY "admins_all" ON items
  FOR ALL USING (is_admin());
```

**Public read, authenticated write:**
```sql
CREATE POLICY "public_read" ON items
  FOR SELECT USING (true);

CREATE POLICY "auth_write" ON items
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
```

### Helper Functions (SECURITY DEFINER)

**Check if admin:**
```sql
CREATE FUNCTION is_admin() RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$;
```

**Check if owns resource:**
```sql
CREATE FUNCTION owns_item(item_id uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM items 
    WHERE id = item_id AND created_by = auth.uid()
  );
END;
$$;
```

**Use in policies:**
```sql
CREATE POLICY "users_or_admin" ON items
  FOR ALL USING (
    created_by = auth.uid() OR is_admin()
  );
```

---

## Migrations

### Structure
```
database/supabase/migrations/
├── 20260124000000_schema.sql          # Table definitions
├── 20260124000100_indexes.sql         # Indexes
├── 20260124000200_constraints.sql     # ForeignKeys, constraints
├── 20260124000300_functions_triggers.sql  # Functions, triggers
├── 20260124000400_security.sql        # RLS policies
├── 20260124000500_views.sql           # Views, materialized views
└── 20260124000700_seed_data.sql       # Test data only
```

### Migration Template
```sql
-- Create table
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT now(),
  name TEXT NOT NULL,
  active BOOLEAN DEFAULT true
);

-- Rollback (in comments for reference)
-- DROP TABLE IF EXISTS items;
```

### Naming: `YYYYMMDDHHMMSS_description.sql`
```
20260124000000_schema.sql          # First migration
20260124000001_add_items_table.sql # Add new feature
20260124000002_add_status_column.sql  # Schema change
```

### Safe Practices
- **Idempotent:** Use `IF NOT EXISTS`, `IF EXISTS`
- **No data loss:** Add columns with defaults, rename carefully
- **Test locally:** `supabase db reset` before pushing
- **One concern:** Schema changes separate from functions, RLS, etc.

---

## Indexes

### Performance Indexes
```sql
-- Frequently filtered columns
CREATE INDEX items_created_by_idx ON items(created_by);
CREATE INDEX items_active_idx ON items(active) WHERE active = true;

-- Foreign key lookups
CREATE INDEX items_user_id_idx ON items(user_id);

-- Sorting
CREATE INDEX items_created_at_idx ON items(created_at DESC);

-- Composite for common filters
CREATE INDEX items_user_active_idx ON items(created_by, active);
```

### Text Search
```sql
ALTER TABLE items ADD COLUMN search_text TSVECTOR;

CREATE INDEX items_search_idx ON items USING GIN(search_text);

-- Update search vector on insert/update
CREATE TRIGGER items_search_update BEFORE INSERT OR UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION tsvector_update_trigger(search_text, 'pg_catalog.english', name, description);
```

---

## Database Functions

### Simple Helper
```sql
CREATE OR REPLACE FUNCTION get_user_items(p_user_id uuid)
RETURNS TABLE (id uuid, name text, created_at timestamp)
LANGUAGE sql
STABLE
AS $$
  SELECT id, name, created_at
  FROM items
  WHERE created_by = p_user_id
  ORDER BY created_at DESC;
$$;

-- Called from frontend
SELECT * FROM get_user_items('user-id');
```

### Admin-Only Function (SECURITY DEFINER)
```sql
CREATE OR REPLACE FUNCTION admin_delete_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;
```

### Trigger for Timestamps
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

CREATE TRIGGER items_timestamp BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();
```

---

## Authentication Context

### User Roles Table
```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user', -- 'user', 'admin', etc.
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Users see own role, admins see all
CREATE POLICY "users_see_own_role" ON user_roles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "admins_see_all_roles" ON user_roles
  FOR SELECT USING (is_admin());
```

### Auth Metadata
```sql
-- Store custom claims in auth.users metadata
-- Frontend calls: database.auth.signUp({ 
--   email, 
--   password, 
--   options: { data: { role: 'admin' } } 
-- })

-- Then fetch role from user_roles table
SELECT role FROM user_roles WHERE user_id = auth.uid();
```

---

## Common Patterns

### Soft Delete
```sql
-- Add soft delete column
ALTER TABLE items ADD COLUMN deleted_at TIMESTAMP;

-- RLS: exclude deleted records
CREATE POLICY "exclude_deleted" ON items
  FOR SELECT USING (deleted_at IS NULL);

-- Soft delete function
CREATE OR REPLACE FUNCTION soft_delete_item(item_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE items SET deleted_at = now() WHERE id = item_id AND created_by = auth.uid();
$$;
```

### Audit Log
```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  user_id UUID REFERENCES auth.users(id),
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP DEFAULT now()
);

CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (table_name, operation, user_id, old_data)
    VALUES (TG_TABLE_NAME, TG_OP, auth.uid(), row_to_json(OLD));
    RETURN OLD;
  END IF;
  
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (table_name, operation, user_id, new_data)
    VALUES (TG_TABLE_NAME, TG_OP, auth.uid(), row_to_json(NEW));
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (table_name, operation, user_id, old_data, new_data)
    VALUES (TG_TABLE_NAME, TG_OP, auth.uid(), row_to_json(OLD), row_to_json(NEW));
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Attach to table
CREATE TRIGGER items_audit AFTER INSERT OR UPDATE OR DELETE ON items
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger();
```

### Cascade Deletes
```sql
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  -- When project deleted, items auto-deleted
  ...
);
```

### Enum Types
```sql
CREATE TYPE user_role AS ENUM ('user', 'admin', 'moderator');

CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role user_role NOT NULL DEFAULT 'user'
);
```

---

## Type Safety (TypeScript Helpers)

### Generate Types
```bash
supabase gen types typescript --local > src/api/database.types.ts
```

### Use in Frontend
```typescript
import { Database } from '@/api/database.types';

// Typed fetch
const { data } = await database
  .from('items')
  .select('*')
  .returns<Database['public']['Tables']['items']['Row'][]>();

// Typed insert
const { data } = await database
  .from('items')
  .insert({ name: 'Item', created_by: userId })
  .select()
  .returns<Database['public']['Tables']['items']['Row']>();
```

---

## Environment & Secrets

### Supabase CLI Config (database/supabase/config.toml)
```toml
[api]
enabled = true
port = 54321

[db]
port = 5432
shadow_database_url = "postgresql://..."

[auth]
enable_signup = true
enable_email_confirmations = false
```

### Secrets Management
```bash
# Local secrets in .env.supabase
SUPABASE_DB_PASSWORD=dev_password
JWT_SECRET=dev_secret_key

# Production (Supabase Dashboard)
- Set via UI
- Never commit production keys
- Use GitHub Actions secrets for CI/CD
```

---

## Testing & Debugging

### Test Auth Context
```sql
-- Switch auth user for testing
SELECT auth.uid(); -- Returns current user ID

-- Simulate specific user
SELECT set_config('request.jwt.claims', json_object('sub', 'user-uuid')::text, false);
SELECT auth.uid(); -- Returns simulated user
```

### Test RLS Policies
```sql
-- Enable row-level security
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Verify policy (should block access)
SELECT * FROM items; -- As user1
SELECT * FROM items; -- As user2 (blocked)

-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'items';
```

### View Query Execution
```sql
EXPLAIN ANALYZE
SELECT * FROM items WHERE created_by = auth.uid();
```

### Common Errors
| Error | Cause | Fix |
|-------|-------|-----|
| `new row violates row-level security policy` | RLS policy denies INSERT | Check WITH CHECK in policy |
| `permission denied for schema public` | User lacks schema access | Grant via Supabase Dashboard |
| `function does not exist` | Function name/args mismatch | Check function signature, recreate |
| `table does not exist` | Migration not applied | Run migrations, check status |

---

## Deployment

### Local Development
```bash
supabase start              # Start local Supabase
supabase status             # Check status
supabase db reset           # Reset DB (lose data)
```

### Push to Production
```bash
supabase link --project-id <prod-id>
supabase db push            # Push migrations to prod
# Or manual SQL in Supabase Dashboard
```

### Verify Deployment
```bash
# Check migrations applied
SELECT * FROM _supabase_migrations;

# Test RLS policies
SELECT * FROM items; -- Should enforce RLS
```

### Rollback
```bash
# Reset to previous state
supabase db reset

# Or manual restoration from backup
# Use Supabase Dashboard backups
```

---

## Pre-Deployment Checklist

- [ ] **RLS enabled on ALL public tables** (frontend accesses directly)
- [ ] **RLS policies tested with different users/roles**
- [ ] **Test RLS with anon key** (what frontend uses)
- [ ] All migrations have `IF NOT EXISTS` / `IF EXISTS`
- [ ] No hardcoded credentials in migrations
- [ ] Indexes created for common queries
- [ ] Foreign keys have CASCADE/RESTRICT as needed
- [ ] Audit logs or soft deletes for sensitive tables
- [ ] Authentication helpers (`is_admin()`, `owns_item()`) implemented
- [ ] Database types regenerated: `supabase gen types typescript`
- [ ] Migration tested locally: `supabase db reset` works
- [ ] **Security advisor run**: `curl https://api.supabase.com/v1/projects/{ref}/advisors/security`
- [ ] **NO server-side code needed** - RLS policies handle all access control
