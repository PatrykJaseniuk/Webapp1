# Frontend Style Guide — Layer 4: Project (CRUD Application Pattern)

**Scope:** Stratified component design for presenting a relational database to users.  
**Back to:** [Frontend Style Guide](./FRONTEND_STYLE_GUIDE.md) · **Depends on:** [Language](./FRONTEND_STYLE_GUIDE_LANGUAGE.md) · [Library](./FRONTEND_STYLE_GUIDE_LIBRARY.md) · [Framework](./FRONTEND_STYLE_GUIDE_FRAMEWORK.md)

---

## 4.1 Component Stratification

Components are organized in **3 levels** by responsibility. Data flows top-down only.

```
Level 0: Page          (app/*/page.tsx)      — reads URL params, dispatches
  ↓
Level 1: View*         (View*.tsx)           — SMART: orchestrates, fetches single records
  ↓
Level 2: Form*         (Form*.tsx)           — PRESENTATIONAL: entity fields via props
  ↓
Universal: DataTable   (shared/DataTable)    — SMART-UNIVERSAL: receives query, fetches + renders lists
Universal: Spinner, ErrorBanner, etc.        — GENERIC: entity-agnostic, props-only
```

| Level | Prefix | Fetches data? | Domain knowledge? | Example |
|-------|--------|:---:|:---:|---------|
| **0. Page** | `app/*/page.tsx` | ❌ | ❌ (only URL params) | mini-router |
| **1. View*** | `View*.tsx` | ✅ single record only | ✅ knows entity | `ViewAllProperties`, `ViewSingleTenant` |
| **2. Form*** | `Form*.tsx` | ❌ props only | ✅ knows entity fields | `FormProperty`, `FormTenant` |
| **U. DataTable** | `shared/DataTable.tsx` | ✅ via injected query | ❌ entity-agnostic | auto-deduces columns, sorts, paginates |
| **U. Generic** | `shared/*.tsx` | ❌ props only | ❌ entity-agnostic | `Spinner`, `ErrorBanner`, `EmptyState` |

### Rules

| ID | Rule | Severity |
|----|------|----------|
| P-001 | **View* = Smart** — View* orchestrates; fetches single records via `useAsync` | 🔴 Critical |
| P-002 | **DataTable = Smart-Universal** — fetches list data via injected query, entity-agnostic | 🔴 Critical |
| P-003 | **Form* = Presentational** — receives all data via props, never fetches | 🔴 Critical |
| P-004 | **Data flows down** — parent passes data/queries to children | 🔴 Critical |
| P-005 | **View* prefix = top-level** — components named `View*` are imported by pages | 🟠 High |

---

## 4.2 Entity Component Set

Each database entity gets **3 component files**:

```
components/[role]/
├── ViewAll[Entity].tsx      ← Level 1: wraps DataTable with a query
├── ViewSingle[Entity].tsx   ← Level 1: fetches single record, composes Form* + DataTable for related
└── Form[Entity].tsx         ← Level 2: entity's own fields (detail/edit/create)
```

### Composition diagram

```
ViewAll[Entity] (wraps DataTable with entity query)
  └── DataTable (fetches all records, auto-deduces columns, sorts, paginates)

ViewSingle[Entity] (fetches single record + orchestrates)
  ├── Form[Entity] (entity's own fields — view/edit/create)
  ├── DataTable (related child records — fetches via query)
  ├── DataTable (related child records — fetches via query)
  └── DataTable (attachments — fetches via query)
```

**DataTable is reusable in both contexts:**
1. `ViewAll[Entity]` passes a full-table query
2. `ViewSingle[Parent]` passes filtered queries (`.eq('parent_id', id)`) for related records

---

## 4.3 Level 1: View* Components (Smart)

### ViewAll Pattern

ViewAll wraps DataTable with the entity's query. Minimal code:

```typescript
// components/[role]/ViewAllProperties.tsx
'use client';
import { database } from '@/api/database';
import { routes } from '@/routes';
import { DataTable } from '@/components/shared/DataTable';

export const ViewAllProperties = () => (
  <DataTable
    query={() => database.from('properties').select('*')}
    hiddenColumns={['created_by', 'updated_at', 'notes']}
    onRowClick={(row) => window.location.href = routes.landlord.properties({ id: row.id as string })}
  />
);
```

