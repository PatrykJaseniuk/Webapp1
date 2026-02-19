# Frontend Style Guide

**Purpose:** Code generation rules for Next.js/React frontend. Guide for LLMs.  
**Tech Stack:** Next.js 16.1.4 | React 19.2.3 | TypeScript 5.x | Supabase JS 2.91.x | react-use 17.6.x

---

## How to Use This Guide

Rules are organized from **general to specific**:
1. **Language Rules** — Apply to ALL TypeScript/JavaScript code
2. **React Rules** — Apply to all React components and hooks
3. **Framework Rules** — Apply to Next.js specific patterns
4. **Database Rules** — Apply to Supabase operations
5. **Project Rules** — Apply to this specific project's conventions

When generating code, apply rules in order: Language → React → Framework → Database → Project.

---

## 1. Language Rules (TypeScript/JavaScript)

These rules apply to ALL code regardless of framework or context.

### 1.1 Functional Style

| ID | Rule | Severity |
|----|------|----------|
| L-001 | **`const` only** — no `let`, no `var` | 🔴 |
| L-002 | **`as const` for literals** — use for objects that should be immutable | 🔴 |
| L-003 | **Immutable class properties** — class props cannot be modified after creation | 🔴 |

```typescript
// ✅ Correct - Arrow functions
export const formatDate = (date: string) => { ... };

// ✅ Correct - Function keyword is allowed
export function formatCurrency(amount: number) { ... }

// ✅ Correct - Classes with immutable props
export class Service {
  readonly apiKey: string;
  constructor(key: string) {
    this.apiKey = key;
  }
}

// ✅ Correct - Immutable literals
export const ROUTES = { HOME: '/' } as const;

// ❌ Wrong - Mutable variables
let count = 0;

// ❌ Wrong - Class with mutable props
export class Service {
  apiKey: string;  // Can be modified - not allowed
}
```

### 1.2 Immutability

| ID | Rule | Severity |
|----|------|----------|
| L-004 | **No data mutation** — always create new objects/arrays | 🔴 |
| L-005 | **Spread for updates** — `{ ...obj, field: value }` | 🔴 |

```typescript
// ✅ Correct
setItems(prev => [...prev, newItem]);
setUser(prev => ({ ...prev, name: 'John' }));

// ❌ Wrong
items.push(newItem);
user.name = 'John';
```

### 1.3 Control Flow

| ID | Rule | Severity |
|----|------|----------|
| L-006 | **Single return** — functions return at the end, not multiple places | 🔴 |
| L-007 | **No try-catch** — use `{ data, error }` pattern or `.catch()` | 🔴 |
| L-008 | **Ternary for simple conditions** — `? :` for 2-way branches | 🟡 |

```typescript
// ✅ Correct - Single return
export const getValue = (input: string | null) => {
  const result = input ?? 'default';
  return result;
};

// ✅ Correct - Error handling
const { data, error } = await database.from('items').select('*');
return error ? { success: false, error } : { success: true, data };

// ❌ Wrong - Multiple returns
export const getValue = (input: string | null) => {
  if (!input) return 'default';  // Early return
  return input;
};
```

### 1.4 Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Variables | camelCase | `itemCount`, `userName` |
| Constants | UPPER_SNAKE_CASE | `MAX_ITEMS`, `API_URL` |
| Functions | camelCase | `formatDate`, `getUserName` |
| Types/Interfaces | PascalCase | `User`, `ButtonProps` |

---

## 2. React Rules

These rules apply to all React components and hooks.

### 2.1 Component Structure

| ID | Rule | Severity |
|----|------|----------|
| R-001 | **Named exports** — no default exports (except pages) | 🔴 |
| R-002 | **Props interface** — define `ComponentNameProps` interface | 🔴 |
| R-003 | **Destructure props** — use destructuring in function signature | 🟡 |

```typescript
// ✅ Correct - Named export for components
interface ButtonProps {
  label: string;
  onClick: () => void;
}

export const Button = ({ label, onClick }: ButtonProps) => (
  <button onClick={onClick}>{label}</button>
);

// ✅ Correct - Anonymous default export for Next.js pages
// app/landlord/page.tsx
export default function () {
  return <LandlordDashboard />;
}

// ❌ Wrong - Named default export for pages
export default function LandlordPage() { ... }

// ❌ Wrong - Default export for regular components
export default function Button() { ... }
```

### 2.2 State Management

| ID | Rule | Severity |
|----|------|----------|
| R-004 | **Immutable state updates** — never mutate state directly | 🔴 |
| R-005 | **Functional updates** — use `prev =>` for state based on previous | 🔴 |

```typescript
// ✅ Correct
setCount(prev => prev + 1);
setItems(prev => prev.filter(item => item.id !== id));

// ❌ Wrong
setCount(count + 1);
setItems(items.filter(item => item.id !== id));
```

### 2.3 Hooks

