# Frontend Style Guide — Layer 3: Framework (Next.js)

**Scope:** Next.js-specific patterns — routing, layouts, static export, styling, project structure.  
**Back to:** [Frontend Style Guide](./FRONTEND_STYLE_GUIDE.md) · **Depends on:** [Language Rules](./FRONTEND_STYLE_GUIDE_LANGUAGE.md) · [Library Rules](./FRONTEND_STYLE_GUIDE_LIBRARY.md)

---

## 3.1 Client-Only Architecture

| ID | Rule | Severity |
|----|------|----------|
| F-001 | **Client-only** — NO server components, SSR, middleware, API routes | 🔴 Critical |
| F-002 | **Static export** — `output: 'export'` for GitHub Pages | 🔴 Critical |

This is a **fully client-side application**:

```
✅ Allowed                              ❌ Forbidden
────────────────────────────────────────────────────────
Static Export (SSG) → GitHub Pages      Server components
All data fetching: browser → Supabase   Server-side rendering (SSR)
All state in client (localStorage)      Middleware
URL search params for views             API routes (/api/*)
Client-side validation (UX only)        getServerSideProps / getStaticProps
                                        Dynamic routes ([id], [slug])
```

### next.config.ts

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',              // Static export for GitHub Pages
  images: { unoptimized: true }, // Required for SSG
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? '',
  // ❌ NO API routes (not supported with static export)
};

