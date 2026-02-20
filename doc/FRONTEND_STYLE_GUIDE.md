# Frontend Style Guide

**Purpose:** Code generation rules for Next.js/React frontend. Guide for LLMs.  
**Tech Stack:** Next.js 16.1.4 | React 19.2.3 | TypeScript 5.x | Supabase JS 2.91.x | react-use 17.6.x  
**Related:** [Backend Style Guide](./BACKEND_STYLE_GUIDE.md) · [System Architecture Guide](./SYSTEM_ARCHITECTURE_GUIDE.md)

---

## How to Use This Guide

Rules are organized in **4 layers**, from general to specific:

| Layer | File | Scope | Applies to |
|-------|------|-------|------------|
| **1. Language** | [FRONTEND_STYLE_GUIDE_LANGUAGE.md](./FRONTEND_STYLE_GUIDE_LANGUAGE.md) | TypeScript | All `.ts` / `.tsx` files |
| **2. Library** | [FRONTEND_STYLE_GUIDE_LIBRARY.md](./FRONTEND_STYLE_GUIDE_LIBRARY.md) | React + Supabase | Components, hooks, data fetching |
| **3. Framework** | [FRONTEND_STYLE_GUIDE_FRAMEWORK.md](./FRONTEND_STYLE_GUIDE_FRAMEWORK.md) | Next.js | Routing, layouts, static export, styling |
| **4. Project** | [FRONTEND_STYLE_GUIDE_PROJECT.md](./FRONTEND_STYLE_GUIDE_PROJECT.md) | CRUD App | Stratified components, entity patterns, relationships |

When generating code, apply rules in order: **Language → Library → Framework → Project**.

---

## Quick Reference — All Rules

### Layer 1: Language (TypeScript)

| ID | Rule | Severity |
|----|------|----------|
| L-001 | **`const` only** — no `let`, no `var` | 🔴 Critical |
| L-002 | **No data mutation** — never modify objects/arrays in place | 🔴 Critical |
| L-003 | **Spread for updates** — `{ ...obj, field: value }`, `[...arr, item]` | 🔴 Critical |
| L-004 | **`as const`** for literal/config objects | 🟠 High |
| L-005 | **`Readonly<T>`** for function parameters | 🟡 Recommended |
| L-006 | **Arrow functions** — `const fn = () => {}` | 🔴 Critical |
| L-007 | **No classes** — purely functional | 🔴 Critical |
| L-008 | **No `enum`** — use union types or `as const` | 🔴 Critical |
| L-009 | **No loops** — use `.map()`, `.filter()`, `.reduce()`, `.find()`, `.some()`, `.every()` | 🔴 Critical |
| L-010 | **Pure utility functions** — no side effects in `utils/` | 🟠 High |
| L-011 | **No `if`/`else`** — use `? :`, `&&`, `\|\|`, `??` | 🔴 Critical |
| L-012 | **No `switch`** — use object lookup maps | 🔴 Critical |
| L-013 | **Single return** — no early returns | 🔴 Critical |
| L-014 | **Nullish coalescing `??`** for defaults | 🟠 High |
| L-015 | **Optional chaining `?.`** for safe access | 🟠 High |
| L-016 | **No `try-catch`** — use `{ data, error }` or `.catch()` | 🔴 Critical |
| L-017 | **Result pattern** — return `{ data, error }` not throw | 🔴 Critical |
| L-018 | **No `any`** — use `unknown` | 🔴 Critical |
| L-019 | **No `!` assertion** — use `??` or `?.` | 🔴 Critical |
| L-020 | **`import type`** for type-only imports | 🟠 High |
| L-021 | **Template literals** over concatenation | 🟡 Recommended |

### Layer 2: Library (React + Supabase)

| ID | Rule | Severity |
|----|------|----------|
| R-001 | **Named exports** — no default exports (except Next.js pages) | 🔴 Critical |
| R-002 | **Props interface** — `ComponentNameProps` for every component | 🔴 Critical |
| R-003 | **Destructure props** in function signature with defaults | 🟠 High |
| R-004 | **Immutable state** — never mutate state directly | 🔴 Critical |
| R-005 | **Functional updaters** — `prev =>` for state based on previous | 🔴 Critical |
| R-006 | **`useAsync`** for data on mount/load | 🔴 Critical |
| R-007 | **`useAsyncFn`** for data on user action | 🔴 Critical |
| R-008 | **refreshKey pattern** for refetch after mutation | 🟠 High |
| R-009 | **No index as `key`** — use unique IDs in `.map()` | 🔴 Critical |
| R-010 | **Single `database` import** — from `@/api/database`, never create new clients | 🔴 Critical |
| R-011 | **Destructure `{ data, error }`** from every Supabase call | 🔴 Critical |
| R-012 | **Use generated types** — `Database['public']['Tables']['name']['Row']` | 🔴 Critical |
| R-013 | **3-level error display** — hook error → loading → data error → success | 🔴 Critical |

