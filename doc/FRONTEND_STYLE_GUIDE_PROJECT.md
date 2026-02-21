# Frontend Style Guide — Layer 4: Project (CRUD Application Pattern)

**Scope:** Stratified component design for presenting a relational database to users.  
**Back to:** [Frontend Style Guide](./FRONTEND_STYLE_GUIDE.md) · **Depends on:** [Language](./FRONTEND_STYLE_GUIDE_LANGUAGE.md) · [Library](./FRONTEND_STYLE_GUIDE_LIBRARY.md) · [Framework](./FRONTEND_STYLE_GUIDE_FRAMEWORK.md)

---

## 4.1 Component Stratification

Components are organized in **3 levels** by responsibility. Data flows top-down only.

```
Level 0: Page          (app/*/page.tsx)      — reads URL params, dispatches to View* components
  ↓
Level 1: View*         (View*.tsx)           — SMART: orchestrates, manages mode & formState
  ↓
Universal Components   (shared/*.tsx)        — reusable building blocks:
  ├── ManyRecords                            — SMART-UNIVERSAL: multi-record display (table/cards/list)
  ├── SingleRecordDetails                    — CONTROLLED: single-record inline view/edit/create
  ├── SingleRecordReference                  — CONTROLLED: to-one FK section (summary + picker)
  ├── RecordPicker                           — MODAL: browse existing + create new record
  ├── ConfirmDialog                          — MODAL: destructive action confirmation
  └── Spinner, ErrorBanner, EmptyState       — GENERIC: edge-case handling
```

| Level | Component | Fetches data? | Domain knowledge? | State ownership |
|-------|-----------|:---:|:---:|------|
| **0. Page** | `app/*/page.tsx` | ❌ | ❌ (URL params only) | none |
| **1. View*** | `ViewAll*.tsx`, `ViewSingle*.tsx` | ✅ single record | ✅ knows entity | owns formState + mode |
| **U. ManyRecords** | `shared/ManyRecords.tsx` | ✅ via injected query | ❌ entity-agnostic | internal sort/page state |
| **U. SingleRecordDetails** | `shared/SingleRecordDetails.tsx` | ❌ controlled | ❌ entity-agnostic | none (controlled by parent) |
| **U. SingleRecordReference** | `shared/SingleRecordReference.tsx` | ✅ referenced record | ❌ entity-agnostic | none (controlled by parent) |
| **U. RecordPicker** | `shared/RecordPicker.tsx` | ✅ via ManyRecords | ❌ entity-agnostic | internal modal state |
| **U. Generic** | `shared/*.tsx` | ❌ props only | ❌ entity-agnostic | none |

### Rules

| ID | Rule | Severity |
|----|------|----------|
| P-001 | **View* = Smart Orchestrator** — manages mode, formState, mutations; composes universal components | 🔴 Critical |
| P-002 | **ManyRecords = Smart-Universal** — fetches list data via injected query, entity-agnostic | 🔴 Critical |
| P-003 | **SingleRecordDetails = Controlled** — receives values + onChange, never fetches, never saves | 🔴 Critical |
| P-004 | **SingleRecordReference = Controlled** — receives referenceId + onChange, fetches only the referenced record | 🔴 Critical |
| P-005 | **Data flows down** — parent passes data/queries/callbacks to children | 🔴 Critical |
| P-006 | **View* prefix = top-level** — only View* components are imported by pages | 🟠 High |

---

## 4.2 Entity Component Set

Each database entity gets **2 component files**:

```
components/[role]/
├── ViewAll[Entity].tsx      ← Level 1: configures ManyRecords with entity query + display mode
└── ViewSingle[Entity].tsx   ← Level 1: orchestrates all 3 section types for one record
```

### Composition Diagram

```
ViewAll[Entity]
  └── ManyRecords (mode: table|cards|list — fetches all records, sorts, paginates)

ViewSingle[Entity] (manages formState + mode: view|edit|create)
  ├── Section 1 (Self):     SingleRecordDetails (entity's own scalar fields)
  ├── Section 2 (To-One):   SingleRecordReference × N (one per FK out)
  │                            └── RecordPicker modal (browse + create)
  └── Section 3 (To-Many):  ManyRecords × N (one per FK in — related child records)
```

**ManyRecords is reused in both contexts:**
1. `ViewAll[Entity]` passes a full-table query
2. `ViewSingle[Parent]` passes filtered queries (`.eq('parent_id', id)`) for related records

**SingleRecordDetails is reused in multiple contexts:**
1. `ViewSingle[Entity]` — main record fields (view/edit/create)
2. `RecordPicker` — create tab (new related record)
3. `SingleRecordReference` — preview modal (read-only)

---

## 4.3 Central Column Registry

One source of truth for how every DB column is labeled, displayed, and edited. Used by **both** ManyRecords and SingleRecordDetails.

| ID | Rule | Severity |
|----|------|----------|
| P-007 | **Central column registry** — all column labels, renderers, inputs defined in `constants/columnRegistry.tsx` | 🔴 Critical |
| P-008 | **4-level resolution** — per-usage props → table-specific → global → auto-deduce | 🔴 Critical |
| P-009 | **Locale pl-PL** — all UI labels in Polish | 🟠 High |

**Location:** `constants/columnRegistry.tsx`

### ColumnConfig Interface

```typescript
interface ColumnConfig {
  label?: string;                                                        // Polish UI name
  render?: (value: unknown) => React.ReactNode;                          // display renderer (view mode)
  input?: (value: unknown, onChange: (v: unknown) => void) => React.ReactNode; // edit renderer
  hidden?: boolean;                                                       // hide by default
  readonly?: boolean;                                                     // never editable
  required?: boolean;                                                     // validation: must have value
  validate?: (value: unknown) => string | null;                           // custom validation (null = valid)
}
```

### Type-Safe Registry

