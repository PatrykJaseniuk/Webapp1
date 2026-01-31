# Frontend Style Guide

**Purpose:** Rules and patterns for Next.js/React frontend code. Guide for LLMs.

## ⚠️ Architecture: Client-Only (No Server Components)

This is a **fully client-side application**:
- ❌ NO server components
- ❌ NO server-side rendering
- ❌ NO middleware
- ❌ NO API routes
- ✅ Static Export (SSG) → GitHub Pages
- ✅ All data fetching from browser → Supabase
- ✅ All state in client (localStorage for persistence)
- ✅ All business logic validation in UI (security via RLS only)

**Security Model:** Database security (RLS) is CRITICAL. Client-side logic is for UX only.

---

## Core Rules

### ❌ Don't Do
- `try-catch` blocks → Use `.catch()` or check `{ data, error }` 
- `if` statements → Use ternary `? :` and `&&, ||, ??`
- `let/var` → Always `const`
- Class components → Arrow functions only
- Mutations → Always create new objects/arrays

### ✅ Do
- **Arrow functions:** `const name = () => {}`
- **Ternary operators:** `condition ? trueValue : falseValue`
- **Nullish coalescing:** `value ?? defaultValue`
- **Immutable updates:**
  - Objects: `{ ...prev, field: newValue }`
  - Arrays: `.map()`, `.filter()`, `[...arr, item]`

---

## Component Structure

### Basic Component
```typescript
// components/Button.tsx
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

### Client Component with State
```typescript
'use client';
import { useState } from 'react';