### Layer 3: Framework (Next.js)

| ID | Rule | Severity |
|----|------|----------|
| F-001 | **Client-only architecture** — NO server components, SSR, middleware, API routes | 🔴 Critical |
| F-002 | **Static export** — `output: 'export'` for GitHub Pages | 🔴 Critical |
| F-003 | **`'use client'`** on all components & hooks (NOT on pages/layouts) | 🔴 Critical |
| F-004 | **No dynamic routes** — no `[id]`, `[slug]`; use `?id=xxx` search params | 🔴 Critical |
| F-005 | **Centralized routing** — `routes/index.ts`, no hardcoded paths | 🔴 Critical |
| F-006 | **Pages are thin wrappers** — delegate to components, act as mini-routers | 🔴 Critical |
| F-007 | **Role-based layouts** — `RoleGuard` in layout files per route group | 🔴 Critical |
| F-008 | **Group-level CSS Modules** — one `.module.css` per component pattern, not per component | 🟠 High |
| F-009 | **camelCase CSS classes** — `.cardHeader`, `.buttonPrimary` | 🟡 Recommended |
| F-010 | **`NEXT_PUBLIC_`** prefix on all env vars | 🔴 Critical |
| F-011 | **Security is UX only** — client validation for UX, real security via RLS | 🔴 Critical |
| F-012 | **`@/` import alias** — never relative paths for cross-directory imports | 🟠 High |
| F-013 | **Import order** — React → Third-party → API → Hooks → Components → Utils → Routes → Constants → Styles | 🟠 High |
| F-014 | **Semantic HTML** — use `role="alert"` on errors, proper `<form>`, `<button>`, etc. | 🟡 Recommended |

### Layer 4: Project (CRUD Application Pattern)

| ID | Rule | Severity |
|----|------|----------|
| P-001 | **View* = Smart** — orchestrates, fetches single records via `useAsync` | 🔴 Critical |
| P-002 | **DataTable = Smart-Universal** — fetches lists via injected `query` prop, entity-agnostic | 🔴 Critical |
| P-003 | **Form* = Presentational** — receives all data via props, never fetches | 🔴 Critical |
| P-004 | **Data flows down** — parent passes data/queries to children | 🔴 Critical |
| P-005 | **View* prefix = top-level** — components named `View*` are imported by pages | 🟠 High |
| P-006 | **Form* data prop** — `data?: Entity` (undefined = create, defined = view/edit) | 🔴 Critical |
| P-007 | **Form* never fetches** — all data comes from parent View* | 🔴 Critical |
| P-008 | **Form* calls onSuccess** — mutation callback to parent for refresh | 🟠 High |
| P-009 | **DataTable `query` prop** — function returning a fresh Supabase query builder | 🔴 Critical |
| P-010 | **DataTable applies `.order()` internally** — caller never adds sorting | 🔴 Critical |
| P-011 | **DataTable applies `.range()` internally** — server-side pagination | 🟠 High |
| P-012 | **DataTable auto-deduces columns** — from response keys, raw DB column names as headers | 🔴 Critical |
| P-013 | **DataTable no domain imports** — entity-agnostic, lives in `components/shared/` | 🔴 Critical |
| P-014 | **Generic universals props-only** — Spinner, ErrorBanner, EmptyState | 🔴 Critical |
| P-015 | **Generic universals handle edge cases** — loading, empty, error states | 🟠 High |
| P-016 | **Generic universals no domain imports** — no `@/api/`, `@/hooks/`, `@/constants/` | 🔴 Critical |
| P-017 | **All universals in shared/** — all generic components in `components/shared/` | 🟠 High |
| P-018 | **Label maps** — `Record<string, string>` in `constants/labels.ts` | 🟠 High |
| P-019 | **Label naming** — `[ENTITY]_[FIELD]_LABELS` in UPPER_SNAKE_CASE | 🟠 High |
| P-020 | **Locale pl-PL** — all UI labels in Polish | 🟠 High |