The registry leverages generated `Database` types to catch typos in table and column names at compile time:

```typescript
// constants/columnRegistry.tsx
import type { Database } from '@/api/database.types';

// ── Type utilities ──────────────────────────────────────────────────

// All public table names (e.g., 'properties', 'tenants', 'lease_agreements')
type TableName = keyof Database['public']['Tables'];

// All public view names (e.g., 'active_leases', 'property_financial_summary')
type ViewName = keyof Database['public']['Views'];

// Column names for a specific table (e.g., 'name' | 'address' | 'status' for 'properties')
type ColumnName<T extends TableName> = keyof Database['public']['Tables'][T]['Row'] & string;

// Table-specific registry: keys constrained to actual column names
type TableColumnRegistry<T extends TableName> = Partial<
  Record<ColumnName<T>, ColumnConfig>
>;

// Global registry: applies to common column names across any table
type GlobalColumnRegistry = Record<string, ColumnConfig>;

// Complete registry type — table entries are type-checked, views are looser
type ColumnRegistryType = {
  _global: GlobalColumnRegistry;
} & {
  [T in TableName]?: TableColumnRegistry<T>;
} & {
  [V in ViewName]?: Record<string, ColumnConfig>;  // Views may have computed/aliased columns
};

// ── Registry declaration ────────────────────────────────────────────

export const COLUMN_REGISTRY: ColumnRegistryType = {
  _global: {
    id:          { label: 'ID', hidden: true, readonly: true },
    created_at:  { label: 'Utworzono', render: formatDateTime, readonly: true },
    updated_at:  { label: 'Zaktualizowano', render: formatDateTime, readonly: true },
    created_by:  { label: 'Utworzył', hidden: true, readonly: true },
    notes:       { label: 'Notatki', input: textareaInput },
    email:       { label: 'Email', validate: validateEmail },
    phone:       { label: 'Telefon' },
  },

  properties: {
    name:          { label: 'Nazwa', required: true },
    address:       { label: 'Adres', required: true },
    property_type: { label: 'Typ nieruchomości', render: renderPropertyType, input: selectPropertyType },
    monthly_rent:  { label: 'Czynsz miesięczny', render: formatCurrency, input: currencyInput, required: true },
    deposit_amount:{ label: 'Kaucja', render: formatCurrency, input: currencyInput },
    status:        { label: 'Status', render: renderPropertyStatus, input: selectPropertyStatus },
    size_sqm:      { label: 'Powierzchnia (m²)' },
    bedrooms:      { label: 'Sypialnie' },
  },

  tenants: {
    first_name:    { label: 'Imię', required: true },
    last_name:     { label: 'Nazwisko', required: true },
    status:        { label: 'Status', render: renderTenantStatus, input: selectTenantStatus },
  },

  lease_agreements: {
    start_date:    { label: 'Data rozpoczęcia', render: formatDate, input: dateInput, required: true },
    end_date:      { label: 'Data zakończenia', render: formatDate, input: dateInput },
    monthly_rent:  { label: 'Czynsz', render: formatCurrency, input: currencyInput },
    deposit_amount:{ label: 'Kaucja', render: formatCurrency, input: currencyInput },
    status:        { label: 'Status', render: renderLeaseStatus, input: selectLeaseStatus },
    tenant_id:     { label: 'Najemca', hidden: true },    // handled by SingleRecordReference
    property_id:   { label: 'Nieruchomość', hidden: true },
  },

  transactions: {
    type:        { label: 'Typ', render: renderTransactionType, input: selectTransactionType },
    description: { label: 'Opis', required: true },
    amount:      { label: 'Kwota', render: formatCurrency, input: currencyInput, required: true },
    due_date:    { label: 'Termin', render: formatDate, input: dateInput, required: true },
    status:      { label: 'Status', render: renderTransactionStatus, input: selectTransactionStatus },
    lease_id:    { label: 'Umowa', hidden: true },
    property_id: { label: 'Nieruchomość', hidden: true },
  },

  attachments: {
    file_name:   { label: 'Nazwa pliku', required: true },
    file_url:    { label: 'URL', readonly: true },
    file_type:   { label: 'Typ pliku', render: renderFileType },
    file_size:   { label: 'Rozmiar', render: formatFileSize, readonly: true },
    description: { label: 'Opis' },
  },
};
```

### What Type Safety Catches

```typescript
// ✅ Compiles — 'monthly_rent' exists on properties.Row
properties: {
  monthly_rent: { label: 'Czynsz', render: formatCurrency },
}

// ❌ Compile error — typo: 'montly_rent' does not exist on properties.Row
properties: {
  montly_rent: { label: 'Czynsz', render: formatCurrency },
  // TS Error: Type '"montly_rent"' is not assignable to ...
}

// ❌ Compile error — 'propreties' is not a valid TableName
propreties: {
  // TS Error: Type '"propreties"' is not assignable to ...
}

// ✅ Views are looser — computed columns allowed
active_leases: {
  days_until_end: { label: 'Dni do końca' },  // computed column, OK
}
```

**Rule:** After `supabase gen types typescript --local`, the registry types auto-update. New columns become valid keys; removed columns produce compile errors.

### Resolution Order (4 Levels)

```
Priority 1: Per-usage props (component-level override)
   └── ManyRecords: hiddenColumns, columns prop
   └── SingleRecordDetails: fieldOverrides prop

Priority 2: Table-specific registry
   └── COLUMN_REGISTRY['properties']['status']
   └── COLUMN_REGISTRY['transactions']['status']  (different renderers!)

Priority 3: Global registry defaults
   └── COLUMN_REGISTRY['_global']['created_at']
   └── COLUMN_REGISTRY['_global']['email']

Priority 4: Auto-deduction (fallback)
   └── Label: raw column name
   └── Input: typeof value → text/number/checkbox
   └── Name convention: *_at → datetime, *_date → date, *_id → hidden, is_* → checkbox
```

