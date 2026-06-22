# Backend — Supabase

> **Audience:** LLM agents working on the backend.
> Covers: database, auth, RLS, storage, edge functions, and CLI workflows.

## Architecture

Supabase Cloud provides:
- **PostgreSQL** — database exposed via PostgREST (auto-generated REST API)
- **Auth** — JWT-based, with session management
- **Storage** — S3-compatible file buckets with CDN
- **Realtime** — WebSocket subscriptions for live data
- **Edge Functions** — Deno runtime for server-side logic

## Project Structure

```
backend/
└── supabase/
    ├── config.toml              # local dev config (ports, features, auth settings)
    └── migrations/              # ordered SQL files (schema, indexes, RLS, seeds)
```

## CLI Workflow

Always discover commands via `--help` — the CLI changes between versions.

```bash
supabase start                # start local stack
supabase stop                 # stop local stack
supabase db reset             # reset DB, re-run migrations + seed
supabase db diff --linked --file <name>  # generate migration from local→linked remote diff
supabase db pull <name> --local --yes    # generate migration from local DB state
supabase db lint              # check migrations for errors
supabase gen types typescript --local > ../../frontend/src/backendConnector/__generated__/database.types.ts
supabase migration new <name>  # create empty migration file (always use this — never invent filename)
supabase functions new <name>  # create new edge function
supabase functions deploy <name>
```

## Database

**Schema changes:**
- Iterate with `execute_sql` (MCP) or `supabase db query` (CLI) — no migration history entry
- When done, generate a clean migration: `supabase db pull <name> --local --yes`
- Run `supabase db advisors` to check for security issues

**ENUM types:**
- Use real Postgres ENUMs (`CREATE TYPE ... AS ENUM (...)`), not `text` columns with `CHECK` constraints
- `supabase gen types` auto-detects ENUMs — the `Enums` section of the generated types and `Constants.public.Enums` runtime arrays are populated automatically
- No need to hand-duplicate enum values in the frontend

**Row Level Security (RLS):**
- Enable RLS on every table in exposed schemas (including `public`)
- **Never use `auth.role()`** — deprecated. Use `TO authenticated` or `TO anon` on the policy instead.
- `TO authenticated` is authentication, not authorization. Always add a `USING` clause with an ownership check.
- UPDATE policies need both `USING` and `WITH CHECK` clauses.
- Views bypass RLS by default — use `WITH (security_invoker = true)` in PostgreSQL 15+.

**Function security:**
- Prefer `SECURITY INVOKER`. Use `SECURITY DEFINER` only when absolutely necessary — it bypasses RLS.
- `SECURITY DEFINER` functions in `public` schema are callable by all roles.
- If `SECURITY DEFINER` is needed, keep it in a non-exposed schema, always include an `auth.uid()` check.

**Type generation:**
```bash
supabase gen types typescript --local > ../../frontend/src/backendConnector/__generated__/database.types.ts
```

The generated file lives in `frontend/src/backendConnector/__generated__/database.types.ts` — **never edit it manually**. It is rebuilt from scratch on every `make dev`. It is:
- Located in `backendConnector/` (infrastructure — never changes during development)
- Ignored by ESLint
- Marked `linguist-generated=true` in `.gitattributes` (diffs collapsed on GitHub)

Import pattern in consumer code:
```typescript
import type { Tables, TablesInsert, Enums } from '@/backendConnector';
import { Constants } from '@/backendConnector';

// Row type
type PropertyRow = Tables<'properties'>;

// Insert type
type PropertyInsert = TablesInsert<'properties'>;

// Enum type (for narrowing form string values)
type PropertyType = Enums<'property_type'>;

// Runtime enum array (for <option> rendering)
Constants.public.Enums.property_type // readonly ["apartment", "house", "commercial", "room"]
```

The `@/backendConnector` path alias resolves to `backendConnector/` — consumers don't need to know the physical location.

## Auth

- Supabase Auth issues JWT on sign-in
- A roles table maps `user_id` to role (stored in `public`, not in JWT claims)
- RLS policies reference the roles table for authorization
- **Never use `raw_user_meta_data` in RLS policies** — it is user-editable
- **Deleting a user does not invalidate existing tokens** — sign out or revoke sessions first

## RLS Policy Patterns

```sql
-- SELECT: users can read their own rows, admins can read all
CREATE POLICY "select_own" ON table_name
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "select_admin" ON table_name
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- UPDATE: requires both USING and WITH CHECK
CREATE POLICY "update_own" ON table_name
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

## Storage

- Buckets governed by RLS policies
- **Upsert requires INSERT + SELECT + UPDATE** — granting only INSERT causes silent failures
- File size limits configured in `config.toml`

## Edge Functions

- Run on Deno runtime
- Use for: webhooks, sensitive operations, 3rd-party API calls
- Not needed for standard CRUD — the browser calls PostgREST directly via `supabase-js`