That's it. DataTable handles:
- Fetching data from Supabase
- Auto-deducing columns from the query response
- Column headers = raw database column names
- Sorting (click header → server-side `.order()`)
- Pagination (server-side `.range()`)
- Loading, error, empty states
- Retry on error

### ViewSingle Pattern

ViewSingle fetches **only the single record** for the form. Related lists are handled by embedded DataTable instances, each with their own query:

```typescript
// components/[role]/ViewSingleProperty.tsx
'use client';
import { useState } from 'react';
import { useAsync } from 'react-use';
import { database } from '@/api/database';
import { routes } from '@/routes';
import { Spinner } from '@/components/shared/Spinner';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { FormProperty } from '@/components/[role]/FormProperty';
import { DataTable } from '@/components/shared/DataTable';

interface ViewSinglePropertyProps {
  id?: string;  // undefined = create mode
}

export const ViewSingleProperty = ({ id }: ViewSinglePropertyProps) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const isCreateMode = !id;

  // Fetch ONLY the single record for the form
  const state = useAsync(async () => {
    return isCreateMode
      ? { data: null, error: null }
      : await database.from('properties').select('*').eq('id', id).single();
  }, [id, refreshKey]);

  const handleRefresh = () => setRefreshKey(p => p + 1);

  return (
    state.error ? <ErrorBanner msg={state.error.message} retry={handleRefresh} /> :
    state.loading ? <Spinner /> :
    state.value?.error ? <ErrorBanner msg={state.value.error.message} /> :
    <>
      {/* Entity's own fields */}
      <FormProperty
        data={state.value?.data ?? undefined}
        onSuccess={handleRefresh}
      />

      {/* Related data — each DataTable fetches its own data */}
      {!isCreateMode && (
        <>
          <h3>Lease Agreements</h3>
          <DataTable
            query={() => database
              .from('lease_agreements')
              .select('id, tenant_id, monthly_rent, start_date, end_date, status')
              .eq('property_id', id)}
            hiddenColumns={['id']}
            onRowClick={(row) => window.location.href = routes.landlord.leases({ id: row.id as string })}
            refreshKey={refreshKey}
          />

          <h3>Transactions</h3>
          <DataTable
            query={() => database
              .from('transactions')
              .select('id, type, description, amount, due_date, status')
              .eq('property_id', id)}
            hiddenColumns={['id']}
            defaultSortKey="due_date"
            defaultSortDirection="desc"
            refreshKey={refreshKey}
          />

          <h3>Attachments</h3>
          <DataTable
            query={() => database
              .from('attachments')
              .select('id, file_name, file_type, file_size, created_at')
              .eq('related_to_id', id)
              .eq('related_to_type', 'property')}
            hiddenColumns={['id']}
            refreshKey={refreshKey}
          />
        </>
      )}
    </>
  );
};
```

**Key change from old pattern:** ViewSingle no longer fetches related data itself. Each embedded DataTable independently fetches its own data via injected query.

---

## 4.4 Level 2: Form* Components (Presentational)

Form* renders **only** the entity's own fields. Handles view, edit, and create modes.

| ID | Rule | Severity |
|----|------|----------|
| P-006 | **Form* receives data via props** — `data?: Entity` (undefined = create, defined = view/edit) | 🔴 Critical |
| P-007 | **Form* never fetches** — all data comes from parent View* | 🔴 Critical |
| P-008 | **Form* calls onSuccess** — mutation callback to parent for refresh | 🟠 High |

### Form Pattern

```typescript
// components/[role]/FormProperty.tsx
'use client';
import { useState } from 'react';
import { useAsyncFn } from 'react-use';
import { database } from '@/api/database';
import type { Database } from '@/api/database.types';

type Property = Database['public']['Tables']['properties']['Row'];

interface FormPropertyProps {
  data?: Property;          // undefined = create, defined = view/edit
  onSuccess: () => void;    // called after successful mutation
}

export const FormProperty = ({ data, onSuccess }: FormPropertyProps) => {
  const isCreate = !data;
  const [name, setName] = useState(data?.name ?? '');
  const [address, setAddress] = useState(data?.address ?? '');

  const [submitState, handleSubmit] = useAsyncFn(async () => {
    const payload = { name, address };
    const { error } = isCreate
      ? await database.from('properties').insert(payload)
      : await database.from('properties').update(payload).eq('id', data.id);
    return { error };
  }, [name, address, data?.id]);

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSubmit().then(r => !r?.error && onSuccess());
    }}>
      <label htmlFor="name">Name</label>
      <input id="name" value={name} onChange={e => setName(e.target.value)} />

      <label htmlFor="address">Address</label>
      <input id="address" value={address} onChange={e => setAddress(e.target.value)} />

      <button type="submit" disabled={submitState.loading}>
        {submitState.loading ? 'Saving...' : isCreate ? 'Create' : 'Update'}
      </button>
      {submitState.error && <div role="alert">{submitState.error.message}</div>}
    </form>
  );
};
```