### Helper: Resolve Column Config

```typescript
// Utility used by ManyRecords and SingleRecordDetails
const resolveColumnConfig = (
  tableName: string,
  columnKey: string,
  perUsageOverride?: Partial<ColumnConfig>,
): ColumnConfig => ({
  ...autoDeduceFromKey(columnKey),                    // Priority 4
  ...(COLUMN_REGISTRY._global?.[columnKey] ?? {}),    // Priority 3
  ...(COLUMN_REGISTRY[tableName]?.[columnKey] ?? {}), // Priority 2
  ...(perUsageOverride ?? {}),                        // Priority 1
});
```

### Formatting Helpers

- **Currency:** `Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' })`
- **Dates:** `new Date(date).toLocaleDateString('pl-PL')`
- **DateTime:** `new Date(date).toLocaleString('pl-PL')`
- **File size:** bytes → KB/MB with `Intl.NumberFormat`
- All formatting functions live in `utils/` as pure functions, referenced by the registry

---

## 4.4 Level 1: ViewAll* Components

ViewAll wraps ManyRecords with the entity's query and chosen display mode. Minimal code — ManyRecords handles fetching, sorting, pagination, loading, error, and empty states.

### Display Mode Decision

| Mode | When to Use | Example Entities |
|------|-------------|-----------------|
| `'table'` | Data-dense, many columns, sortable | Transactions, Lease Agreements |
| `'cards'` | Visual/entity-centric, summary info | Properties, Tenants |
| `'list'` | Simple/compact, 1-2 lines per item | Attachments, Logs |

### ViewAll Pattern

```typescript
// components/landlord/ViewAllProperties.tsx
'use client';
import { database } from '@/api/database';
import { useNavigate } from '@/routes/useNavigate';
import { routes } from '@/routes';
import { ManyRecords } from '@/components/shared/ManyRecords';

export const ViewAllProperties = () => {
  const navigate = useNavigate();

  return (
    <ManyRecords
      tableName="properties"
      query={() => database.from('properties').select('*')}
      mode="cards"
      hiddenColumns={['created_by', 'updated_at', 'notes']}
      onRowClick={(row) => navigate(routes.landlord.properties({ id: row.id as string }))}
      onAdd={() => navigate(routes.landlord.properties({ action: 'new' }))}
    />
  );
};
```

```typescript
// components/landlord/ViewAllTransactions.tsx
'use client';
import { database } from '@/api/database';
import { useNavigate } from '@/routes/useNavigate';
import { routes } from '@/routes';
import { ManyRecords } from '@/components/shared/ManyRecords';

export const ViewAllTransactions = () => {
  const navigate = useNavigate();

  return (
    <ManyRecords
      tableName="transactions"
      query={() => database.from('transactions').select('*')}
      mode="table"
      hiddenColumns={['created_by', 'updated_at']}
      defaultSortKey="due_date"
      defaultSortDirection="desc"
      onRowClick={(row) => navigate(routes.landlord.transactions({ id: row.id as string }))}
      onAdd={() => navigate(routes.landlord.transactions({ action: 'new' }))}
    />
  );
};
```

**Rules:**
- ViewAll is a thin wrapper — all logic lives in ManyRecords
- `onAdd` navigates to `?action=new` → page mini-router renders ViewSingle in create mode
- `tableName` enables ManyRecords to resolve column configs from the registry

---

## 4.5 Level 1: ViewSingle* Components (Smart Orchestrator)

ViewSingle is the **most complex** component. It manages mode, formState, mutations, and composes all 3 section types.

| ID | Rule | Severity |
|----|------|----------|
| P-010 | **ViewSingle owns formState** — all scalar fields + FK values in one state object | 🔴 Critical |
| P-011 | **ViewSingle controls mode** — `'view' \| 'edit' \| 'create'`, passed to children | 🔴 Critical |
| P-012 | **ViewSingle handles mutations** — INSERT/UPDATE/DELETE, children only report changes | 🔴 Critical |
| P-013 | **All 3 sections visible in every mode** — to-many sections show disabled hint in create mode | 🟠 High |

### ViewSingle Mode Behavior

| Mode | SingleRecordDetails | SingleRecordReference | ManyRecords (to-many) | Actions |
|------|--------------------|-----------------------|----------------------|---------|
| **view** | Read-only display | Shows summary, nav only | Active — fetches + displays | [Edytuj] [Usuń] |
| **edit** | Inline edit (inputs) | Can change reference | Active — fetches + displays | [Zapisz] [Anuluj] |
| **create** | Empty inputs | Must select required FKs | Disabled — "Zapisz rekord, aby dodać" | [Utwórz] [Anuluj] |

### ViewSingle Pattern

