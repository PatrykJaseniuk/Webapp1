# Frontend Style Guide — Layer 2: Library (React + Supabase)

**Scope:** React components, hooks, and Supabase data fetching patterns.  
**Back to:** [Frontend Style Guide](./FRONTEND_STYLE_GUIDE.md) · **Depends on:** [Language Rules](./FRONTEND_STYLE_GUIDE_LANGUAGE.md)

---

## 2.1 Component Structure

| ID | Rule | Severity |
|----|------|----------|
| R-001 | **Named exports** — no default exports (except Next.js pages) | 🔴 Critical |
| R-002 | **Props interface** — define `ComponentNameProps` for every component | 🔴 Critical |
| R-003 | **Destructure props** in function signature, with defaults for optionals | 🟠 High |

### Basic Component

```typescript
// components/shared/Button.tsx
'use client';
import styles from '@/components/styles/shared.module.css';

interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

export const Button = ({ label, onClick, disabled = false, variant = 'primary' }: ButtonProps) => (
  <button
    className={`${styles.button} ${styles[variant]}`}
    onClick={onClick}
    disabled={disabled}
  >
    {label}
  </button>
);
```

### Component with State

```typescript
// components/Counter/Counter.tsx
'use client';
import { useState } from 'react';
import styles from '@/components/styles/shared.module.css';

interface CounterProps {
  initialValue?: number;
}

export const Counter = ({ initialValue = 0 }: CounterProps) => {
  const [count, setCount] = useState(initialValue);

  return (
    <div className={styles.counter}>
      <p>Count: {count}</p>
      <button onClick={() => setCount(prev => prev + 1)}>+</button>
    </div>
  );
};
```

---

## 2.2 State Management

| ID | Rule | Severity |
|----|------|----------|
| R-004 | **Immutable state** — never mutate state directly | 🔴 Critical |
| R-005 | **Functional updaters** — use `prev =>` when new state depends on previous | 🔴 Critical |

```typescript
// ✅ Correct — functional updaters
setCount(prev => prev + 1);
setItems(prev => prev.filter(item => item.id !== id));
setUser(prev => ({ ...prev, name: 'John' }));
setItems(prev => [...prev, newItem]);
setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));

// ❌ Wrong — stale closure risk
setCount(count + 1);
setItems(items.filter(item => item.id !== id));

// ❌ Wrong — direct mutation
items.push(newItem);
user.name = 'John';
```

**State management decision:**

```
State Type                → Storage
──────────────────────────────────────────
Component-local, temporary → useState
Persisted across sessions  → localStorage
Shareable via URL          → URL search params (see Framework Guide)
```

---

## 2.3 Data Fetching Patterns

| ID | Rule | Severity |
|----|------|----------|
| R-006 | **`useAsync`** for data fetched on mount/page load | 🔴 Critical |
| R-007 | **`useAsyncFn`** for data fetched on user action (click, submit) | 🔴 Critical |
| R-008 | **refreshKey pattern** for refetching after mutations | 🟠 High |
| R-009 | **No index as `key`** — use unique IDs in `.map()` rendering | 🔴 Critical |

### Decision Tree: Which Pattern?

```
What triggers the data fetch?
├── Page load / component mount  → useAsync  (Pattern 1)
├── User action (click, submit)  → useAsyncFn (Pattern 2)
└── Need refetch after mutation  → refreshKey (Pattern 3)
```

### Pattern 1: Initial Load with `useAsync`

```typescript
'use client';
import { useAsync } from 'react-use';
import { database } from '@/api/database';
import { Spinner } from '@/components/shared/Spinner';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import styles from '@/components/styles/viewAll.module.css';

export const ItemList = () => {
  const state = useAsync(async () => await database.from('items').select('*');
  , []);

  return (
    state.loading ? <Spinner /> :
    state.error ? <ErrorBanner msg={state.error.message} /> :
    state.value?.error ? <ErrorBanner msg={state.value.error.message} /> :
    <ul className={styles.list}>
      {(state.value?.data ?? []).map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
};
```

### Pattern 2: User Actions with `useAsyncFn`