---

## 4.5 DataTable — Smart-Universal Component

DataTable is the **core list rendering component**. It receives a Supabase query factory, applies sorting and pagination server-side, auto-deduces columns, and renders a fully interactive table.

| ID | Rule | Severity |
|----|------|----------|
| P-009 | **DataTable receives `query` prop** — a function returning a fresh Supabase query builder | 🔴 Critical |
| P-010 | **DataTable applies `.order()` internally** — caller never adds sorting | 🔴 Critical |
| P-011 | **DataTable applies `.range()` internally** — server-side pagination | 🟠 High |
| P-012 | **DataTable auto-deduces columns** — from `Object.keys(data[0])`, headers = raw DB column names | 🔴 Critical |
| P-013 | **DataTable no domain imports** — entity-agnostic, lives in `components/shared/` | 🔴 Critical |

### Props

```typescript
interface DataTableProps {
  query: () => SupabaseQueryLike;     // query factory — DataTable adds .order() + .range()
  hiddenColumns?: string[];           // columns to hide from auto-deduction
  columns?: ColumnOverride[];         // optional label/render overrides for specific columns
  onRowClick?: (row: Record<string, unknown>) => void;
  defaultSortKey?: string;
  defaultSortDirection?: 'asc' | 'desc';
  pageSize?: number;                  // default: 25, 0 = no pagination
  refreshKey?: number;                // parent triggers refetch (e.g., after mutation)
  emptyMessage?: string;              // default: "Brak danych"
}

interface ColumnOverride {
  key: string;
  label?: string;                     // override auto-deduced header
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
}
```

### How DataTable Works Internally

```
1. Caller passes: query={() => database.from('properties').select('*')}
2. DataTable holds state: sortKey, sortDirection, page
3. On mount / sort change / page change / refreshKey change:
   a. Calls query() → gets fresh Supabase query builder
   b. Applies .order(sortKey, { ascending }) if sorting
   c. Applies .range(from, to) if pagination enabled
   d. Awaits the query → { data, error }
4. Auto-deduces columns from Object.keys(data[0])
5. Filters out hiddenColumns
6. Merges with ColumnOverride[] for custom labels/renderers
7. Renders <table> with sortable headers and paginated data
```

### Internal state flow

```
sort state:     sortKey: string | null, sortDirection: 'asc' | 'desc'
page state:     page: number (0-based)
deps:           [sortKey, sortDirection, page, refreshKey]

Click column header →
  same column: toggle direction (asc → desc → no sort)
  new column: set as sortKey, direction = 'asc'
  → useAsync re-runs → fresh query with .order() → new data

Click next/prev page →
  page += 1 or page -= 1
  → useAsync re-runs → fresh query with .range() → new data
```

### Column deduction

```
Supabase response:  [{ id: "abc", name: "Apt 1", status: "active", monthly_rent: 2500 }, ...]
                          ↓
Object.keys(data[0]):  ["id", "name", "status", "monthly_rent"]
                          ↓
Filter hiddenColumns:  ["name", "status", "monthly_rent"]  (if hiddenColumns=['id'])
                          ↓
Table headers:         name | status | monthly_rent         (raw DB column names)
```

### Accessibility

- `<th scope="col">` on all header cells
- `aria-sort="ascending"` / `"descending"` / `"none"` on sorted column
- `role="button"` + `tabIndex={0}` on clickable rows
- `role="alert"` on error messages

### Built-in features

