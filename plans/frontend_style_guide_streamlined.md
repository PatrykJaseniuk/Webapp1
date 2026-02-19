# Frontend Style Guide - Streamlined Proposal

**Purpose:** Essential rules for Next.js/React frontend. Guide for LLMs.  
**Tech Stack:** Next.js 16.1.4 | React 19.2.3 | TypeScript 5.x | Supabase JS 2.91.x | react-use 17.6.x

---

## Critical Rules (Must Follow)

| ID | Rule | Severity |
|----|------|----------|
| F-001 | **Functional style only** —  `const`, `as const` | 🔴 |
| F-002 | **Client-only architecture** — NO server components, SSR, middleware | 🔴 |
| F-003 | **No try-catch** — use `{ data, error }` pattern or `.catch()` | 🔴 |
| F-004 | **No let/var** — always `const` | 🔴 |
| F-006 | **CSS Modules only** — no inline styles, no CSS-in-JS | 🔴 |
| F-007 | **NEXT_PUBLIC_ prefix** — required on all env vars | 🔴 |
| F-008 | **Centralized routing** — use router config, no ad-hoc navigation | 🔴 |
| F-009 | **single return** - functions return value on the end of it's code, not in the multiple places.|🔴|

---

## Architecture: Client-Only + Static Export

```
✅ Static Export (SSG) → GitHub Pages
✅ All data fetching from browser → Supabase
✅ URL search params for detail/edit views (?id=xxx)
❌ NO server components, SSR, middleware, API routes
❌ NO dynamic routes ([id], [slug]) — incompatible with static export
```

### 'use client' Directive

- **Root layout** — NO directive (SSG entry point)
- **Page components** — NO directive (thin wrappers)
- **All components/hooks** — YES directive (interactive)

---

## Centralized Routing System

### Router Configuration

All routes defined in a single configuration file:

```typescript
// config/routes.ts
export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  
  // Landlord routes
  LANDLORD: {
    DASHBOARD: '/landlord',
    PROPERTIES: '/landlord/properties',
    TENANTS: '/landlord/tenants',
    LEASES: '/landlord/leases',
    TRANSACTIONS: '/landlord/transactions',
  },
  
  // Tenant routes
  TENANT: {
    DASHBOARD: '/tenant',
    PAYMENTS: '/tenant/payments',
  },
} as const;

// Route helpers with type safety
export const getRoute = {
  propertyDetail: (id: string) => `${ROUTES.LANDLORD.PROPERTIES}?id=${id}`,
  propertyNew: () => `${ROUTES.LANDLORD.PROPERTIES}?action=new`,
  tenantDetail: (id: string) => `${ROUTES.LANDLORD.TENANTS}?id=${id}`,
};
```

### Navigation Hook

```typescript
// hooks/useRouter.ts
'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { ROUTES, getRoute } from '@/config/routes';

export const useAppRouter = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  return {
    // Navigation
    goTo: (path: string) => router.push(path),
    goBack: () => router.back(),
    
    // Route helpers
    routes: ROUTES,
    getRoute,
    
    // Current state
    currentId: searchParams.get('id'),
    currentAction: searchParams.get('action'),
  };
};
```

### Usage in Components

```typescript
// Instead of hardcoded paths:
<Link href="/landlord/properties?id=123">Property</Link>

// Use centralized routes:
const { routes, getRoute } = useAppRouter();
<Link href={getRoute.propertyDetail('123')}>Property</Link>
```

---

## File Structure

```
frontend/src/
├── api/           # Supabase client & types
├── app/           # Next.js pages (thin wrappers only)
├── components/    # UI components
├── config/        # Routes, constants, feature flags
├── hooks/         # Custom React hooks
└── utils/         # Pure utility functions
```

**Rules:**
- Import alias: `@/` maps to `frontend/src/`
- Business logic in components/hooks, NOT in `app/` pages
- Utility functions in `utils/`, NOT in component files

---

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Components | PascalCase | `Button.tsx`, `ItemList.tsx` |
| Hooks | camelCase + use prefix | `useAuth.ts` |
| Utilities | camelCase | `formatDate.ts` |
| Types | PascalCase + Props suffix | `ButtonProps` |
| CSS classes | camelCase | `.cardHeader` |
| Constants | UPPER_SNAKE_CASE | `MAX_ITEMS` |

---

## Data Fetching Patterns

### Page Load: useAsync

```typescript
const state = useAsync(async () => {
  const { data, error } = await database.from('items').select('*');
  return { data, error };
}, []);

return (
  state.loading ? <Spinner /> :
  state.error ? <ErrorBanner msg={state.error.message} /> :
  state.value?.error ? <ErrorBanner msg={state.value.error.message} /> :
  <ItemList items={state.value?.data ?? []} />
);
```

### User Actions: useAsyncFn

```typescript
const [state, submit] = useAsyncFn(async (data: FormData) => {
  const { data: result, error } = await database.from('items').insert(data);
  return { data: result, error };
}, []);

// Call submit() on button click, handle state.loading, state.error
```

### Refetch Pattern

```typescript
const [refreshKey, setRefreshKey] = useState(0);
const state = useAsync(fetchData, [refreshKey]);
const refresh = () => setRefreshKey(k => k + 1);
```

---

## Conditional Rendering

```typescript
// Single condition
{condition && <Component />}

// Two conditions  
{condition ? <A /> : <B />}

// Multiple states
{loading ? <Spinner /> :
 error ? <ErrorBanner /> :
 <Content />}
```

---

## Import Order

```typescript
// 1. React/Next
import { useState } from 'react';
import Link from 'next/link';

// 2. Third-party
import { useAsync } from 'react-use';

// 3. Project (in order: api → hooks → components → utils → config)
import { database } from '@/api/database';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/Button/Button';
import { formatDate } from '@/utils/formatDate';
import { ROUTES } from '@/config/routes';

// 4. Styles (last)
import styles from './Component.module.css';
```

---

## Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

---

## What Was Removed (Now Unnecessary)

The following sections from the original guide were removed as non-essential:
- Detailed component structure examples (follow naming conventions)
- Authentication flow patterns (use existing `useAuth` hook)
- SSG configuration details (already configured)
- Error handling decision trees (use `{ data, error }` pattern)

---

## Summary: What Changed

| Change | Reason |
|--------|--------|
| Added F-008 Centralized Routing | Prevents hardcoded paths, enables type-safe navigation |
| Removed verbose examples | Focus on rules, not implementations |
| Removed F-004 (no if statements) | Too restrictive, practical code needs conditionals |
| Added config/ directory | Centralized routes and constants |
| Condensed data fetching | Keep patterns, remove repetition |