| ID | Rule | Severity |
|----|------|----------|
| R-006 | **`useAsync` for page load** — data fetching on mount | 🔴 |
| R-007 | **`useAsyncFn` for user actions** — data fetching on event | 🔴 |
| R-008 | **Hook files in `hooks/`** — `use[Name].ts` naming | 🔴 |

### 2.4 Conditional Rendering

```typescript
// Single condition
{condition && <Component />}

// Two conditions  
{condition ? <ComponentA /> : <ComponentB />}

// Multiple states (loading → error → success)
{loading ? <Spinner /> :
 error ? <ErrorBanner /> :
 <Content />}
```

---

## 3. Framework Rules (Next.js)

These rules apply to Next.js specific patterns.

### 3.1 Architecture

| ID | Rule | Severity |
|----|------|----------|
| F-001 | **Client-only** — NO server components, SSR, middleware | 🔴 |
| F-002 | **Static export** — `output: 'export'` for GitHub Pages | 🔴 |
| F-003 | **`'use client'` directive** — required for all interactive components | 🔴 |

```
✅ Static Export (SSG) → GitHub Pages
✅ All data fetching from browser → Supabase
❌ NO server components, SSR, middleware, API routes
```

### 3.2 Routing

| ID | Rule | Severity |
|----|------|----------|
| F-004 | **No dynamic routes** — use URL search params instead of `[id]` | 🔴 |
| F-005 | **Centralized routing** — use route config, no hardcoded paths | 🔴 |
| F-006 | **URL params for detail views** — `?id=xxx` instead of `/items/[id]` | 🔴 |

```typescript
// ❌ Wrong - Dynamic route (doesn't work with static export)
// /items/[id]/page.tsx

// ✅ Correct - URL search params
// /items/page.tsx?id=123
```

### 3.3 Centralized Routing System

All routes are defined in [`frontend/src/routes/index.ts`](frontend/src/routes/index.ts). Use this system instead of hardcoded paths.

**Route Types:**

```typescript
// routes/index.ts
export type PropertyRouteParams = {
    id?: string;
    action?: 'detail' | 'edit' | 'new';
};

export type TenantRouteParams = {
    id?: string;
    action?: 'detail' | 'edit' | 'new';
};
```

**Route Generators:**

```typescript
// routes/index.ts
export const routes = {
    home: () => '/',
    login: () => '/login',
    signup: () => '/signup',

    landlord: {
        dashboard: () => '/landlord',
        properties: (params?: PropertyRouteParams) =>
            buildUrl('/landlord/properties', params),
        tenants: (params?: TenantRouteParams) =>
            buildUrl('/landlord/tenants', params),
        leases: (params?: LeaseRouteParams) =>
            buildUrl('/landlord/leases', params),
    },

    tenant: {
        dashboard: () => '/tenant/dashboard',
        properties: () => '/tenant/properties',
    },
};
```

**Reading Route Params:**

```typescript
// routes/useRouteParams.ts
export const useRouteParams = <T extends Record<string, string | undefined>>(): T => {
    const searchParams = useSearchParams();
    return new Proxy({} as T, {
        get: (_, prop: string) => searchParams.get(prop) ?? undefined,
    });
};
```

**Usage in Components:**

```typescript
// ❌ Wrong - Hardcoded path
<Link href="/landlord/properties?id=123">
<Link href="/landlord/properties?action=new">

// ✅ Correct - Centralized route with params
import { routes } from '@/routes';

<Link href={routes.landlord.properties({ id: '123' })}>
<Link href={routes.landlord.properties({ action: 'new' })}>
```

**Usage in Page Components:**

```typescript
// app/landlord/properties/page.tsx
import { useRouteParams } from '@/routes/useRouteParams';
import type { PropertyRouteParams } from '@/routes';

export default function () {
    const { id, action } = useRouteParams<PropertyRouteParams>();
    
    return (
        action === 'new' ? <PropertyForm /> :
        id ? <PropertyDetail id={id} /> :
        <PropertyList />
    );
}
```

### 3.4 'use client' Directive

| File Type | Directive |
|-----------|-----------|
| Root layout (`app/layout.tsx`) | NO directive |
| Page components (`app/*/page.tsx`) | NO directive (thin wrapper) |
| All components (`components/*`) | YES `'use client'` |
| All hooks (`hooks/*`) | YES `'use client'` |

---

## 4. Database Rules (Supabase)

These rules apply to all Supabase database operations.

### 4.1 Database Client

| ID | Rule | Severity |
|----|------|----------|
| D-001 | **Use `database` import** — import from `@/api/database` | 🔴 |
| D-002 | **Typed client** — Database types from `@/api/database.types` | 🔴 |
| D-003 | **Single client instance** — never create new clients | 🔴 |

```typescript
// ✅ Correct
import { database } from '@/api/database';
import type { Database } from '@/api/database.types';

// ❌ Wrong - Creating new client
const supabase = createClient(...);
```