```typescript
'use client';
import { useState } from 'react';
import { useAsyncFn } from 'react-use';
import { database } from '@/api/database';
import styles from '@/components/styles/form.module.css';

interface AddItemFormProps {
  onSuccess: () => void;
}

export const AddItemForm = ({ onSuccess }: AddItemFormProps) => {
  const [name, setName] = useState('');

  const [actionState, handleSubmit] = useAsyncFn(async () => {
    const { data, error } = await database
      .from('items')
      .insert({ name })
      .select();
    return { data, error };
  }, [name]);

  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit().then((result) => {
          result?.data && (setName(''), onSuccess());
        });
      }}
    >
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button disabled={actionState.loading}>
        {actionState.loading ? 'Adding...' : 'Add'}
      </button>
      {actionState.error && <div className={styles.error}>{actionState.error.message}</div>}
    </form>
  );
};
```

### Pattern 3: Refetch Data (after mutations)

```typescript
const [refreshKey, setRefreshKey] = useState(0);

const state = useAsync(async () => {
  const { data, error } = await database.from('items').select('*');
  return { data, error };
}, [refreshKey]);

// Call after any mutation to refetch
const handleRefresh = () => setRefreshKey(prev => prev + 1);
```

### Pattern 4: ManyRecords Query Injection

For list views, pass a **query factory** to ManyRecords instead of fetching manually. ManyRecords handles the full lifecycle (fetch, sort, paginate, error, loading) and resolves column labels/renderers from the central column registry:

```typescript
import { database } from '@/api/database';
import { ManyRecords } from '@/components/shared/ManyRecords';

// All records — ManyRecords fetches, sorts, paginates internally
<ManyRecords
  tableName="properties"
  query={() => database.from('properties').select('*')}
  mode="cards"
/>

// Filtered records (related data in ViewSingle*)
<ManyRecords
  tableName="lease_agreements"
  query={() => database.from('lease_agreements').select('*').eq('property_id', id)}
  refreshKey={refreshKey}
/>

// With hidden columns and row click handler
<ManyRecords
  tableName="properties"
  query={() => database.from('properties').select('*')}
  hiddenColumns={['created_by', 'updated_at']}
  onRowClick={(row) => navigate(routes.landlord.properties({ id: row.id as string }))}
/>
```

