# Frontend Style Guide — Layer 4: Project (CRUD Application Pattern)

**Scope:** Stratified component design for presenting a relational database to users.  
**Back to:** [Frontend Style Guide](./FRONTEND_STYLE_GUIDE.md) · **Depends on:** [Language](./FRONTEND_STYLE_GUIDE_LANGUAGE.md) · [Library](./FRONTEND_STYLE_GUIDE_LIBRARY.md) · [Framework](./FRONTEND_STYLE_GUIDE_FRAMEWORK.md)

---

## 4.1 Component Stratification

Components are organized in **4 levels** by responsibility. Data flows top-down only.

```
Level 0: Page          (app/*/page.tsx)      — reads URL params, dispatches
  ↓
Level 1: View*         (View*.tsx)           — SMART: fetches data, orchestrates
  ↓
Level 2: Form* / Many* (Form*.tsx, Many*.tsx) — PRESENTATIONAL: receives data via props
  ↓
Level 3: Universal     (shared/*)            — GENERIC: entity-agnostic, configured via props
```

| Level | Prefix | Fetches data? | Domain knowledge? | Example |
|-------|--------|:---:|:---:|---------|
| **0. Page** | `app/*/page.tsx` | ❌ | ❌ (only URL params) | mini-router |
| **1. View*** | `View*.tsx` | ✅ `useAsync`/`useAsyncFn` | ✅ knows entity | `ViewAllProperties`, `ViewSingleTenant` |
| **2a. Form*** | `Form*.tsx` | ❌ props only | ✅ knows entity fields | `FormProperty`, `FormTenant` |
| **2b. Many*** | `Many*.tsx` | ❌ props only | ✅ knows entity columns | `ManyLeases`, `ManyAttachments` |
| **3. Universal** | `shared/*.tsx` | ❌ props only | ❌ entity-agnostic | `DataTable<T>`, `Spinner`, `ErrorBanner` |

### Rules

| ID | Rule | Severity |
|----|------|----------|
| P-001 | **View* = Smart components** — only View* components fetch data via `useAsync`/`useAsyncFn` | 🔴 Critical |
| P-002 | **Form*/Many* = Presentational** — receive all data via props, never fetch | 🔴 Critical |
| P-003 | **Universal = Entity-agnostic** — must not import from `@/api/`, `@/hooks/`, `@/constants/` | 🔴 Critical |
| P-004 | **Data flows down only** — parent passes data to children via props | 🔴 Critical |
| P-005 | **View* prefix = top-level** — components named `View*` are imported by pages | 🟠 High |

---

## 4.2 Entity Component Set

Each database entity gets **4 component files**:

```
components/[role]/
├── ViewAll[Entity].tsx      ← Level 1: fetches all records, composes Many*
├── ViewSingle[Entity].tsx   ← Level 1: fetches single record + related data, composes Form* + Many*
├── Form[Entity].tsx         ← Level 2: entity's own fields (detail/edit/create)
└── Many[Entity].tsx         ← Level 2: renders a list of entity records
```

### Composition diagram

```
ViewAll[Entity] (Smart: fetches all records)
  └── Many[Entity] (renders the list → uses DataTable<T>)

ViewSingle[Entity] (Smart: fetches record + related data)
  ├── Form[Entity] (entity's own fields — view/edit/create)
  ├── Many[Child1] (related one-to-many records)
  ├── Many[Child2] (related one-to-many records)
  └── Many[Attachment] (files/attachments)
```

**Many* is reusable in both contexts:**
1. `ViewAll[Entity]` uses `Many[Entity]` as the primary list
2. `ViewSingle[Parent]` uses `Many[Entity]` as an embedded sub-list of related records

---

## 4.3 Level 1: View* Components (Smart)

View* components are the **only** components that fetch data. They handle the full data lifecycle.

### ViewAll Pattern

