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
| F-015 | **`useNavigate()`** for programmatic navigation — never `window.location.href` | 🔴 Critical |

### Layer 4: Project (CRUD Application Pattern)

| ID | Rule | Severity |
|----|------|----------|
| P-001 | **View* = Smart Orchestrator** — manages mode, formState, mutations; composes universal components | 🔴 Critical |
| P-002 | **ManyRecords = Smart-Universal** — fetches list data via injected query, entity-agnostic | 🔴 Critical |
| P-003 | **SingleRecordDetails = Controlled** — receives values + onChange, never fetches, never saves | 🔴 Critical |
| P-004 | **SingleRecordReference = Controlled** — receives referenceId + onChange, fetches only referenced record | 🔴 Critical |
| P-005 | **Data flows down** — parent passes data/queries/callbacks to children | 🔴 Critical |
| P-006 | **View* prefix = top-level** — only View* components are imported by pages | 🟠 High |
| P-007 | **Central column registry** — labels, renderers, inputs in `constants/columnRegistry.tsx` | 🔴 Critical |
| P-008 | **4-level resolution** — per-usage → table-specific → global → auto-deduce | 🔴 Critical |
| P-009 | **Locale pl-PL** — all UI labels in Polish | 🟠 High |
| P-010 | **ViewSingle owns formState** — all scalar fields + FK values in one state object | 🔴 Critical |
| P-011 | **ViewSingle controls mode** — `'view' \| 'edit' \| 'create'`, passed to children | 🔴 Critical |
| P-012 | **ViewSingle handles mutations** — INSERT/UPDATE/DELETE, children only report changes | 🔴 Critical |
| P-013 | **All 3 sections visible in every mode** — to-many sections disabled in create mode | 🟠 High |
| P-014 | **ManyRecords `query` prop** — function returning a fresh Supabase query builder | 🔴 Critical |
| P-015 | **ManyRecords applies `.order()` internally** — caller never adds sorting | 🔴 Critical |
| P-016 | **ManyRecords applies `.range()` internally** — server-side pagination | 🟠 High |
| P-017 | **ManyRecords uses column registry** — `tableName` resolves labels + renderers | 🔴 Critical |
| P-018 | **ManyRecords no domain imports** — entity-agnostic, lives in `components/shared/` | 🔴 Critical |
| P-019 | **SingleRecordDetails is controlled** — values + onChange from parent, no internal state | 🔴 Critical |
| P-020 | **Inline edit — no layout shift** — view↔edit transition keeps identical layout | 🔴 Critical |
| P-021 | **SingleRecordDetails uses column registry** — `tableName` resolves labels, renderers, inputs | 🔴 Critical |
| P-022 | **SingleRecordDetails no domain imports** — entity-agnostic | 🔴 Critical |
| P-023 | **SingleRecordReference is controlled** — referenceId + onChange from parent | 🔴 Critical |
| P-024 | **SingleRecordReference fetches only the referenced record** | 🔴 Critical |
| P-025 | **SingleRecordReference no domain imports** — entity-agnostic | 🔴 Critical |
| P-026 | **RecordPicker single-depth modal** — browse + create as internal tabs, no nesting | 🔴 Critical |
| P-027 | **RecordPicker no domain imports** — entity-agnostic | 🔴 Critical |
| P-028 | **Generic universals props-only** — Spinner, ErrorBanner, EmptyState, ConfirmDialog | 🔴 Critical |
| P-029 | **Generic universals no domain imports** — no `@/api/`, `@/hooks/`, `@/constants/` | 🔴 Critical |
| P-030 | **All universals in `components/shared/`** | 🟠 High |