export default nextConfig;
```

---

## 3.2 `'use client'` Directive

| ID | Rule | Severity |
|----|------|----------|
| F-003 | **`'use client'`** on all components & hooks, NOT on pages/layouts | 🔴 Critical |

| File Type | `'use client'` | Why |
|-----------|:-:|------|
| Root layout (`app/layout.tsx`) | ❌ NO | SSG entry point |
| Route layouts (`app/*/layout.tsx`) | ❌ NO | Thin wrappers importing client components |
| Page files (`app/*/page.tsx`) | ✅ YES | Use `useSearchParams` / `useRouteParams` |
| All components (`components/*`) | ✅ YES | Use React hooks, browser APIs, events |
| All hooks (`hooks/*`) | ✅ YES | Use React hooks |
| Routes utilities (`routes/*`) | ✅ YES | Use `useSearchParams` |
| Pure utils (`utils/*`) | ❌ NO | No React, no browser APIs |
| Constants (`constants/*`) | ❌ NO | Plain data |

```typescript
// app/layout.tsx — NO 'use client' (SSG entry point)
import './globals.css';
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}

// app/landlord/layout.tsx — NO 'use client' (imports client components)
import { AppLayout } from "@/components/shared/AppLayout";
import { RoleGuard } from "@/components/shared/RoleGuard";

export default function LandlordLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['landlord', 'admin']}>
      <AppLayout>{children}</AppLayout>
    </RoleGuard>
  );
}

// components/shared/Button.tsx — YES 'use client' (interactive)
'use client';
export const Button = ({ label, onClick }: ButtonProps) => ( ... );
```

> **Note:** `export default function` is the only place the `function` keyword is allowed — required by Next.js for pages and layouts.

---

## 3.3 No Dynamic Routes — URL Search Params

| ID | Rule | Severity |
|----|------|----------|
| F-004 | **No dynamic routes** — no `[id]`, `[slug]`; use `?id=xxx` search params | 🔴 Critical |

With `output: 'export'`, Next.js cannot generate pages for unknown dynamic segments.

```
❌ WRONG:   /landlord/properties/[id]/page.tsx    → won't work with static export
✅ CORRECT: /landlord/properties/page.tsx          → uses ?id=xxx, ?action=new
```

**URL patterns:**

```
/landlord/properties              → List view
/landlord/properties?id=abc-123   → Detail/edit view
/landlord/properties?action=new   → Create new item
```

---

## 3.4 Centralized Routing System

| ID | Rule | Severity |
|----|------|----------|
| F-005 | **Centralized routing** — all routes in `routes/index.ts`, no hardcoded paths | 🔴 Critical |

### Route Param Types

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

### Route Generators

```typescript
// routes/index.ts
const buildUrl = (base: string, params?: Record<string, string | undefined>): string => {
  const entries = Object.entries(params ?? {}).filter(
    (entry): entry is [string, string] => entry[1] !== undefined,
  );
  const qs = new URLSearchParams(entries).toString();
  return qs ? `${base}?${qs}` : base;
};

export const routes = {
  home: () => '/',
  login: () => '/login',
  signup: () => '/signup',

  landlord: {
    dashboard: () => '/landlord',
    properties: (params?: PropertyRouteParams) => buildUrl('/landlord/properties', params),
    tenants: (params?: TenantRouteParams) => buildUrl('/landlord/tenants', params),
    leases: (params?: LeaseRouteParams) => buildUrl('/landlord/leases', params),
  },

  tenant: {
    dashboard: () => '/tenant/dashboard',
    properties: () => '/tenant/properties',
  },
};

export const ROLE_REDIRECTS: Record<string, string> = {
  tenant: routes.tenant.dashboard(),
  landlord: routes.landlord.dashboard(),
};
```

### Type-Safe Param Reader

```typescript
// routes/useRouteParams.ts
'use client';
import { useSearchParams } from 'next/navigation';

export const useRouteParams = <T extends Record<string, string | undefined>>(): T => {
  const searchParams = useSearchParams();
  return new Proxy({} as T, {
    get: (_, prop: string) => searchParams.get(prop) ?? undefined,
  });
};
```

### Usage

```typescript
// ❌ Wrong — hardcoded paths
<Link href="/landlord/properties?id=123">
<Link href="/landlord/properties?action=new">

// ✅ Correct — centralized routes
import { routes } from '@/routes';

<Link href={routes.landlord.properties({ id: '123' })}>
<Link href={routes.landlord.properties({ action: 'new' })}>
```

---

## 3.5 Page Components — Thin Wrappers & Mini-Routers

| ID | Rule | Severity |
|----|------|----------|
| F-006 | **Pages are thin wrappers** — delegate to components, act as mini-routers via search params | 🔴 Critical |

Pages read URL search params and render the appropriate component:

```typescript
// app/landlord/properties/page.tsx
'use client';
import type { PropertyRouteParams } from '@/routes';
import { useRouteParams } from '@/routes/useRouteParams';
import { AllPropertiesList } from '@/components/landlord/ViewAllProperties';
import { PropertySingle } from '@/components/landlord/ViewSingleProperty';

export default () => {
  const { id, action } = useRouteParams<PropertyRouteParams>();

  return (
    action === 'new' ? <PropertySingle /> :
    id ? <PropertySingle id={id} /> :
    <AllPropertiesList />
  );
};
```

**Rules for pages:**
- ❌ No business logic in page files
- ❌ No data fetching in page files
- ❌ No styling in page files
- ✅ Only read params and delegate to components

---

## 3.6 Layout Files & Role-Based Route Groups

| ID | Rule | Severity |
|----|------|----------|
| F-007 | **Role-based layouts** — `RoleGuard` in layout files per route group | 🔴 Critical |

Each user role has its own route group with a layout that enforces access:

```
app/
├── layout.tsx              ← Root layout (HTML shell, no RoleGuard)
├── page.tsx                ← Public home page
├── login/page.tsx          ← Public login
├── signup/page.tsx         ← Public signup
├── landlord/
│   ├── layout.tsx          ← RoleGuard(['landlord', 'admin']) + AppLayout
│   ├── page.tsx            ← Dashboard
│   ├── properties/page.tsx ← Properties mini-router
│   ├── tenants/page.tsx    ← Tenants mini-router
│   └── leases/page.tsx     ← Leases mini-router
└── tenant/
    ├── layout.tsx          ← RoleGuard(['tenant']) + AppLayout
    └── dashboard/page.tsx  ← Tenant dashboard
```

### RoleGuard Pattern

```typescript
// components/shared/RoleGuard.tsx
'use client';
import Link from 'next/link';
import { routes } from '@/routes';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Spinner } from '@/components/shared/Spinner';
import styles from '@/components/styles/shared.module.css';

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

export const RoleGuard = ({ allowedRoles, children }: RoleGuardProps) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();

  return (
    authLoading || roleLoading ? <Spinner /> :
    !isAuthenticated ? (
      <div className={styles.container}>
        <h2>Login required</h2>
        <Link href={routes.login()}>Go to login</Link>
      </div>
    ) :
    !(role && allowedRoles.includes(role)) ? (
      <div className={styles.container}>
        <h2>Access denied</h2>
        <Link href={routes.home()}>Return home</Link>
      </div>
    ) :
    <>{children}</>
  );
};
```

---

## 3.7 Styling — Group-Level CSS Modules

| ID | Rule | Severity |
|----|------|----------|
| F-008 | **Group-level CSS Modules** — one `.module.css` per component pattern, not per component | 🟠 High |
| F-009 | **camelCase CSS classes** — `.cardHeader`, `.buttonPrimary` | 🟡 Recommended |

Styles are organized by **component pattern**, not per individual component. All components of the same type share one CSS Module file. Design tokens (colors, spacing, etc.) live in `globals.css`.

### Style file mapping

| Component pattern | CSS Module file | Example components |
|------------------|-----------------|-------------------|
| `ViewAll*.tsx` | `styles/viewAll.module.css` | ViewAllProperties, ViewAllTenants |
| `ViewSingle*.tsx` | `styles/viewSingle.module.css` | ViewSingleProperty, ViewSingleLease |
| `shared/*.tsx` | `styles/shared.module.css` | Spinner, ErrorBanner, ManyRecords, SingleRecordDetails, SingleRecordReference, RecordPicker, ConfirmDialog, AppLayout, RoleGuard |
| `auth/*.tsx` | `styles/auth.module.css` | LoginForm, SignupForm |
| Pages (`app/*/page.tsx`) | No styles | Thin wrappers only |

### Design tokens in globals.css

```css
/* app/globals.css — design tokens + reset */
:root {
  --color-primary: #2563eb;
  --color-error: #dc2626;
  --color-success: #16a34a;
  --color-text: #1f2937;
  --color-muted: #6b7280;
  --color-border: #e5e7eb;
  --color-bg: #ffffff;
  --color-bg-subtle: #f9fafb;
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --radius: 0.375rem;
  --shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
```

### Usage

```typescript
// FormProperty.tsx — imports group-level form styles
'use client';
import styles from '@/components/styles/form.module.css';

export const FormProperty = ({ data, onSuccess }: FormPropertyProps) => (
  <form className={styles.form}>
    <div className={styles.field}>
      <label className={styles.label}>Name</label>
      <input className={styles.input} value={name} onChange={...} />
    </div>
    <button className={styles.submitButton}>Save</button>
  </form>
);

// FormTenant.tsx — imports the SAME group-level form styles
'use client';
import styles from '@/components/styles/form.module.css';

export const FormTenant = ({ data, onSuccess }: FormTenantProps) => (
  <form className={styles.form}>
    <div className={styles.field}>
      <label className={styles.label}>Email</label>
      <input className={styles.input} value={email} onChange={...} />
    </div>
    <button className={styles.submitButton}>Save</button>
  </form>
);
```

### Rules

```typescript
// ✅ Correct — group-level CSS Module
import styles from '@/components/styles/form.module.css';
import styles from '@/components/styles/shared.module.css';

// ✅ Correct — combining classes
<div className={`${styles.card} ${styles.active}`}>

// ❌ Wrong — per-component CSS Module
import styles from './Button.module.css';

// ❌ Wrong — inline styles
<div style={{ color: 'red' }}>

// ❌ Wrong — CSS-in-JS
const StyledButton = styled.button`...`;
```

---

## 3.8 Environment Variables

| ID | Rule | Severity |
|----|------|----------|
| F-010 | **`NEXT_PUBLIC_`** prefix required on all frontend env vars | 🔴 Critical |

```bash
# .env.local (development)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
NEXT_PUBLIC_BASE_PATH=

# .env.production (deployed)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod_key...
NEXT_PUBLIC_BASE_PATH=/Webapp1
```

All frontend env vars are embedded in static HTML at build time — they must have the `NEXT_PUBLIC_` prefix.

---

## 3.9 Security Model

| ID | Rule | Severity |
|----|------|----------|
| F-011 | **Security is UX only** — client validation for UX, real security via RLS | 🔴 Critical |

```
Client-side (this app)     → UX convenience only (can be bypassed)
Database RLS (Supabase)    → REAL security (cannot be bypassed)
```

- `RoleGuard` prevents UI navigation but is **not security** — it's UX
- All data access is controlled by **Row Level Security (RLS)** in the database
- Even without `RoleGuard`, users cannot access data they're not authorized for (RLS enforces it)
- See [Backend Style Guide § RLS](./BACKEND_STYLE_GUIDE.md#row-level-security-rls) for security rules

---

## 3.10 File Structure

```
frontend/src/
├── api/                    # Supabase client & generated types ONLY
│   ├── database.ts         # Single Supabase client instance
│   └── database.types.ts   # Auto-generated (supabase gen types)
├── app/                    # Next.js App Router — pages & layouts only
│   ├── layout.tsx          # Root layout (HTML shell)
│   ├── page.tsx            # Home page
│   └── [feature]/          # Feature route groups
│       ├── layout.tsx      # Role guard + app layout
│       └── page.tsx        # Thin wrapper / mini-router
├── components/             # UI components (all have 'use client')
│   ├── styles/             # Group-level CSS Modules (see §3.7)
│   │   ├── shared.module.css    # ManyRecords, SingleRecordDetails, SingleRecordReference,
│   │   │                        # RecordPicker, ConfirmDialog, Spinner, ErrorBanner, AppLayout, RoleGuard
│   │   ├── auth.module.css      # LoginForm, SignupForm
│   │   ├── viewAll.module.css   # All ViewAll* components
│   │   └── viewSingle.module.css # All ViewSingle* components
│   ├── shared/             # Universal components (ManyRecords, SingleRecordDetails,
│   │                       # SingleRecordReference, RecordPicker, ConfirmDialog,
│   │                       # Spinner, ErrorBanner, EmptyState, AppLayout, RoleGuard, Sidebar)
│   ├── auth/               # Auth components (LoginForm, SignupForm)
│   └── [feature]/          # Feature View* components (landlord/, tenant/)
├── constants/              # Static data, column registry
│   └── columnRegistry.tsx  # Central column config: labels, renderers, inputs, validation
├── hooks/                  # Custom React hooks (all have 'use client')
│   ├── useAuth.ts
│   └── useUserRole.ts
├── routes/                 # Centralized routing system
│   ├── index.ts            # Route generators, param types, ROLE_REDIRECTS
│   └── useRouteParams.ts   # Type-safe search param reader
└── utils/                  # Pure utility functions (no 'use client')
    ├── formatDate.ts
    └── formatCurrency.ts
```

### Path Rules

- **`@/` alias** — maps to `frontend/src/`, always use for cross-directory imports
- **Relative `./`** — only for same-directory imports (e.g., CSS modules)
- **New component** → `components/[scope]/ComponentName.tsx` (styles in `components/styles/`)
- **New hook** → `hooks/use[Name].ts`
- **New page** → `app/[route]/page.tsx` (thin wrapper only)
- **Never put business logic in `app/` files**

---

## 3.11 Import Order

| ID | Rule | Severity |
|----|------|----------|
| F-012 | **`@/` import alias** — never relative paths for cross-directory | 🟠 High |
| F-013 | **Import order** as below, separated by blank lines | 🟠 High |

```typescript
// 1. React / Next.js core
import { useState } from 'react';
import Link from 'next/link';

// 2. Third-party libraries
import { useAsync, useAsyncFn } from 'react-use';

// 3. Project: API layer
import { database } from '@/api/database';
import type { Database } from '@/api/database.types';

// 4. Project: Hooks
import { useAuth } from '@/hooks/useAuth';

// 5. Project: Components
import { Button } from '@/components/shared/Button';
import { Spinner } from '@/components/shared/Spinner';

// 6. Project: Utilities
import { formatDate } from '@/utils/formatDate';

// 7. Project: Routes
import { routes } from '@/routes';
import type { PropertyRouteParams } from '@/routes';

// 8. Project: Constants
import { PROPERTY_STATUS_LABELS } from '@/constants/labels';

// 9. Styles (always last — group-level CSS Module)
import styles from '@/components/styles/form.module.css';
```

**Rules:**
- Use `import type` for type-only imports
- Named exports only — no default exports (except Next.js pages)
- Each group separated by a blank line

---

## 3.12 Accessibility

| ID | Rule | Severity |
|----|------|----------|
| F-014 | **Semantic HTML** — `role="alert"` on errors, `<form>`, `<button>`, `<label>` | 🟡 Recommended |

```typescript
// ✅ Correct — semantic elements
<form onSubmit={handleSubmit}>
<button type="submit">Save</button>
<div role="alert">Error message</div>
<label htmlFor="name">Name</label>
<input id="name" ... />

// ❌ Wrong — non-semantic
<div onClick={handleSubmit}>Save</div>
<span className="error">Error message</span>
```