```typescript
// components/landlord/ViewSingleLease.tsx
'use client';
import { useState } from 'react';
import { useAsync, useAsyncFn } from 'react-use';

import { database } from '@/api/database';
import { useNavigate } from '@/routes/useNavigate';
import { routes } from '@/routes';
import { Spinner } from '@/components/shared/Spinner';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { SingleRecordDetails } from '@/components/shared/SingleRecordDetails';
import { SingleRecordReference } from '@/components/shared/SingleRecordReference';
import { ManyRecords } from '@/components/shared/ManyRecords';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import styles from '@/components/styles/viewSingle.module.css';

interface ViewSingleLeaseProps {
  id?: string;  // undefined = create mode
}

export const ViewSingleLease = ({ id }: ViewSingleLeaseProps) => {
  const navigate = useNavigate();
  const isCreateMode = !id;
  const [mode, setMode] = useState<'view' | 'edit' | 'create'>(isCreateMode ? 'create' : 'view');
  const [refreshKey, setRefreshKey] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // --- Form state (owns all fields + FKs) ---
  const [formState, setFormState] = useState<Record<string, unknown>>({});

  const updateField = (key: string, value: unknown) =>
    setFormState(prev => ({ ...prev, [key]: value }));

  // --- Fetch single record ---
  const state = useAsync(async () => {
    return isCreateMode
      ? { data: null, error: null }
      : await database.from('lease_agreements').select('*').eq('id', id).single();
  }, [id, refreshKey]);

  // Initialize formState from fetched data
  const record = state.value?.data;
  // (useEffect to sync formState when record changes — omitted for brevity)

  // --- Mutations ---
  const [saveState, handleSave] = useAsyncFn(async () => {
    const { tenant_id, property_id, ...fields } = formState;
    const payload = { ...fields, tenant_id, property_id };
    return isCreateMode
      ? await database.from('lease_agreements').insert(payload).select().single()
      : await database.from('lease_agreements').update(payload).eq('id', id).select().single();
  }, [formState, id]);

  const [deleteState, handleDelete] = useAsyncFn(async () =>
    await database.from('lease_agreements').delete().eq('id', id)
  , [id]);

  const handleRefresh = () => setRefreshKey(p => p + 1);

  // --- Render ---
  return (
    state.error ? <ErrorBanner msg={state.error.message} retry={handleRefresh} /> :
    state.loading ? <Spinner /> :
    state.value?.error ? <ErrorBanner msg={state.value.error.message} /> :
    <div className={styles.container}>

      {/* Mode actions */}
      <div className={styles.actions}>
        {mode === 'view' && (
          <>
            <button onClick={() => setMode('edit')}>Edytuj</button>
            <button onClick={() => setShowDeleteConfirm(true)}>Usuń</button>
          </>
        )}
        {(mode === 'edit' || mode === 'create') && (
          <>
            <button onClick={() => handleSave().then(r => {
              r?.data && (isCreateMode
                ? navigate(routes.landlord.leases({ id: r.data.id }))
                : (setMode('view'), handleRefresh()));
            })} disabled={saveState.loading}>
              {saveState.loading ? 'Zapisuję...' : mode === 'create' ? 'Utwórz' : 'Zapisz'}
            </button>
            <button onClick={() => isCreateMode
              ? navigate(routes.landlord.leases())
              : (setMode('view'), handleRefresh())
            }>Anuluj</button>
          </>
        )}
      </div>

      {/* Section 1: Self — entity's own scalar fields */}
      <SingleRecordDetails
        tableName="lease_agreements"
        values={formState}
        onChange={updateField}
        mode={mode}
      />

      {/* Section 2: To-One FK — tenant reference */}
      <SingleRecordReference
        label="Najemca"
        referenceId={formState.tenant_id as string ?? null}
        onChange={(newId) => updateField('tenant_id', newId)}
        query={(refId) => database.from('tenants').select('*').eq('id', refId).single()}
        pickerQuery={() => database.from('tenants').select('*')}
        pickerTableName="tenants"
        navigateTo={(refId) => routes.landlord.tenants({ id: refId })}
        nullable={false}
        mode={mode}
      />

      {/* Section 2: To-One FK — property reference */}
      <SingleRecordReference
        label="Nieruchomość"
        referenceId={formState.property_id as string ?? null}
        onChange={(newId) => updateField('property_id', newId)}
        query={(refId) => database.from('properties').select('*').eq('id', refId).single()}
        pickerQuery={() => database.from('properties').select('*')}
        pickerTableName="properties"
        navigateTo={(refId) => routes.landlord.properties({ id: refId })}
        nullable={false}
        mode={mode}
      />

      {/* Section 3: To-Many — transactions */}
      <ManyRecords
        label="Transakcje"
        tableName="transactions"
        query={() => database.from('transactions').select('*').eq('lease_id', id)}
        mode="table"
        hiddenColumns={['id', 'lease_id', 'property_id']}
        defaultSortKey="due_date"
        defaultSortDirection="desc"
        onRowClick={(row) => navigate(routes.landlord.transactions({ id: row.id as string }))}
        onAdd={() => { /* open RecordPicker modal for new transaction */ }}
        disabled={isCreateMode}
        disabledMessage="Zapisz rekord, aby dodać transakcje"
        refreshKey={refreshKey}
      />

      {/* Section 3: To-Many — attachments */}
      <ManyRecords
        label="Załączniki"
        tableName="attachments"
        query={() => database.from('attachments').select('*')
          .eq('related_to_id', id).eq('related_to_type', 'lease')}
        mode="list"
        hiddenColumns={['id', 'related_to_id', 'related_to_type']}
        onAdd={() => { /* open RecordPicker modal for new attachment */ }}
        disabled={isCreateMode}
        disabledMessage="Zapisz rekord, aby dodać załączniki"
        refreshKey={refreshKey}
      />

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <ConfirmDialog
          message="Czy na pewno chcesz usunąć tę umowę najmu?"
          onConfirm={() => handleDelete().then(() =>
            navigate(routes.landlord.leases())
          )}
          onCancel={() => setShowDeleteConfirm(false)}
          loading={deleteState.loading}
        />
      )}
    </div>
  );
};
```

### Key Patterns

**State initialization from fetched data:**
```typescript
// When record loads, populate formState
// Use useEffect or derive from state.value?.data
const record = state.value?.data;
// formState is initialized from record, then managed independently for edits
```

**After create success → navigate to detail:**
```typescript
handleSave().then(r => {
  r?.data && navigate(routes.landlord.leases({ id: r.data.id }));
});
```

**After edit success → refresh + return to view mode:**
```typescript
handleSave().then(r => {
  !r?.error && (setMode('view'), handleRefresh());
});
```

**After delete success → navigate to list:**
```typescript
handleDelete().then(() => {
  navigate(routes.landlord.leases());
});
```

---

## 4.6 ManyRecords — Smart-Universal Multi-Record Display