| Feature | Implementation |
|---------|---------------|
| **Server-side sort** | `.order(column, { ascending })` on Supabase query |
| **Server-side pagination** | `.range(from, to)` on Supabase query |
| **Auto columns** | `Object.keys(data[0])` — no manual column definitions needed |
| **Column headers** | Raw database column names (e.g., `monthly_rent`) |
| **Hidden columns** | `hiddenColumns` prop filters out unwanted columns |
| **Column overrides** | `columns` prop for custom labels or render functions |
| **Loading state** | Shows `<Spinner />` during fetch |
| **Error state** | Shows `<ErrorBanner />` with retry button |
| **Empty state** | Shows configurable message when no data |
| **Clickable rows** | `onRowClick` prop for navigation |
| **Refresh** | `refreshKey` prop — parent increments to trigger refetch |

---

## 4.6 Other Universal Components (Generic)

These components are **entity-agnostic** and **do not fetch data**. They are purely props-driven.

| ID | Rule | Severity |
|----|------|----------|
| P-014 | **Generic universals accept all config via props** | 🔴 Critical |
| P-015 | **Generic universals handle edge cases** — loading, empty, error states | 🟠 High |
| P-016 | **Generic universals no domain imports** — no `@/api/`, `@/hooks/`, `@/constants/` | 🔴 Critical |
| P-017 | **All universals live in `components/shared/`** | 🟠 High |

### Catalog

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `DataTable` | List rendering with query-based fetch, sort, pagination | `query`, `hiddenColumns?`, `columns?`, `onRowClick?`, `pageSize?`, `refreshKey?` |
| `Spinner` | Loading indicator | none |
| `ErrorBanner` | Error message with retry | `msg: string`, `retry?: () => void` |
| `EmptyState` | No-data placeholder | `message: string`, `actionLabel?`, `actionHref?` |
| `AppLayout` | Header + sidebar + main area | `children: ReactNode` |
| `RoleGuard` | Route-level auth check | `allowedRoles: string[]`, `children: ReactNode` |
| `Sidebar` | Role-based navigation | none (reads role internally) |

---

## 4.7 Relationship Rendering

How to present database relationships in the UI:

### One-to-Many (parent → children)

```
ViewSingle[Parent] embeds DataTable instances with filtered queries
Example: ViewSingleProperty shows leases via DataTable query .eq('property_id', id)
```

Each related list is an independent DataTable with its own query, sort, and pagination:

```typescript
// Inside ViewSingleProperty
<h3>Lease Agreements</h3>
<DataTable
  query={() => database.from('lease_agreements').select('*').eq('property_id', id)}
  hiddenColumns={['id', 'property_id']}
  onRowClick={(row) => window.location.href = routes.landlord.leases({ id: row.id as string })}
  refreshKey={refreshKey}
/>
```

### Many-to-Many (through junction table)

```
Rendered same as one-to-many from each side
Example: tenants ↔ properties via lease_agreements junction:
  ViewSingleProperty → DataTable query: leases.eq('property_id', id)
  ViewSingleTenant → DataTable query: leases.eq('tenant_id', id)
```

### FK Reference Navigation

When a field references another entity (FK), use a `ColumnOverride` to render it as a clickable link:

```typescript
<DataTable
  query={() => database.from('lease_agreements').select('*')}
  columns={[
    {
      key: 'tenant_id',
      label: 'Tenant',
      render: (val) => (
        <a href={routes.landlord.tenants({ id: val as string })}>{val}</a>
      ),
    },
  ]}
/>
```

### Database Views

DataTable works seamlessly with Supabase views (denormalized data):

```typescript
// active_leases view has joined columns: property_name, tenant_name, etc.
<DataTable
  query={() => database.from('active_leases').select('*')}
  hiddenColumns={['created_at', 'created_by', 'updated_at', 'notes']}
/>
```

---

## 4.8 CRUD URL State Machine

URL search params define the current mode. The page mini-router dispatches:

```
URL Params              → Mode      → Component
────────────────────────────────────────────────
(none)                  → list      → ViewAll[Entity]
?id=xxx                 → detail    → ViewSingle[Entity] (view mode)
?id=xxx&action=edit     → edit      → ViewSingle[Entity] (edit mode)
?action=new             → create    → ViewSingle[Entity] (create mode, no id)
```

### Page mini-router template

