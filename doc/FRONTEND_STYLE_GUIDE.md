# Frontend Style Guide

**Purpose:** Rules and patterns for Next.js/React frontend code. Guide for LLMs.  
**Tech Stack:** Next.js 16.1.4 | React 19.2.3 | TypeScript 5.x | Supabase JS 2.91.x | react-use 17.6.x  
**Related:** [Backend Style Guide](./BACKEND_STYLE_GUIDE.md) · [System Architecture Guide](./SYSTEM_ARCHITECTURE_GUIDE.md)

---

## Quick Reference (TL;DR)

| Rule ID | Rule | Severity |
|---------|------|----------|
| F-001 | All code in **functional style** — arrow functions, `const` only, no classes | 🔴 Critical |
| F-002 | **Client-only architecture** — NO server components, NO SSR, NO middleware, NO API routes | 🔴 Critical |
| F-003 | **No `try-catch`** in component/hook logic — use `{ data, error }` pattern or `.catch()` | 🔴 Critical |
| F-004 | **No `if` statements** in component/hook logic — use ternary `? :`, `&&`, `\|\|`, `??` | 🟠 High |
| F-005 | **No `let`/`var`** — always `const` | 🟠 High |
| F-006 | **Immutable state updates** — always spread, never mutate | 🔴 Critical |
| F-007 | **CSS Modules** for styling — no inline styles, no CSS-in-JS | 🟠 High |
| F-008 | **`useAsync`** for page-load data, **`useAsyncFn`** for user actions | 🟠 High |
| F-009 | **Security is UX only** — client-side validation is for UX, real security is RLS ([Backend Guide](./BACKEND_STYLE_GUIDE.md#row-level-security-rls)) | 🔴 Critical |
| F-010 | **`NEXT_PUBLIC_`** prefix required on all env vars | 🔴 Critical |
| F-011 | **No dynamic routes** (`[id]`, `[slug]`) — use URL search params (`?id=xxx`) instead | 🔴 Critical |

---

## ⚠️ Architecture: Client-Only (No Server Components)

This is a **fully client-side application**:
- ❌ NO server components
- ❌ NO server-side rendering
- ❌ NO middleware
- ❌ NO API routes
- ❌ NO dynamic routes (`[id]`, `[slug]`, etc.) — incompatible with `output: 'export'`
- ✅ Static Export (SSG) → GitHub Pages
- ✅ All data fetching from browser → Supabase
- ✅ All state in client (localStorage for persistence)
- ✅ All business logic validation in UI (security via RLS only)
- ✅ URL search params (`?id=xxx`, `?action=new`) for detail/edit/create views

**Security Model:** Database security (RLS) is CRITICAL — see [Backend Guide § RLS](./BACKEND_STYLE_GUIDE.md#row-level-security-rls). Client-side logic is for UX only.

### `'use client'` Directive Rule

Since this is a fully client-side app with static export:
- **Root layout** (`app/layout.tsx`) — NO `'use client'` (it's the SSG entry point)
- **Page components** (`app/*/page.tsx`) — NO `'use client'` (they are thin wrappers that render client components)
- **All interactive components** (`components/*`, `hooks/*`) — **YES `'use client'`** at the top of any file that uses React hooks, browser APIs, or event handlers

```typescript
// app/items/page.tsx — NO 'use client' (thin SSG wrapper)
import { ItemsPage } from '@/components/Items/ItemsPage';
export default function Page() {
  return <ItemsPage />;
}

// components/Items/ItemsPage.tsx — YES 'use client' (interactive)
'use client';
import { useAsync } from 'react-use';
// ...
```

---

## Project File Tree & Path Conventions

```
frontend/src/
├── api/                          # Supabase client & generated types ONLY
│   ├── database.ts               # Supabase client instance
│   └── database.types.ts         # Auto-generated (supabase gen types)
├── app/                          # Next.js App Router — pages only
│   ├── layout.tsx                # Root layout (HTML shell, providers)
│   ├── page.tsx                  # Home page (thin wrapper)
│   └── [feature]/                # Feature routes
│       └── page.tsx              # Route page (thin wrapper → components)
├── components/                   # Reusable UI components
│   └── [ComponentName]/          # One folder per component
│       ├── [ComponentName].tsx   # Component logic
│       └── [ComponentName].module.css  # Scoped styles
├── hooks/                        # Custom React hooks
│   └── use[HookName].ts         # Hook files
└── utils/                        # Pure utility functions
    └── [utilName].ts             # Utility files
```

### Path Rules
- **Import alias:** Always use `@/` which maps to `frontend/src/`
- **New components:** Create `frontend/src/components/[Name]/[Name].tsx` + `.module.css`
- **New hooks:** Create `frontend/src/hooks/use[Name].ts`
- **New pages:** Create `frontend/src/app/[route]/page.tsx` (thin wrapper only)
- **Never put business logic in `app/` pages** — delegate to components

---

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Component files | PascalCase | `Button.tsx`, `ItemList.tsx` |
| Component folders | PascalCase | `components/ItemList/` |
| Component exports | PascalCase, named export | `export const ItemList = () => ...` |
| Hook files | camelCase with `use` prefix | `useAuth.ts`, `useItems.ts` |
| Hook exports | camelCase with `use` prefix | `export const useAuth = () => ...` |
| Utility files | camelCase | `formatDate.ts`, `validators.ts` |
| Utility exports | camelCase | `export const formatDate = () => ...` |
| Type/Interface (props) | PascalCase + `Props` suffix | `ButtonProps`, `ItemListProps` |
| Type/Interface (data) | PascalCase | `Item`, `User`, `UserRole` |
| CSS Module files | PascalCase matching component | `Button.module.css` |
| CSS class names | camelCase | `.cardHeader`, `.buttonPrimary` |
| Constants | UPPER_SNAKE_CASE | `const MAX_ITEMS = 50` |
| Env variables | UPPER_SNAKE_CASE with `NEXT_PUBLIC_` | `NEXT_PUBLIC_SUPABASE_URL` |

---

## Import Conventions

**Order (top to bottom, separated by blank lines):**

```typescript
// 1. React / Next.js core
import { useState, useCallback } from 'react';
import Link from 'next/link';

// 2. Third-party libraries
import { useAsync, useAsyncFn } from 'react-use';

// 3. Project: API layer
import { database } from '@/api/database';
import type { Database } from '@/api/database.types';

// 4. Project: Hooks
import { useAuth } from '@/hooks/useAuth';

// 5. Project: Components
import { Button } from '@/components/Button/Button';
import { Spinner } from '@/components/Spinner/Spinner';

// 6. Project: Utilities
import { formatDate } from '@/utils/formatDate';

// 7. Styles (always last)
import styles from './ComponentName.module.css';
```

**Rules:**
- Always use `@/` alias — never relative paths for cross-directory imports
- Relative paths (`./`) only for same-directory imports (e.g., CSS modules)
- Use `import type` for type-only imports
- Named exports only — no default exports (except Next.js page components)

---

## Core Rules [F-001 through F-006]

### ❌ Don't Do
- `try-catch` blocks → Use `.catch()` or check `{ data, error }` *(exception: initialization code like `database.ts` may use `throw` for fatal startup errors)*
- `if/else` statements in component/hook logic → Use ternary `? :` and `&&`, `||`, `??` *(exception: initialization/configuration files)*
- `let` or `var` → Always `const`
- Class components → Arrow functions only
- Mutations → Always create new objects/arrays
- Default exports → Named exports only *(exception: Next.js `page.tsx` files require `export default`)*

### ✅ Do
- **Arrow functions:** `const name = () => {}`
- **Ternary operators:** `condition ? trueValue : falseValue`
- **Nullish coalescing:** `value ?? defaultValue`
- **Optional chaining:** `user?.profile?.name`
- **Immutable updates:**
  - Objects: `{ ...prev, field: newValue }`
  - Arrays: `.map()`, `.filter()`, `[...arr, item]`

---

## Component Structure

### Basic Component
```typescript
// components/Button/Button.tsx
'use client';
import styles from './Button.module.css';

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

import styles from './Counter.module.css';

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

### Immutable State Updates
```typescript
// Object: spread syntax
setUser(prev => ({ ...prev, name: 'John' }));

// Array: add item
setItems(prev => [...prev, newItem]);

// Array: remove item
setItems(prev => prev.filter(i => i.id !== id));

// Array: update item
setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
```

---

## Data Fetching Patterns [F-008]

### Decision Tree: Which Pattern to Use

```
What triggers the data fetch?
├── Page load / component mount → useAsync (Pattern 1)
├── User action (click, submit) → useAsyncFn (Pattern 2)
└── Need to refetch after mutation → refreshKey pattern (Pattern 3)

State management:
├── Component-local, temporary → useState
├── Persisted across sessions → localStorage
└── Shareable via URL → URL search params
```

### Pattern 1: Initial Load with `useAsync`
```typescript
// components/ItemList/ItemList.tsx
'use client';
import { useAsync } from 'react-use';

import { database } from '@/api/database';
import { Spinner } from '@/components/Spinner/Spinner';
import { ErrorBanner } from '@/components/ErrorBanner/ErrorBanner';

import styles from './ItemList.module.css';

export const ItemList = () => {
  const state = useAsync(async () => {
    const { data, error } = await database.from('items').select('*');
    return { data, error };
  }, []);

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
// components/AddItemForm/AddItemForm.tsx
'use client';
import { useState } from 'react';
import { useAsyncFn } from 'react-use';

import { database } from '@/api/database';

import styles from './AddItemForm.module.css';

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

---

## Authentication Flow Patterns

### Auth Hook
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

  // Load session on mount
  useAsync(async () => {
    const { data: { session } } = await database.auth.getSession();
    setAuth({ user: session?.user ?? null, session });

    // Listen for auth changes
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
    login,
    loginState,
    signup,
    signupState,
    logout,
  };
};
```

### Protected Component Pattern
```typescript
// components/ProtectedRoute/ProtectedRoute.tsx
'use client';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/Spinner/Spinner';

import styles from './ProtectedRoute.module.css';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ProtectedRoute = ({ children, fallback }: ProtectedRouteProps) => {
  const { isAuthenticated, session } = useAuth();

  return (
    session === undefined ? <Spinner /> :
    isAuthenticated ? <>{children}</> :
    fallback ?? <div className={styles.denied}>Please log in to access this page.</div>
  );
};
```

### Usage in Pages
```typescript
// components/Dashboard/Dashboard.tsx
'use client';
import { ProtectedRoute } from '@/components/ProtectedRoute/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';

export const Dashboard = () => {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <h1>Welcome, {user?.email}</h1>
      {/* Protected content */}
    </ProtectedRoute>
  );
};
```

---

## Error Handling Strategy [F-003]

### Decision Tree

```
Error Type           → Handling Strategy
─────────────────────────────────────────────────────────
Supabase { error }   → Show inline error message via state.error or value.error
Network failure      → useAsync catches automatically → show retry button
Auth expired (401)   → onAuthStateChange fires → redirect to login
RLS denied (403)     → Supabase returns { error } → show "Access denied"
Validation error     → Prevent submission, show field-level errors
Startup/init failure → throw Error (only in api/database.ts)
```

### In Components
```typescript
const state = useAsync(async () => {
  const { data, error } = await database.from('items').select('*');
  return { data, error };
}, []);

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

### Reusable Error Banner
```typescript
// components/ErrorBanner/ErrorBanner.tsx
'use client';
import styles from './ErrorBanner.module.css';

interface ErrorBannerProps {
  msg: string;
  retry?: () => void;
}

export const ErrorBanner = ({ msg, retry }: ErrorBannerProps) => (
  <div className={styles.banner} role="alert">
    <span>Error: {msg}</span>
    {retry && <button onClick={retry} className={styles.retryButton}>Retry</button>}
  </div>
);
```

---

## Conditional Rendering

```typescript
// Single condition
{condition && <Component />}

// Two conditions
{condition ? <ComponentA /> : <ComponentB />}

// Multiple states (loading → error → success)
{loading ? <Spinner /> :
 error ? <ErrorBanner msg={error.message} /> :
 <Success data={data} />}

// Optional chaining with defaults
{data?.items?.length ?? 'No items'}

// List rendering with empty state
{items.length > 0
  ? items.map(item => <Item key={item.id} {...item} />)
  : <EmptyState message="No items found" />}
```

---

## SSG (Static Site Generation) + Client-Only

### Configuration
```typescript
// next.config.ts
export default {
  output: 'export',              // Static export for GitHub Pages
  basePath: '/repo-name',        // Only if not root repo
  images: { unoptimized: true }, // Required for SSG
  // ❌ NO API routes (no /api/* support with static export)
};
```

### Limitations (Client-Only + SSG)
- ❌ Cannot pre-render pages with dynamic data (no `getServerSideProps` / `getStaticProps`)
- ❌ Cannot use middleware or API routes
- ❌ Cannot use dynamic routes (`[id]`, `[slug]`) — **not supported** with `output: 'export'` for unknown params
- ❌ All data fetching must be client-side only
- ✅ Can pre-render static pages and shells
- ✅ Can pre-generate route skeletons
- ✅ Use URL search params (`?id=xxx`) for detail/edit views

### ⚠️ No Dynamic Routes — Use Search Params [F-011]

With `output: 'export'`, Next.js cannot generate pages for unknown dynamic segments (e.g., `/properties/[id]`). **All detail/edit/create views must use URL search parameters instead.**

```
❌ WRONG: /landlord/properties/[id]/page.tsx    → won't work with static export
✅ CORRECT: /landlord/properties/page.tsx        → uses ?id=xxx, ?action=new
```

**URL patterns:**
```
/landlord/properties              → List view
/landlord/properties?id=abc-123   → Detail/edit view for specific item
/landlord/properties?action=new   → Create new item form
```

**Page component acts as a mini-router based on search params:**
```typescript
// components/landlord/PropertiesPage.tsx
'use client';
import { useSearchParams } from 'next/navigation';

import { PropertiesList } from '@/components/landlord/PropertiesList';
import { PropertyDetail } from '@/components/landlord/PropertyDetail';
import { PropertyForm } from '@/components/landlord/PropertyForm';

export const PropertiesPage = () => {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const action = searchParams.get('action');

  return (
    action === 'new' ? <PropertyForm /> :
    id ? <PropertyDetail id={id} /> :
    <PropertiesList />
  );
};
```

**Navigation between views:**
```typescript
import Link from 'next/link';

// Navigate to detail
<Link href="/landlord/properties?id=abc-123">View Property</Link>

// Navigate to create form
<Link href="/landlord/properties?action=new">Add Property</Link>

// Back to list
<Link href="/landlord/properties">← Back to list</Link>
```

---

## Complete Page Template

A full example connecting all patterns — page route, client component, data fetching, error handling, and styling:

```typescript
// app/items/page.tsx
import { ItemsPage } from '@/components/Items/ItemsPage';

export default function Page() {
  return <ItemsPage />;
}
```

```typescript
// components/Items/ItemsPage.tsx
'use client';
import { useState } from 'react';
import { useAsync } from 'react-use';

import { database } from '@/api/database';
import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/ProtectedRoute/ProtectedRoute';
import { Spinner } from '@/components/Spinner/Spinner';
import { ErrorBanner } from '@/components/ErrorBanner/ErrorBanner';
import { AddItemForm } from '@/components/AddItemForm/AddItemForm';

import styles from './ItemsPage.module.css';

export const ItemsPage = () => {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const state = useAsync(async () => {
    const { data, error } = await database
      .from('items')
      .select('*')
      .order('created_at', { ascending: false });
    return { data, error };
  }, [refreshKey]);

  const handleRefresh = () => setRefreshKey(prev => prev + 1);

  return (
    <ProtectedRoute>
      <div className={styles.page}>
        <h1 className={styles.title}>My Items</h1>

        <AddItemForm onSuccess={handleRefresh} />

        {state.error ? <ErrorBanner msg={state.error.message} retry={handleRefresh} /> :
         state.loading ? <Spinner /> :
         state.value?.error ? <ErrorBanner msg={state.value.error.message} /> :
         <ul className={styles.list}>
           {(state.value?.data ?? []).map(item => (
             <li key={item.id} className={styles.item}>
               <span>{item.name}</span>
               <span className={styles.date}>
                 {new Date(item.created_at).toLocaleDateString()}
               </span>
             </li>
           ))}
         </ul>}
      </div>
    </ProtectedRoute>
  );
};
```

```css
/* components/Items/ItemsPage.module.css */
.page {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}

.title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 16px;
}

.list {
  list-style: none;
  padding: 0;
}

.item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}

.date {
  color: #888;
  font-size: 14px;
}
```

---

## CSS Modules [F-007]

```typescript
// components/Card/Card.tsx
'use client';
import styles from './Card.module.css';

interface CardProps {
  title: string;
  children: React.ReactNode;
}

export const Card = ({ title, children }: CardProps) => (
  <div className={styles.card}>
    <h2 className={styles.title}>{title}</h2>
    <div className={styles.content}>{children}</div>
  </div>
);
```

```css
/* components/Card/Card.module.css */
.card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  background-color: #fff;
}

.title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.content {
  margin-top: 12px;
  color: #666;
}
```

---

## Environment Variables [F-010]

```bash
# .env.local (development)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# .env.production (deployed)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod_key...
```

**Rule:** All frontend env vars must be prefixed with `NEXT_PUBLIC_` (they're embedded in static HTML at build time).

---

## Common Patterns

### Permission Checks (UX Only — Security is RLS)
```typescript
const canEdit = (item: Item, user: User) =>
  user && (item.created_by === user.id || user.role === 'admin');

return (
  <div>
    {canEdit(item, user) && <EditButton />}
    {user?.role === 'admin' && <AdminPanel />}
  </div>
);
```

⚠️ These checks are for **UX only** — hiding/showing UI elements. The actual security enforcement happens via RLS policies. See [Backend Guide § RLS](./BACKEND_STYLE_GUIDE.md#row-level-security-rls).

### Optimistic Updates
```typescript
const [items, setItems] = useState<Item[]>([]);

const [, handleDelete] = useAsyncFn(async (id: string) => {
  // Optimistic: remove immediately from UI
  setItems(prev => prev.filter(i => i.id !== id));

  const { error } = await database.from('items').delete().eq('id', id);

  // On error: refetch to restore correct state
  error && handleRefresh();

  return { error };
}, []);
```

### localStorage Persistence
```typescript
// hooks/useLocalStorage.ts
'use client';
import { useState } from 'react';

export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    const item = typeof window !== 'undefined'
      ? window.localStorage.getItem(key)
      : null;
    return item ? JSON.parse(item) as T : initialValue;
  });

  const setValue = (value: T | ((prev: T) => T)) => {
    const valueToStore = value instanceof Function ? value(storedValue) : value;
    setStoredValue(valueToStore);
    typeof window !== 'undefined' &&
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
  };

  return [storedValue, setValue] as const;
};
```

---

## Common Mistakes

| # | Mistake | Fix |
|---|---------|-----|
| 1 | Using `useEffect` + `useState` for data fetching | Use `useAsync` from react-use instead |
| 2 | Importing with relative paths across directories (`../../hooks/useAuth`) | Use `@/hooks/useAuth` alias |
| 3 | Putting business logic in `app/*/page.tsx` files | Page files are thin wrappers — put logic in `components/` |
| 4 | Using `default export` for components | Use `named exports` — only `page.tsx` uses default |
| 5 | Mutating state directly (`items.push(newItem)`) | Always create new references (`[...items, newItem]`) |
| 6 | Using `if/else` chains in render logic | Use ternary chains: `a ? X : b ? Y : Z` |
| 7 | Not handling both `state.error` AND `state.value?.error` | Supabase errors appear in `value.error`, network errors in `state.error` |
| 8 | Storing service role key in frontend | NEVER — only `NEXT_PUBLIC_SUPABASE_ANON_KEY` in frontend |
| 9 | Relying on client-side permission checks for security | Client checks are UX only — security must be in RLS |
| 10 | Forgetting `key` prop on mapped elements | Always use a unique `key` (prefer `item.id`) |