```typescript
// components/[role]/ViewAllProperties.tsx
'use client';
import { useState } from 'react';
import { useAsync } from 'react-use';
import { database } from '@/api/database';
import { routes } from '@/routes';
import { Spinner } from '@/components/shared/Spinner';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { ManyProperties } from '@/components/[role]/ManyProperties';

export const ViewAllProperties = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const state = useAsync(async () => {
    const { data, error } = await database.from('properties').select('*');
    return { data, error };
  }, [refreshKey]);

  return (
    state.error ? <ErrorBanner msg={state.error.message} retry={() => setRefreshKey(p => p + 1)} /> :
    state.loading ? <Spinner /> :
    state.value?.error ? <ErrorBanner msg={state.value.error.message} /> :
    <ManyProperties
      data={state.value?.data ?? []}
      onRecordClick={(id) => window.location.href = routes.[role].properties({ id })}
    />
  );
};
```

### ViewSingle Pattern

```typescript
// components/[role]/ViewSingleProperty.tsx
'use client';
import { useState } from 'react';
import { useAsync } from 'react-use';
import { database } from '@/api/database';
import { Spinner } from '@/components/shared/Spinner';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { FormProperty } from '@/components/[role]/FormProperty';
import { ManyLeases } from '@/components/[role]/ManyLeases';
import { ManyAttachments } from '@/components/[role]/ManyAttachments';

interface ViewSinglePropertyProps {
  id?: string;  // undefined = create mode
}

export const ViewSingleProperty = ({ id }: ViewSinglePropertyProps) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const isCreateMode = !id;

  // Fetch record + related data (skip if create mode)
  const state = useAsync(async () => {
    return isCreateMode
      ? { record: null, leases: [], attachments: [] }
      : {
          record: await database.from('properties').select('*').eq('id', id).single(),
          leases: await database.from('leases').select('*').eq('property_id', id),
          attachments: await database.from('attachments').select('*').eq('entity_id', id),
        };
  }, [id, refreshKey]);

  const handleRefresh = () => setRefreshKey(p => p + 1);

  return (
    state.error ? <ErrorBanner msg={state.error.message} retry={handleRefresh} /> :
    state.loading ? <Spinner /> :
    <>
      <FormProperty
        data={state.value?.record?.data ?? undefined}
        onSuccess={handleRefresh}
      />
      {!isCreateMode && (
        <>
          <ManyLeases
            data={state.value?.leases?.data ?? []}
            onRecordClick={(leaseId) => /* navigate to lease detail */}
          />
          <ManyAttachments
            data={state.value?.attachments?.data ?? []}
            onRecordClick={(attId) => /* navigate to attachment */}
          />
        </>
      )}
    </>
  );
};
```

---

## 4.4 Level 2a: Form* Components (Presentational)

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

## 4.5 Level 2b: Many* Components (Presentational)

Many* renders a **list of records** using universal components (DataTable). No fetching.

| ID | Rule | Severity |
|----|------|----------|
| P-009 | **Many* receives data via props** — `data: Entity[]` | 🔴 Critical |
| P-010 | **Many* never fetches** — all data from parent View* | 🔴 Critical |
| P-011 | **Many* defines columns** — entity-specific `ColumnDef<T>[]` | 🟠 High |
| P-012 | **Many* delegates rendering to DataTable** — or other universal components | 🟠 High |

### Many Pattern

```typescript
// components/[role]/ManyProperties.tsx
'use client';
import { DataTable } from '@/components/shared/DataTable';
import { PROPERTY_STATUS_LABELS } from '@/constants/labels';
import type { ColumnDef } from '@/components/shared/DataTable';
import type { Database } from '@/api/database.types';

type Property = Database['public']['Tables']['properties']['Row'];

interface ManyPropertiesProps {
  data: Property[];
  isLoading?: boolean;
  onRecordClick?: (id: string) => void;
}

const COLUMNS: ColumnDef<Property>[] = [
  { key: 'name', label: 'Name' },
  { key: 'address', label: 'Address' },
  { key: 'status', label: 'Status',
    render: (val) => PROPERTY_STATUS_LABELS[val as string] ?? val },
];

export const ManyProperties = ({ data, isLoading, onRecordClick }: ManyPropertiesProps) => (
  <DataTable<Property>
    data={data}
    columns={COLUMNS}
    loading={isLoading}
    onRowClick={onRecordClick ? (row) => onRecordClick(row.id ?? '') : undefined}
    emptyMessage="No records found"
  />
);
```