ManyRecords internally applies `.order()` for sorting and `.range()` for pagination on the query builder — the caller never adds these. The `tableName` prop resolves column labels and renderers from the central column registry (`constants/columnRegistry.tsx`). See [Project Guide § 4.6](./FRONTEND_STYLE_GUIDE_PROJECT.md#46-manyrecords--smart-universal-multi-record-display) for full details.

---

## 2.4 Supabase Database Client

| ID | Rule | Severity |
|----|------|----------|
| R-010 | **Single `database` import** — `import { database } from '@/api/database'`, never create new clients | 🔴 Critical |
| R-011 | **Destructure `{ data, error }`** from every Supabase call | 🔴 Critical |
| R-012 | **Use generated types** — `Database['public']['Tables']['name']['Row']` | 🔴 Critical |

### Database Client (single instance)

```typescript
// api/database.ts — the ONLY place a client is created
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ⚠️ Exception: throw allowed here for fatal startup error
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

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
const { data, error } = await database
  .from('properties')
  .select('id, name, status')
  .eq('landlord_id', userId)
  .order('created_at', { ascending: false });

// INSERT
const { data, error } = await database
  .from('properties')
  .insert({ name, address, landlord_id: userId })
  .select()
  .single();

// UPDATE
const { data, error } = await database
  .from('properties')
  .update({ name, status })
  .eq('id', propertyId)
  .select()
  .single();

// DELETE
const { error } = await database
  .from('properties')
  .delete()
  .eq('id', propertyId);
```

---

## 2.5 Error Handling in Components

| ID | Rule | Severity |
|----|------|----------|
| R-013 | **3-level error display** — hook error → loading → data error → success | 🔴 Critical |

### Error Handling Decision Tree

```
Error Type              → Handling Strategy
────────────────────────────────────────────────
Supabase { error }      → Show inline via state.value.error
Network failure         → useAsync catches → state.error → show retry
Auth expired (401)      → onAuthStateChange fires → redirect to login
RLS denied (403)        → Supabase returns { error } → show "Access denied"
Validation error        → Prevent submission, show field-level errors
Startup/init failure    → throw Error (only in api/database.ts)
```

### 3-Level Error Pattern

```typescript
const [refreshKey, setRefreshKey] = useState(0);

const state = useAsync(async () => {
  const { data, error } = await database.from('items').select('*');
  return { data, error };
}, [refreshKey]);

const handleRefresh = () => setRefreshKey(prev => prev + 1);

return (
  // Level 1: Hook-level error (network failure, unhandled exception)
  state.error ? <ErrorBanner msg={state.error.message} retry={handleRefresh} /> :
  // Level 2: Loading state
  state.loading ? <Spinner /> :
  // Level 3: Supabase-level error (RLS denied, bad query)
  state.value?.error ? <ErrorBanner msg={state.value.error.message} /> :
  // Level 4: Success — render data
  <ItemList items={state.value?.data ?? []} />
);
```

### Reusable ErrorBanner

```typescript
// components/shared/ErrorBanner.tsx
'use client';
import styles from '@/components/styles/shared.module.css';

interface ErrorBannerProps {
  msg: string;
  retry?: () => void;
}

export const ErrorBanner = ({ msg, retry }: ErrorBannerProps) => (
  <div className={styles.banner} role="alert">
    <span className={styles.message}>Error: {msg}</span>
    {retry && <button className={styles.retryButton} onClick={retry}>Retry</button>}
  </div>
);
```

---

## 2.6 Conditional Rendering

All rendering follows ternary chains — no `if` in JSX (same as [Language Rule L-011](./FRONTEND_STYLE_GUIDE_LANGUAGE.md#13-control-flow)):

```typescript
// Single condition
{condition && <Component />}

// Two conditions
{condition ? <ComponentA /> : <ComponentB />}

// Multiple states (loading → error → success) — the standard pattern
{loading ? <Spinner /> :
 error ? <ErrorBanner msg={error.message} /> :
 <Content data={data} />}

// Optional chaining with defaults
{data?.items?.length ?? 'No items'}

// List with empty state
{items.length > 0 ? 
   items.map(item => <Item key={item.id} {...item} />)
  : <EmptyState message="No items found" />}
```

---

## 2.7 Auth Hook Pattern

The auth hook wraps Supabase auth with `useAsync`/`useAsyncFn`:

```typescript
// hooks/useAuth.ts
'use client';
import { useState } from 'react';
import { useAsync, useAsyncFn } from 'react-use';
import { database } from '@/api/database';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
}

export const useAuth = () => {
  const [auth, setAuth] = useState<AuthState>({ user: null, session: null });

  const initialLoad = useAsync(async () => {
    const { data: { session } } = await database.auth.getSession();
    setAuth({ user: session?.user ?? null, session });

    const { data: { subscription } } = database.auth.onAuthStateChange(
      (_event, session) => {
        setAuth({ user: session?.user ?? null, session });
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  const [loginState, login] = useAsyncFn(async (email: string, password: string) => {
    const { data, error } = await database.auth.signInWithPassword({ email, password });
    return { data, error };
  }, []);

  const [signupState, signup] = useAsyncFn(async (email: string, password: string) => {
    const { data, error } = await database.auth.signUp({ email, password });
    return { data, error };
  }, []);

  const [, logout] = useAsyncFn(async () => {
    const { error } = await database.auth.signOut();
    return { error };
  }, []);

  return {
    user: auth.user,
    session: auth.session,
    isAuthenticated: !!auth.session,
    loading: initialLoad.loading,
    login, loginState,
    signup, signupState,
    logout,
  };
};
```

---

## Summary — Key Patterns

| Pattern | When | Mechanism |
|---------|------|-----------|
| Data on mount | Single record fetch, page load | `useAsync(async () => ..., [])` |
| Data on action | Button click, form submit | `useAsyncFn(async () => ..., [deps])` |
| Refetch | After mutation | `refreshKey` + `useAsync(... , [refreshKey])` |
| **List data** | **Any table/list/card view** | **`<ManyRecords tableName="x" query={() => database.from(...).select(...)} mode="table">` — handles fetch, sort, pagination, column registry** |
| Auth state | App-wide | `useAuth()` hook |
| Error display | Always | 3-level: hook error → loading → data error → success |
| State updates | Always | `prev =>` functional updaters |
| Database access | Always | `import { database } from '@/api/database'` |