```typescript
// app/[role]/[entity]/page.tsx
'use client';
import type { EntityRouteParams } from '@/routes';
import { useRouteParams } from '@/routes/useRouteParams';
import { ViewAllEntities } from '@/components/[role]/ViewAllEntities';
import { ViewSingleEntity } from '@/components/[role]/ViewSingleEntity';

export default () => {
  const { id, action } = useRouteParams<EntityRouteParams>();

  return (
    action === 'new' ? <ViewSingleEntity /> :
    id ? <ViewSingleEntity id={id} /> :
    <ViewAllEntities />
  );
};
```

### After mutation navigation

```
Create success → navigate to detail (?id=newId)
Update success → refresh current detail (refreshKey)
Delete success → navigate to list (no params)
```

---

## 4.9 Labels & Enum Display

Database status/type fields are displayed using label lookup maps.

| ID | Rule | Severity |
|----|------|----------|
| P-018 | **Label maps** — `Record<string, string>` in `constants/labels.ts` | 🟠 High |
| P-019 | **Naming** — `[ENTITY]_[FIELD]_LABELS` in UPPER_SNAKE_CASE | 🟠 High |
| P-020 | **Locale** — all UI labels in Polish (pl-PL) | 🟠 High |

```typescript
// constants/labels.ts
export const PROPERTY_STATUS_LABELS: Record<string, string> = {
  available: 'Wolna',
  occupied: 'Zajęta',
  inactive: 'Nieaktywna',
};

// Usage in DataTable ColumnOverride render
columns={[
  { key: 'status', render: (val) => PROPERTY_STATUS_LABELS[val as string] ?? val },
]}
```

### Formatting

- **Currency:** `Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' })`
- **Dates:** `new Date(date).toLocaleDateString('pl-PL')`
- **Formatting functions** live in `utils/` as pure functions

---

## 4.10 Adding a New Entity (Checklist)

When adding a new database entity to the frontend:

```
1. □ DB migration created & applied (supabase db reset)
2. □ Types regenerated (supabase gen types typescript)
3. □ Route param type added to routes/index.ts
4. □ Route generator added to routes object
5. □ Page mini-router created: app/[role]/[entity]/page.tsx
6. □ ViewAll[Entity].tsx — wraps DataTable with entity query
7. □ ViewSingle[Entity].tsx — fetches single record, embeds Form* + DataTable for related
8. □ Form[Entity].tsx — entity fields (create/edit)
9. □ Label maps added to constants/labels.ts (if entity has status/type fields)
10. □ Sidebar nav item added (if top-level entity)
```

---

## Quick Reference — Layer 4 Rules

| ID | Rule | Severity |
|----|------|----------|
| P-001 | **View* = Smart** — orchestrates, fetches single records | 🔴 Critical |
| P-002 | **DataTable = Smart-Universal** — fetches lists via injected query | 🔴 Critical |
| P-003 | **Form* = Presentational** — props only, never fetches | 🔴 Critical |
| P-004 | **Data flows down** — parent → child via props/queries | 🔴 Critical |
| P-005 | **View* prefix = top-level** — imported by pages | 🟠 High |
| P-006 | **Form* data prop** — undefined = create, defined = view/edit | 🔴 Critical |
| P-007 | **Form* never fetches** | 🔴 Critical |
| P-008 | **Form* calls onSuccess** — parent refreshes | 🟠 High |
| P-009 | **DataTable `query` prop** — function returning fresh Supabase query builder | 🔴 Critical |
| P-010 | **DataTable applies `.order()` internally** — caller never adds sorting | 🔴 Critical |
| P-011 | **DataTable applies `.range()` internally** — server-side pagination | 🟠 High |
| P-012 | **DataTable auto-deduces columns** — from response keys, raw DB column names | 🔴 Critical |
| P-013 | **DataTable no domain imports** — entity-agnostic | 🔴 Critical |
| P-014 | **Generic universals props-only** — Spinner, ErrorBanner, EmptyState | 🔴 Critical |
| P-015 | **Generic universals handle edge cases** | 🟠 High |
| P-016 | **Generic universals no domain imports** | 🔴 Critical |
| P-017 | **All universals in shared/** | 🟠 High |
| P-018 | **Label maps** in constants/ | 🟠 High |
| P-019 | **Label naming** — `[ENTITY]_[FIELD]_LABELS` | 🟠 High |
| P-020 | **Locale** — pl-PL | 🟠 High |