---

## 4.6 Level 3: Universal Components (Generic)

Universal components are **entity-agnostic**. They must work with any data type.

| ID | Rule | Severity |
|----|------|----------|
| P-013 | **Must use generics** — `DataTable<T>`, `ColumnDef<T>` | 🔴 Critical |
| P-014 | **Must accept all config via props** — data, columns, handlers, messages | 🔴 Critical |
| P-015 | **Must handle edge cases** — loading, empty, error states | 🟠 High |
| P-016 | **Must NOT import domain code** — no `@/api/`, `@/hooks/`, `@/constants/` | 🔴 Critical |
| P-017 | **Must live in `components/shared/`** | 🟠 High |

### Catalog of Universal Components

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `DataTable<T>` | Generic table renderer | `data: T[]`, `columns: ColumnDef<T>[]`, `onRowClick?`, `loading?`, `emptyMessage?` |
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
ViewSingle[Parent] embeds Many[Child] sub-lists
Example: ViewSingleProperty shows ManyLeases (property has many leases)
```

The parent's ViewSingle fetches both the record and its children, then passes children data to Many*.

### Many-to-Many (through junction table)

```
Rendered same as one-to-many from each side
Example: If tenants ↔ properties via lease junction:
  ViewSingleProperty → ManyLeases → each lease links to tenant
  ViewSingleTenant → ManyLeases → each lease links to property
```

### FK Reference Navigation

When a field references another entity (FK), render it as a **clickable link**:

```typescript
// In ColumnDef render function
{
  key: 'tenant_id',
  label: 'Tenant',
  render: (val) => (
    <Link href={routes.landlord.tenants({ id: val as string })}>
      {val}
    </Link>
  ),
}
```

### One-to-One

Shown as inline section within ViewSingle — not a separate Many* component. Just render the fields directly.

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

// Usage in ColumnDef render
render: (val) => PROPERTY_STATUS_LABELS[val as string] ?? val
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
6. □ ViewAll[Entity].tsx — fetches all, composes Many*
7. □ ViewSingle[Entity].tsx — fetches single + related, composes Form* + Many*
8. □ Form[Entity].tsx — entity fields (create/edit)
9. □ Many[Entity].tsx — list rendering via DataTable
10. □ Label maps added to constants/labels.ts
11. □ Sidebar nav item added (if top-level entity)
```

---

## Quick Reference — Layer 4 Rules

| ID | Rule | Severity |
|----|------|----------|
| P-001 | **View* = Smart** — only View* fetches data | 🔴 Critical |
| P-002 | **Form*/Many* = Presentational** — props only, never fetch | 🔴 Critical |
| P-003 | **Universal = Entity-agnostic** — no domain imports | 🔴 Critical |
| P-004 | **Data flows down** — parent → child via props | 🔴 Critical |
| P-005 | **View* prefix = top-level** — imported by pages | 🟠 High |
| P-006 | **Form* data prop** — undefined = create, defined = view/edit | 🔴 Critical |
| P-007 | **Form* never fetches** | 🔴 Critical |
| P-008 | **Form* calls onSuccess** — parent refreshes | 🟠 High |
| P-009 | **Many* data prop** — `data: Entity[]` | 🔴 Critical |
| P-010 | **Many* never fetches** | 🔴 Critical |
| P-011 | **Many* defines columns** | 🟠 High |
| P-012 | **Many* uses DataTable** | 🟠 High |
| P-013 | **Universal uses generics** | 🔴 Critical |
| P-014 | **Universal props-only config** | 🔴 Critical |
| P-015 | **Universal handles edge cases** | 🟠 High |
| P-016 | **Universal no domain imports** | 🔴 Critical |
| P-017 | **Universal in shared/** | 🟠 High |
| P-018 | **Label maps** in constants/ | 🟠 High |
| P-019 | **Label naming** — `[ENTITY]_[FIELD]_LABELS` | 🟠 High |
| P-020 | **Locale** — pl-PL | 🟠 High |