ManyRecords is the **core list rendering component**. It receives a Supabase query factory, applies sorting and pagination server-side, auto-deduces columns via the column registry, and renders in one of 3 display modes.

| ID | Rule | Severity |
|----|------|----------|
| P-014 | **ManyRecords receives `query` prop** — function returning a fresh Supabase query builder | 🔴 Critical |
| P-015 | **ManyRecords applies `.order()` internally** — caller never adds sorting | 🔴 Critical |
| P-016 | **ManyRecords applies `.range()` internally** — server-side pagination | 🟠 High |
| P-017 | **ManyRecords uses column registry** — `tableName` prop resolves labels + renderers | 🔴 Critical |
| P-018 | **ManyRecords no domain imports** — entity-agnostic, lives in `components/shared/` | 🔴 Critical |

### Props

```typescript
interface ManyRecordsProps {
  tableName: string;                         // resolves column config from COLUMN_REGISTRY
  query: () => SupabaseQueryLike;            // query factory — ManyRecords adds .order() + .range()
  mode?: 'table' | 'cards' | 'list';        // display mode (default: 'table')
  hiddenColumns?: string[];                  // columns to hide (per-usage override)
  columns?: ColumnOverride[];                // label/render overrides (per-usage override)
  onRowClick?: (row: Record<string, unknown>) => void;
  onAdd?: () => void;                        // shows "Add" button, calls handler
  onRowDelete?: (row: Record<string, unknown>) => Promise<{ error?: unknown }>;
  defaultSortKey?: string;
  defaultSortDirection?: 'asc' | 'desc';
  pageSize?: number;                         // default: 25, 0 = no pagination
  refreshKey?: number;                       // parent triggers refetch
  emptyMessage?: string;                     // default: "Brak danych"
  label?: string;                            // section header (used in ViewSingle context)
  disabled?: boolean;                        // disabled state (create mode)
  disabledMessage?: string;                  // hint when disabled
}

interface ColumnOverride {
  key: string;
  label?: string;
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
}
```

### Internal Architecture (Strategy Pattern)

```
ManyRecords (orchestrator)
  ├── Manages: query execution, sort state, page state, loading/error
  ├── Resolves columns: COLUMN_REGISTRY[tableName] + hiddenColumns + columns override
  ├── Delegates rendering by mode:
  │   ├── TableRenderer — <table>, sortable <th>, rows with column cells
  │   ├── CardsRenderer — responsive grid, each card shows key-value fields
  │   └── ListRenderer  — single-column, compact stacked items
  └── All renderers receive: { rows, columns, sortState, handlers }
```

### Internal State Flow

```
sort state:     sortKey: string | null, sortDirection: 'asc' | 'desc'
page state:     page: number (0-based)
deps:           [sortKey, sortDirection, page, refreshKey]

Mode: table
  Click column header → toggle sort → useAsync re-runs → .order() → new data

Mode: cards | list
  Optional dropdown sort control → same mechanism

Click next/prev page →
  page += 1 or page -= 1 → useAsync re-runs → .range() → new data
```

### Column Resolution Flow

```
1. Supabase response: [{ id: "abc", name: "Apt 1", status: "active", monthly_rent: 2500 }, ...]
2. Object.keys(data[0]): ["id", "name", "status", "monthly_rent"]
3. Resolve each via resolveColumnConfig(tableName, key, perUsageOverride)
4. Filter out hidden columns
5. Result: ordered column configs with labels + renderers
   → name: { label: "Nazwa" }
   → status: { label: "Status", render: renderPropertyStatus }
   → monthly_rent: { label: "Czynsz miesięczny", render: formatCurrency }
```

### Display Modes

**Table mode** (`mode="table"`):
- `<table>` with `<th scope="col">` headers
- Click header → server-side sort toggle
- `aria-sort` on sorted column
- Rows render column values using `config.render(value)` or raw value

**Cards mode** (`mode="cards"`):
- Responsive CSS grid of cards
- Each card shows field label + value pairs
- Optional sort via dropdown control
- Clickable cards (if `onRowClick` provided)

**List mode** (`mode="list"`):
- Single-column stacked items
- Compact: 1-2 lines per item (first few visible columns)
- Best for simple entities (attachments, logs)

### Built-in Features

| Feature | Implementation |
|---------|---------------|
| **Server-side sort** | `.order(column, { ascending })` on Supabase query |
| **Server-side pagination** | `.range(from, to)` on Supabase query |
| **Column registry integration** | `tableName` → `COLUMN_REGISTRY` → labels + renderers |
| **Hidden columns** | `hiddenColumns` prop + registry `hidden: true` |
| **Column overrides** | `columns` prop for per-usage custom labels/renderers |
| **Loading state** | Shows `<Spinner />` during fetch |
| **Error state** | Shows `<ErrorBanner />` with retry |
| **Empty state** | Configurable message (default: "Brak danych") |
| **Add button** | `onAdd` prop → renders "Dodaj" button |
| **Row delete** | `onRowDelete` prop → per-row delete action with ConfirmDialog |
| **Clickable rows** | `onRowClick` prop for navigation |
| **Refresh** | `refreshKey` prop — parent increments to trigger refetch |
| **Disabled mode** | `disabled` prop — shows `disabledMessage` instead of data |

### Accessibility

- `<th scope="col">` on all header cells (table mode)
- `aria-sort="ascending"` / `"descending"` / `"none"` on sorted column
- `role="button"` + `tabIndex={0}` on clickable rows/cards
- `role="alert"` on error messages

---

## 4.7 SingleRecordDetails — Controlled Inline View/Edit/Create

SingleRecordDetails renders **one record's scalar fields** in a consistent layout. It is a **controlled component** — it receives values and reports changes, never fetches or saves.

