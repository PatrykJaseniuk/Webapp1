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
| F-008 | **All `.module.css` files in `components/styles/`** — never co-located with component | 🔴 Critical |
| F-009 | **Group by pattern, not by component** — one file per logical concern (forms, buttons, feedback, table, …) | 🔴 Critical |
| F-010 | **Shareable classes** — components import whichever style file matches the pattern they use; classes are reused across components | 🟠 High |
| F-011 | **File size budget** — keep each module under ~300 lines; split into a sibling file when growing past it | 🟠 High |
| F-012 | **camelCase class names** — `.cardHeader`, `.buttonPrimary` | 🟡 Recommended |
| F-013 | **Design tokens in `globals.css`** — colors, spacing, radii, shadows, transitions; never hard-code in module files | 🔴 Critical |
| F-014 | **No inline `style={...}`** except for dynamic CSS variables (e.g., `--page-size`) | 🟠 High |

Styles are organized by **component pattern**, not per individual component. All components of the same type share one CSS Module file. Design tokens (colors, spacing, etc.) live in `globals.css`.

### Directory layout

```
frontend/src/components/styles/
├── appShell.module.css        ← AppLayout, Sidebar, RoleGuard, Container
├── buttons.module.css         ← .buttonPrimary, .buttonSecondary, .buttonDanger
├── cellRenderers.module.css   ← basic cells: null, text, number, currency, date, boolean, enum, status
├── forms.module.css           ← auth forms, generic form layout (used by login, signup, future forms)
├── feedback.module.css        ← Spinner, ErrorBanner, EmptyState, ConfirmDialog
├── inputRenderers.module.css  ← form inputs, textareas, selects, currency input
├── manyRecords.module.css     ← table mode, cards mode, list mode, pagination, skeleton, toolbar
├── relationCells.module.css   ← nested-relation cells: cellRelation*, cellLease*, cellTransaction*
├── singleRecord.module.css    ← details, reference, recordPicker
└── pageLayout.module.css      ← page headers, titles, actions (shared by viewAll* and viewSingle* components)
```

### When to split a CSS Module file

| Guideline | Action |
|-----------|--------|
| File exceeds **~300 lines** | Split into a logical sibling file |
| A file contains **3+ unrelated component patterns** | Separate each pattern into its own file |
| A pattern is used by **components in different subdirectories** | Ensure it lives in a shared file (not component-specific) |

### Importing styles

```typescript
// Single import — one pattern group
import styles from '@/components/styles/feedback.module.css';

// Multiple imports — different pattern groups
import styles from '@/components/styles/singleRecord.module.css';
import pageStyles from '@/components/styles/pageLayout.module.css';
import btnStyles from '@/components/styles/buttons.module.css';
```



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