export const Counter = () => {
  const [count, setCount] = useState(0);

  return (
    <div>
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

## Data Fetching Patterns

### Pattern 1: Initial Load with `useAsync`
```typescript
'use client';
import { useAsync } from 'react-use';

export const ItemList = () => {
  const state = useAsync(async () => {
    const { data, error } = await database.from('items').select('*');
    return { data, error };
  }, []);

  return (
    state.loading ? <div>Loading...</div> :
    state.error ? <div>Error: {state.error.message}</div> :
    <ul>
      {state.value?.data?.map(item => <li key={item.id}>{item.name}</li>)}
    </ul>
  );
};
```

### Pattern 2: User Actions with `useAsyncFn`
```typescript
'use client';
import { useAsyncFn } from 'react-use';

export const AddItemForm = () => {
  const [name, setName] = useState('');
  const [actionState, handleSubmit] = useAsyncFn(async () => {
    const { data, error } = await database
      .from('items')
      .insert({ name })
      .select();
    return { data, error };
  }, [name]);

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSubmit().then(() => setName(''));
    }}>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button disabled={actionState.loading}>
        {actionState.loading ? 'Adding...' : 'Add'}
      </button>
      {actionState.error && <div>Error: {actionState.error.message}</div>}
    </form>
  );
};
```

### Pattern 3: Refetch Data
```typescript
const [refreshKey, setRefreshKey] = useState(0);

const state = useAsync(async () => {
  const { data, error } = await database.from('items').select('*');
  return { data, error };
}, [refreshKey]);

const handleRefresh = () => setRefreshKey(prev => prev + 1);
```

---

## Conditional Rendering

```typescript
// Single condition
{condition && <Component />}

// Two conditions
{condition ? <ComponentA /> : <ComponentB />}

// Multiple states
{loading ? <Spinner /> : 
 error ? <Error msg={error.message} /> : 
 <Success data={data} />}

// Optional chaining with defaults
{data?.items?.length ?? 'No items'}
```

---

## Error Handling (Client-Side)

### Result Object Pattern
```typescript
const result = await database.from('table').select('*');

// Supabase returns: { data: [...], error: null } or { data: null, error: Error }
const handleResponse = (result: any) => {
  return result.error ? 
    { success: false, message: result.error.message } :
    { success: true, data: result.data };
};
```

### In Components
```typescript
const state = useAsync(async () => {
  const { data, error } = await database.from('items').select('*');
  return { data, error };
}, []);

return (
  state.error ? <ErrorBanner msg={state.error.message} /> :
  state.loading ? <Spinner /> :
  <ItemList items={state.value?.data ?? []} />
);
```

---

## Authentication Pattern

### Auth Context
```typescript
'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { database } from '@/api/database';

interface AuthContextType {
  user: any | null;
  role: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, role: string) => Promise<any>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { user } } = await database.auth.getUser();
      
      if (user) {
        setUser(user);
        const { data: roleData } = await database
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        setRole(roleData?.role ?? null);
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  const value = {
    user,
    role,
    loading,
    signIn: async (email: string, password: string) => {
      const result = await database.auth.signInWithPassword({ email, password });
      return result;
    },
    signUp: async (email: string, password: string, role: string) => {
      const authResult = await database.auth.signUp({ email, password });
      if (authResult.error) return authResult;
      
      const roleResult = await database.from('user_roles').insert({
        user_id: authResult.data.user?.id,
        role,
      });
      return roleResult.error ? { error: roleResult.error } : { data: authResult.data };
    },
    signOut: async () => {
      await database.auth.signOut();
      setUser(null);
      setRole(null);
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
```

### Protected Route Component
```typescript
'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export const ProtectedRoute = ({ 
  children, 
  requiredRole 
}: { 
  children: React.ReactNode; 
  requiredRole?: string; 
}) => {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (!loading && requiredRole && role !== requiredRole) {
      router.push('/access-denied');
    }
  }, [user, role, loading, requiredRole, router]);

  return (
    loading ? <div>Loading...</div> :
    !user ? null :
    requiredRole && role !== requiredRole ? null :
    children
  );
};
```

---

## SSG (Static Site Generation) + Client-Only

### Configuration
```typescript
// next.config.ts
export default {
  output: 'export', // Static export for GitHub Pages
  basePath: '/repo-name', // Only if not root repo
  images: { unoptimized: true }, // Required for SSG
  // ❌ NO API routes (no /api/* support with static export)
};
```

### Limitations (Client-Only + SSG)
- ❌ Cannot pre-render pages with dynamic data (no getServerSideProps/getStaticProps)
- ❌ Cannot use middleware or API routes
- ❌ All data fetching must be client-side only
- ✅ Can pre-render static pages and shells
- ✅ Can pre-generate route skeletons

### Static Routes with Client-Side Data
```typescript
// app/items/[id]/page.tsx
// ⚠️ This page is rendered at BUILD TIME as static HTML
// All data loading happens CLIENT-SIDE

interface Params {
  id: string;
}

// Pre-generate some known routes at build time (optional)
export const generateStaticParams = async (): Promise<Params[]> => {
  return [{ id: '1' }, { id: '2' }]; // Or return []
};

export const dynamicParams = true; // Accept unknown routes (returns static page)

export default function ItemPage({ params }: { params: Params }) {
  return <ItemClient id={params.id} />;
}

// ALL interactivity is client-side
'use client';
const ItemClient = ({ id }: { id: string }) => {
  const state = useAsync(async () => {
    // Data fetched CLIENT-SIDE from Supabase
    const { data, error } = await database
      .from('items')
      .select('*')
      .eq('id', id)
      .single();
    return { data, error };
  }, [id]);

  return (
    state.loading ? <Spinner /> :
    state.error ? <Error msg={state.error.message} /> :
    <div>{state.value?.data?.name}</div>
  );
};
```

---

## Environment Variables

```bash
# .env.local (development)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# .env.production (deployed)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod_key...
```

**Rule:** All frontend env vars must be prefixed with `NEXT_PUBLIC_` (they're embedded in HTML).

---

## CSS Modules

```typescript
// components/Card.tsx
import styles from './Card.module.css';

export const Card = ({ title, children }: any) => (
  <div className={styles.card}>
    <h2 className={styles.title}>{title}</h2>
    <div className={styles.content}>{children}</div>
  </div>
);
```

```css
/* components/Card.module.css */
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

## File Structure

```
frontend/src/
├── api/
│   ├── database.ts          # Supabase client
│   ├── database.types.ts    # Auto-generated types
├── app/
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   ├── login/page.tsx       # Login page
│   ├── items/
│   │   ├── page.tsx         # Items list
│   │   └── [id]/page.tsx    # Item detail
├── components/
│   ├── Button.tsx
│   ├── Button.module.css
│   ├── ItemList.tsx
│   ├── ItemList.module.css
├── contexts/
│   └── AuthContext.tsx      # Auth state
└── styles/
    └── globals.css
```

---

## Common Patterns

### Form Validation
```typescript
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPassword = (pwd: string) => pwd.length >= 8;

return (
  <form>
    <input onChange={(e) => setEmail(e.target.value)} />
    {email && !isValidEmail(email) && <span>Invalid email</span>}
    <button disabled={!isValidEmail(email) || !isValidPassword(password)}>
      Sign Up
    </button>
  </form>
);
```

### Permission Checks
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

### Optimistic Updates
```typescript
const [items, setItems] = useState<Item[]>([]);

const [actionState, handleDelete] = useAsyncFn(async (id: string) => {
  // Optimistic: remove immediately
  setItems(prev => prev.filter(i => i.id !== id));
  
  const result = await database.from('items').delete().eq('id', id);
  
  // On error, would need to refetch or restore
  return result;
}, []);
```

---

## Client-Only Architecture Patterns

### localStorage for State Persistence
```typescript
'use client';
import { useEffect, useState } from 'react';

// Custom hook for persistent state
export const useLocalStorage = <T,>(key: string, initial: T) => {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(key);
    if (stored) {
      setValue(JSON.parse(stored));
    }
    setHydrated(true);
  }, [key]);

  // Save to localStorage when value changes
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }, [value, key, hydrated]);

  return [value, setValue, hydrated] as const;
};

