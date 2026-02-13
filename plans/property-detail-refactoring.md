# PropertyDetail Refactoring Plan

## Overview

Create self-contained table components. Each component reflects one database table with clickable rows via `onRowClick` callback. No nested tables, no links inside. All tables share one CSS file.

## File Structure

```
frontend/src/
constants/labels.ts
components/landlord/tables/
  Tables.module.css          # Shared CSS for all tables
  MetersTable.tsx
  LeasesTable.tsx
  BillingTable.tsx
  PaymentsTable.tsx
  ExpensesTable.tsx
  AttachmentsGrid.tsx
```

## Component Props Pattern

```typescript
interface TableProps<T> {
    data: T[];
    onRowClick?: (id: string) => void;
}
```

## Components

### 1. MetersTable
- **Data**: `Meter[]` (flat, no nested readings)
- **Columns**: Type, Number, Unit, Active

### 2. LeasesTable
- **Data**: `Lease[]` with tenant name via join
- **Columns**: Tenant, Period, Rent, Status

### 3. BillingTable
- **Data**: `BillingItem[]` with payment totals via join
- **Columns**: Description, Type, Amount, Paid, Balance, Due, Status

### 4. PaymentsTable
- **Data**: `Payment[]`
- **Columns**: Date, Amount, Method, Notes

### 5. ExpensesTable
- **Data**: `Expense[]`
- **Columns**: Date, Type, Description, Amount

### 6. AttachmentsGrid
- **Data**: `Attachment[]`
- **Layout**: Grid of cards with icon, name, type

## Shared CSS (Tables.module.css)

```css
.section { /* wrapper with title */ }
.table { /* table styling */ }
.clickableRow { cursor: pointer; hover effect }
.statusBadge { /* base badge */ }
.statusActive { /* green */ }
.statusExpired { /* yellow */ }
.statusTerminated { /* red */ }
.positive { /* green amount */ }
.negative { /* red amount */ }
.grid { /* attachments grid */ }
.card { /* attachment card */ }
```

## Implementation Order

1. Create `constants/labels.ts`
2. Create `Tables.module.css`
3. Create each table component
4. Refactor `PropertyDetail.tsx` to use table components

## Usage Example

```typescript
import styles from './Tables.module.css';

<MetersTable
    data={meters}
    onRowClick={id => router.push(`/landlord/meters?id=${id}`)}
/>
```