| ID | Rule | Severity |
|----|------|----------|
| P-019 | **SingleRecordDetails is controlled** — `values` + `onChange` from parent, no internal state | 🔴 Critical |
| P-020 | **Inline edit — no layout shift** — view↔edit transition keeps identical layout | 🔴 Critical |
| P-021 | **Uses column registry** — `tableName` resolves labels, renderers, inputs, validation | 🔴 Critical |
| P-022 | **No domain imports** — entity-agnostic, lives in `components/shared/` | 🔴 Critical |

### Props

```typescript
interface SingleRecordDetailsProps {
  tableName: string;                          // resolves config from COLUMN_REGISTRY
  values: Record<string, unknown>;            // current field values (controlled by parent)
  onChange: (key: string, value: unknown) => void;  // report field change to parent
  mode: 'view' | 'edit' | 'create';          // controlled by parent (ViewSingle)
  fieldOverrides?: FieldOverride[];           // per-usage overrides (Priority 1)
  hiddenFields?: string[];                    // additional fields to hide
}

interface FieldOverride {
  key: string;
  label?: string;
  render?: (value: unknown) => React.ReactNode;
  input?: (value: unknown, onChange: (v: unknown) => void) => React.ReactNode;
  hidden?: boolean;
  readonly?: boolean;
  required?: boolean;
  validate?: (value: unknown) => string | null;
}
```

### Inline Edit — No Layout Shift

The **key design principle**: view and edit modes render the **same layout**. Only the value rendering changes:

```
View mode:  <label>Czynsz</label>    <span>2 500,00 PLN</span>
Edit mode:  <label>Czynsz</label>    <input value="2500" type="number" />
            ─────────────────────────────────────────────────
            Same label position, same value slot size, same spacing.
```

For each visible field, SingleRecordDetails:
1. Resolves `ColumnConfig` via `resolveColumnConfig(tableName, key, perUsageOverride)`
2. Skips if `config.hidden === true`
3. Renders label from `config.label`
4. **View mode:** renders `config.render(value)` or raw value as `<span>`
5. **Edit/Create mode:** renders `config.input(value, onChange)` or auto-deduced input
6. If `config.readonly`, always renders as view (even in edit mode)
7. If `config.required` and mode is edit/create, shows required indicator

### Field Type Auto-Deduction (Priority 4)

When no `render` or `input` is defined in the registry or overrides:

| Value Type | View Render | Edit Input |
|-----------|------------|------------|
| `string` | `<span>{value}</span>` | `<input type="text" />` |
| `number` | `<span>{value}</span>` | `<input type="number" />` |
| `boolean` | `<span>Tak/Nie</span>` | `<input type="checkbox" />` |
| Column ending `_at` | `formatDateTime(value)` | `<input type="datetime-local" />` |
| Column ending `_date` | `formatDate(value)` | `<input type="date" />` |
| Column ending `_id` | hidden by default | hidden |
| Column starting `is_` | boolean display | checkbox |
| `null` / `undefined` | `<span>—</span>` | `<input type="text" />` |

### Validation

```
For each field where mode === 'edit' || mode === 'create':
  1. If config.required && (value === null || value === undefined || value === '') → "Pole wymagane"
  2. If config.validate → config.validate(value) → error string or null
  3. Validation errors shown inline below the field
  4. Parent (ViewSingle) can check validation state before submitting
```

### Accessibility

- `<label htmlFor={key}>` linked to each input via `id={key}`
- `aria-required="true"` on required fields
- `aria-invalid="true"` + `role="alert"` on validation errors
- Semantic `<fieldset>` wrapper

---

## 4.8 SingleRecordReference — To-One FK Section

SingleRecordReference displays and manages a **to-one FK relationship** — a reference from the current record to a single other record (e.g., `lease.tenant_id → tenant`).

| ID | Rule | Severity |
|----|------|----------|
| P-023 | **SingleRecordReference is controlled** — `referenceId` + `onChange` from parent | 🔴 Critical |
| P-024 | **SingleRecordReference fetches only the referenced record** — via `query` prop | 🔴 Critical |
| P-025 | **No domain imports** — entity-agnostic, lives in `components/shared/` | 🔴 Critical |

### Props

```typescript
interface SingleRecordReferenceProps {
  label: string;                              // Section header (e.g., "Najemca", "Nieruchomość")
  referenceId: string | null;                 // Current FK value (controlled by parent)
  onChange: (newId: string | null) => void;    // Report FK change to parent
  query: (id: string) => SupabaseQuerySingle; // Fetch the referenced record by ID
  summaryFields?: string[];                   // Which fields to show in summary (default: first 3 visible)
  pickerQuery: () => SupabaseQueryLike;       // Query for RecordPicker (all available records)
  pickerTableName: string;                    // For column registry in RecordPicker
  navigateTo?: (id: string) => string;        // URL for full navigation to ViewSingle of referenced entity
  nullable?: boolean;                         // Can the FK be set to null? (default: false)
  mode: 'view' | 'edit' | 'create';          // From parent ViewSingle
}
```

### Mode Behavior

| Mode | Reference Set | Reference Not Set |
|------|:---:|:---:|
| **view** | Summary + [Podgląd] + [Otwórz] | "Brak" (no actions) |
| **edit** | Summary + [Podgląd] + [Zmień] + [Usuń]* | [Wybierz] button |
| **create** | Summary + [Zmień] | [Wybierz] button (required indicator if `!nullable`) |

*[Usuń] only shown when `nullable === true`

### Visual Layout

```
┌──────────────────────────────────────────────────┐
│ Najemca                                          │
│──────────────────────────────────────────────────│
│ Jan Kowalski · jan@email.com · +48 600 123 456   │  ← summary (first N visible fields)
│                                                  │
│ [Podgląd]  [Otwórz ↗]  [Zmień]  [Usuń]          │  ← actions (vary by mode)
└──────────────────────────────────────────────────┘

When referenceId is null:
┌──────────────────────────────────────────────────┐
│ Najemca *                                        │  ← * = required (when !nullable)
│──────────────────────────────────────────────────│
│ Nie wybrano                                      │
│                                                  │
│ [Wybierz]                                        │
└──────────────────────────────────────────────────┘
```