### 4.2 Query Patterns

| ID | Rule | Severity |
|----|------|----------|
| D-004 | **Destructure response** — always use `{ data, error }` | 🔴 |
| D-005 | **Handle both states** — check `error` before using `data` | 🔴 |
| D-006 | **Return both values** — functions return `{ data, error }` | 🔴 |

```typescript
// ✅ Correct - Destructure and handle both states
const fetchData = async () => {
    const { data, error } = await database
        .from('properties')
        .select('*');
    return { data, error };
};

// ❌ Wrong - Ignoring error
const { data } = await database.from('properties').select('*');
return data;
```

### 4.3 Type Safety

| ID | Rule | Severity |
|----|------|----------|
| D-007 | **Use generated types** — `Database['public']['Tables']['table_name']['Row']` | 🔴 |
| D-008 | **Type query results** — explicit types for complex queries | 🟡 |

```typescript
// ✅ Correct - Using generated types
type Property = Database['public']['Tables']['properties']['Row'];
type PropertyInsert = Database['public']['Tables']['properties']['Insert'];

const { data }: { data: Property[] | null } = await database
    .from('properties')
    .select('*');
```

### 4.4 Error Handling

| ID | Rule | Severity |
|----|------|----------|
| D-009 | **No try-catch** — let `useAsync` handle exceptions | 🔴 |
| D-010 | **Display error messages** — show `error.message` to user | 🔴 |

```typescript
// ✅ Correct - Error handled in component
const state = useAsync(async () => {
    const { data, error } = await database.from('items').select('*');
    return { data, error };
}, []);

return (
    state.error ? <ErrorBanner msg={state.error.message} /> :
    state.value?.error ? <ErrorBanner msg={state.value.error.message} /> :
    <ItemList items={state.value?.data ?? []} />
);
```

### 4.5 Query Examples

**Select with filter:**
```typescript
const { data, error } = await database
    .from('properties')
    .select('id, name, status')
    .eq('landlord_id', userId)
    .order('created_at', { ascending: false });
```

**Insert:**
```typescript
const { data, error } = await database
    .from('properties')
    .insert({ name, address, landlord_id: userId })
    .select()
    .single();
```

**Update:**
```typescript
const { data, error } = await database
    .from('properties')
    .update({ name, status })
    .eq('id', propertyId)
    .select()
    .single();
```

**Delete:**
```typescript
const { error } = await database
    .from('properties')
    .delete()
    .eq('id', propertyId);
```

---

## 5. Project Rules

These rules are specific to this project.

### 4.1 File Structure

```
frontend/src/
├── api/           # Supabase client & types
├── app/           # Next.js pages (thin wrappers only)
├── components/    # UI components
├── constants/     # Labels, static data
├── hooks/         # Custom React hooks
├── routes/        # Centralized routing system
│   ├── index.ts   # Route generators and types
│   └── useRouteParams.ts  # Type-safe param reader
└── utils/         # Pure utility functions
```

### 4.2 Import Order

```typescript
// 1. React/Next
import { useState } from 'react';
import Link from 'next/link';

// 2. Third-party
import { useAsync } from 'react-use';

// 3. Project (api → hooks → components → utils → routes → constants)
import { database } from '@/api/database';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/Button/Button';
import { formatDate } from '@/utils/formatDate';
import { routes } from '@/routes';
import { LABELS } from '@/constants/labels';

// 4. Styles (last)
import styles from './Component.module.css';
```

### 4.3 Styling

| ID | Rule | Severity |
|----|------|----------|
| P-001 | **CSS Modules only** — no inline styles, no CSS-in-JS | 🔴 |
| P-002 | **camelCase class names** — `.cardHeader`, `.buttonPrimary` | 🟡 |

### 4.4 Environment Variables

```bash
# Required - must have NEXT_PUBLIC_ prefix
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

---

## Quick Reference Table

| ID | Rule | Level |
|----|------|-------|
| L-001 | `const` only, no `let`/`var` | Language |
| L-002 | `as const` for literal objects | Language |
| L-003 | Immutable class properties | Language |
| L-004 | No data mutation | Language |
| L-005 | Spread for updates | Language |
| L-006 | Single return from functions | Language |
| L-007 | No try-catch, use `{ data, error }` | Language |
| R-001 | Named exports (except pages) | React |
| R-004 | Immutable state updates | React |
| R-006 | `useAsync` for page load | React |
| R-007 | `useAsyncFn` for user actions | React |
| F-001 | Client-only architecture | Framework |
| F-004 | No dynamic routes, use URL params | Framework |
| F-005 | Centralized routing system | Framework |
| D-001 | Use `database` import from `@/api/database` | Database |
| D-004 | Destructure `{ data, error }` | Database |
| D-005 | Handle both error and data states | Database |
| D-007 | Use generated types from database.types | Database |
| P-001 | CSS Modules only | Project |