// Usage: persist user preferences
const [theme, setTheme, hydrated] = useLocalStorage('theme', 'light');
return hydrated ? <App theme={theme} /> : null; // Avoid hydration mismatch
```

### Auth Token Management (Client-Only)
```typescript
'use client';
import { useEffect, useState } from 'react';
import { database } from '@/api/database';

export const useAuthToken = () => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getToken = async () => {
      const { data: { session } } = await database.auth.getSession();
      setToken(session?.access_token ?? null);
      setLoading(false);
    };

    getToken();

    // Listen for auth changes
    const { data: { subscription } } = database.auth.onAuthStateChange(async (event, session) => {
      setToken(session?.access_token ?? null);
    });

    return () => subscription?.unsubscribe();
  }, []);

  return { token, loading };
};
```

### Hydration Safety (SSG + Client-Only)
```typescript
'use client';
import { useEffect, useState } from 'react';

// Avoid hydration mismatch: don't render until client-side loaded
export const ClientOnly = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? <>{children}</> : null;
};

// Usage
export default function Page() {
  return (
    <ClientOnly>
      <ProtectedContent /> {/* Only renders on client */}
    </ClientOnly>
  );
}
```

---

## Common Pitfalls (Client-Only App)

| Issue | Solution |
|-------|----------|
| Hydration mismatch | Wrap dynamic content in `<ClientOnly>` or check `mounted` state |
| Sensitive data in localStorage | Use secure storage, never store passwords/secrets |
| Auth state resets on reload | Use Context + localStorage + useEffect |
| `localStorage` undefined in SSG | Access only in useEffect (not during render) |
| JWT token expired | Implement refresh token logic in AuthContext |
| Direct mutations | Always create new objects: `{ ...prev, field }` |
| `NEXT_PUBLIC_*` vars undefined | Restart dev server after `.env.local` change |
| Security logic in client | ❌ WRONG - All security in RLS policies + backend |
| Missing RLS policies | ❌ CRITICAL - Frontend validation is useless without RLS |

---

## Deployment

```bash
# Build
npm run build

# Outputs: ./out/ (static HTML)
# Deploy to GitHub Pages via GitHub Actions or manual push
```

**Pre-deployment checklist:**
- [ ] All env vars set (NEXT_PUBLIC_SUPABASE_URL, key)
- [ ] Build succeeds locally: `npm run build`
- [ ] Auth tested (sign up, login, logout)
- [ ] No console errors
- [ ] Mobile responsive
- [ ] `basePath` correct in next.config.ts