### Actions

| Action | What Happens |
|--------|-------------|
| **Podgląd** (Preview) | Opens modal with SingleRecordDetails in `view` mode (read-only). Modal includes [Otwórz ↗] link to navigate to full ViewSingle page. |
| **Otwórz ↗** (Open) | Navigates to ViewSingle page of the referenced entity (via `navigateTo` prop) |
| **Zmień** (Change) | Opens RecordPicker modal → user selects existing or creates new → `onChange(newId)` |
| **Usuń** (Remove) | ConfirmDialog → `onChange(null)` (only when `nullable === true`) |
| **Wybierz** (Select) | Opens RecordPicker modal → same as Zmień |

### Data Fetching

SingleRecordReference fetches **only the referenced record** using the `query` prop:

```typescript
// Internal: fetch referenced record when referenceId changes
const refState = useAsync(async () => {
  return referenceId
    ? await query(referenceId)
    : { data: null, error: null };
}, [referenceId]);
```

The summary display uses `refState.data` — showing the first N visible fields (or `summaryFields` if specified).

---

## 4.9 RecordPicker — Selection/Creation Modal

RecordPicker is a **modal dialog** for selecting an existing record or creating a new one. It is used by SingleRecordReference (change/select) and ManyRecords (add related).

| ID | Rule | Severity |
|----|------|----------|
| P-026 | **Single-depth modal** — browse + create as internal tabs, never nested modals | 🔴 Critical |
| P-027 | **RecordPicker no domain imports** — entity-agnostic, lives in `components/shared/` | 🔴 Critical |

### Props

```typescript
interface RecordPickerProps {
  title: string;                              // Modal title (e.g., "Wybierz najemcę")
  query: () => SupabaseQueryLike;             // Query for browsing existing records
  tableName: string;                          // For column registry in ManyRecords + SingleRecordDetails
  onSelect: (id: string) => void;             // Called when user selects/creates a record
  onClose: () => void;                        // Close the modal
  hiddenColumns?: string[];                   // Columns to hide in browse view
  defaultValues?: Record<string, unknown>;    // Pre-filled values for create tab (e.g., { property_id: parentId })
}
```

### Internal Structure

```
RecordPicker Modal
├── Tab: "Wybierz istniejący" (Browse)
│   └── ManyRecords (mode: 'table', query from props)
│       └── Click row → onSelect(row.id) → modal closes
│
├── Tab: "Utwórz nowy" (Create)
│   └── SingleRecordDetails (mode: 'create', with defaultValues)
│       └── Submit → INSERT → onSelect(newRecord.id) → modal closes
│
└── [Zamknij] → onClose
```

**No nested modals.** The browse tab uses ManyRecords inline (not in another modal). The create tab uses SingleRecordDetails inline. Tab switching happens within the same modal.

### Usage from SingleRecordReference

```typescript
// When user clicks [Zmień] or [Wybierz]:
<RecordPicker
  title="Wybierz najemcę"
  query={() => database.from('tenants').select('*')}
  tableName="tenants"
  onSelect={(id) => onChange(id)}  // updates parent formState
  onClose={() => setShowPicker(false)}
/>
```

### Usage from ManyRecords (add related)

```typescript
// When user clicks [Dodaj] on a to-many section:
<RecordPicker
  title="Dodaj transakcję"
  query={() => database.from('transactions').select('*')}
  tableName="transactions"
  onSelect={(id) => handleRefresh()}  // refresh the ManyRecords list
  onClose={() => setShowPicker(false)}
  defaultValues={{ lease_id: parentId, property_id: parentPropertyId }}
/>
```

---

## 4.10 Other Universal Components

These components are **entity-agnostic** and **do not fetch data**. They are purely props-driven.

| ID | Rule | Severity |
|----|------|----------|
| P-028 | **Generic universals accept all config via props** | 🔴 Critical |
| P-029 | **Generic universals no domain imports** — no `@/api/`, `@/hooks/`, `@/constants/` | 🔴 Critical |
| P-030 | **All universals live in `components/shared/`** | 🟠 High |

### Catalog

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `ManyRecords` | Multi-record display (table/cards/list) | `tableName`, `query`, `mode?`, `hiddenColumns?`, `onRowClick?`, `onAdd?`, `refreshKey?` |
| `SingleRecordDetails` | Single record inline view/edit/create | `tableName`, `values`, `onChange`, `mode` |
| `SingleRecordReference` | To-one FK section | `label`, `referenceId`, `onChange`, `query`, `pickerQuery`, `mode` |
| `RecordPicker` | Selection/creation modal | `title`, `query`, `tableName`, `onSelect`, `onClose` |
| `ConfirmDialog` | Destructive action confirmation | `message: string`, `onConfirm: () => void`, `onCancel: () => void`, `loading?: boolean` |
| `Spinner` | Loading indicator | none |
| `ErrorBanner` | Error message with retry | `msg: string`, `retry?: () => void` |
| `EmptyState` | No-data placeholder | `message: string`, `actionLabel?`, `actionHref?` |
| `AppLayout` | Header + sidebar + main area | `children: ReactNode` |
| `RoleGuard` | Route-level auth check | `allowedRoles: string[]`, `children: ReactNode` |
| `Sidebar` | Role-based navigation | none (reads role internally) |

---

## 4.11 Relationship Rendering

How to present database relationships using the 3 section types:

### One-to-Many (parent → children)

ViewSingle[Parent] embeds ManyRecords instances with filtered queries:

