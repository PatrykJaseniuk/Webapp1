# Frontend Style Guide — Layer 2: Library (React + Supabase)

**Scope:** React components, hooks, and Supabase data fetching patterns.  
**Back to:** [Frontend Style Guide](./FRONTEND_STYLE_GUIDE.md) · **Depends on:** [Language Rules](./FRONTEND_STYLE_GUIDE_LANGUAGE.md)

## 2.3 Data Fetching Patterns

| ID | Rule | Severity |
|----|------|----------|
| R-006 | **`useAsync`** for data fetched on mount/page load | 🔴 Critical |
| R-007 | **`useAsyncFn`** for data fetched on user action (click, submit) | 🔴 Critical |
| R-008 | **refreshKey pattern** for refetching after mutations | 🟠 High |
| R-009 | **No index as `key`** — use unique IDs in `.map()` rendering | 🔴 Critical |


## 2.4 Supabase Database Client

| ID | Rule | Severity |
|----|------|----------|
| R-010 | **Single `database` import** — `import { database } from '@/api/database'`, never create new clients | 🔴 Critical |
| R-012 | **Use generated types** — `Database['public']['Tables']['name']['Row']` | 🔴 Critical |

### Database Client (single instance)

```typescript
// api/database.ts — the ONLY place a client is created
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const database = createClient<Database>(supabaseUrl, supabaseAnonKey);
```

### Type Safety with Generated Types

```typescript
import type { Database } from '@/api/database.types';

type Property = Database['public']['Tables']['properties']['Row'];
type PropertyInsert = Database['public']['Tables']['properties']['Insert'];
type PropertyUpdate = Database['public']['Tables']['properties']['Update'];
```

### Query Patterns (CRUD)

```typescript
// SELECT with filter
const result = await database
  .from('properties')
  .select('id, name, status')
  .eq('landlord_id', userId)
  .order('created_at', { ascending: false });

// INSERT
const result = await database
  .from('properties')
  .insert({ name, address, landlord_id: userId })
  .select()
  .single();

// UPDATE
const result = await database
  .from('properties')
  .update({ name, status })
  .eq('id', propertyId)
  .select()
  .single();

// DELETE
const result = await database
  .from('properties')
  .delete()
  .eq('id', propertyId);
```

---