```typescript
// Inside ViewSingleProperty → shows leases for this property
<ManyRecords
  label="Umowy najmu"
  tableName="lease_agreements"
  query={() => database.from('lease_agreements').select('*').eq('property_id', id)}
  hiddenColumns={['id', 'property_id']}
  onRowClick={(row) => navigate(routes.landlord.leases({ id: row.id as string }))}
  onAdd={() => { /* open RecordPicker for new lease with property_id pre-filled */ }}
  refreshKey={refreshKey}
/>
```

### Many-to-One (child → parent via FK)

ViewSingle[Child] uses SingleRecordReference for each FK out:

```typescript
// Inside ViewSingleLease → shows the referenced tenant
<SingleRecordReference
  label="Najemca"
  referenceId={formState.tenant_id as string}
  onChange={(newId) => updateField('tenant_id', newId)}
  query={(refId) => database.from('tenants').select('*').eq('id', refId).single()}
  pickerQuery={() => database.from('tenants').select('*')}
  pickerTableName="tenants"
  navigateTo={(refId) => routes.landlord.tenants({ id: refId })}
  mode={mode}
/>
```

### Many-to-Many (through junction table)

Rendered as one-to-many from each side:

```
tenants ↔ properties via lease_agreements:
  ViewSingleProperty → ManyRecords: leases.eq('property_id', id)
  ViewSingleTenant   → ManyRecords: leases.eq('tenant_id', id)
```

### Database Views

ManyRecords works with Supabase views (denormalized data):

```typescript
<ManyRecords
  tableName="active_leases"  // view name — needs its own COLUMN_REGISTRY entry
  query={() => database.from('active_leases').select('*')}
  mode="table"
  hiddenColumns={['created_at', 'created_by', 'updated_at', 'notes']}
/>
```

---

## 4.12 CRUD URL State Machine

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

### After Mutation Navigation

```
Create success → navigate to ?id={newId} (view created record)
Update success → refresh current detail (refreshKey + setMode('view'))
Delete success → navigate to list (no params)
```

---

## 4.13 Adding a New Entity (Checklist)

When adding a new database entity to the frontend:

```
1. □ DB migration created & applied (supabase db reset)
2. □ Types regenerated (supabase gen types typescript)
3. □ Column registry entry added to constants/columnRegistry.tsx
4. □ Route param type added to routes/index.ts
5. □ Route generator added to routes object
6. □ Page mini-router created: app/[role]/[entity]/page.tsx
7. □ ViewAll[Entity].tsx — configures ManyRecords with query + display mode
8. □ ViewSingle[Entity].tsx — composes all 3 section types:
     □ SingleRecordDetails for own fields
     □ SingleRecordReference for each FK out
     □ ManyRecords for each FK in (related child records)
9. □ Sidebar nav item added (if top-level entity)
```

---

## Quick Reference — Layer 4 Rules

| ID | Rule | Severity |
|----|------|----------|
| P-001 | **View* = Smart Orchestrator** — manages mode, formState, mutations | 🔴 Critical |
| P-002 | **ManyRecords = Smart-Universal** — fetches lists via injected query | 🔴 Critical |
| P-003 | **SingleRecordDetails = Controlled** — values + onChange, never fetches | 🔴 Critical |
| P-004 | **SingleRecordReference = Controlled** — referenceId + onChange, fetches ref only | 🔴 Critical |
| P-005 | **Data flows down** — parent → child via props/queries/callbacks | 🔴 Critical |
| P-006 | **View* prefix = top-level** — imported by pages only | 🟠 High |
| P-007 | **Central column registry** — labels, renderers, inputs in `constants/columnRegistry.tsx` | 🔴 Critical |
| P-008 | **4-level resolution** — per-usage → table-specific → global → auto-deduce | 🔴 Critical |
| P-009 | **Locale pl-PL** — all UI labels in Polish | 🟠 High |
| P-010 | **ViewSingle owns formState** — scalar fields + FK values | 🔴 Critical |
| P-011 | **ViewSingle controls mode** — view / edit / create | 🔴 Critical |
| P-012 | **ViewSingle handles mutations** — INSERT/UPDATE/DELETE | 🔴 Critical |
| P-013 | **All 3 sections visible in every mode** — to-many disabled in create mode | 🟠 High |
| P-014 | **ManyRecords `query` prop** — function returning fresh Supabase query builder | 🔴 Critical |
| P-015 | **ManyRecords applies `.order()` internally** — caller never adds sorting | 🔴 Critical |
| P-016 | **ManyRecords applies `.range()` internally** — server-side pagination | 🟠 High |
| P-017 | **ManyRecords uses column registry** — `tableName` resolves labels + renderers | 🔴 Critical |
| P-018 | **ManyRecords no domain imports** — entity-agnostic | 🔴 Critical |
| P-019 | **SingleRecordDetails is controlled** — values + onChange from parent | 🔴 Critical |
| P-020 | **Inline edit — no layout shift** — view↔edit keeps identical layout | 🔴 Critical |
| P-021 | **SingleRecordDetails uses column registry** | 🔴 Critical |
| P-022 | **SingleRecordDetails no domain imports** | 🔴 Critical |
| P-023 | **SingleRecordReference is controlled** — referenceId + onChange from parent | 🔴 Critical |
| P-024 | **SingleRecordReference fetches only the referenced record** | 🔴 Critical |
| P-025 | **SingleRecordReference no domain imports** | 🔴 Critical |
| P-026 | **RecordPicker single-depth modal** — browse + create as tabs, no nesting | 🔴 Critical |
| P-027 | **RecordPicker no domain imports** | 🔴 Critical |
| P-028 | **Generic universals props-only** — Spinner, ErrorBanner, EmptyState, ConfirmDialog | 🔴 Critical |
| P-029 | **Generic universals no domain imports** | 🔴 Critical |
| P-030 | **All universals in `components/shared/`** | 🟠 High |
