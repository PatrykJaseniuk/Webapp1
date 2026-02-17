# Plan: Add Database References to Detail Components

## Overview
Modify existing detail components and create a new TransactionDetail component to display all database table references. One-to-many relationships will be displayed as tables, while one-to-one/lookup references will be displayed inline.

---

## Database Relationships Summary

### Tables and References:
- **properties**: created_by (users), referenced by lease_agreements, transactions
- **tenants**: user_id (users), referenced by lease_agreements  
- **lease_agreements**: tenant_id (tenants), property_id (properties), created_by (users), referenced by transactions, attachments
- **transactions**: lease_id (lease_agreements), property_id (properties), created_by (users)
- **attachments**: created_by (users), related_to_id (polymorphic: property/tenant/lease/maintenance/meter_reading/expense)

---

## Component Modifications

### 1. PropertyDetail (PropertyDetail.tsx)

#### Currently Shows:
- Property details (name, address, type, status, rent, deposit, size, bedrooms, notes)
- Current lease from property_occupancy view (tenant name, rent, period)
- Attachments
- Transactions (billing, expenses)
- Financial summary

#### Missing References to Add:
| Reference | Type | Display Format | Notes |
|-----------|------|-----------------|-------|
| All lease agreements | Many | Table | Show all historical leases with tenant name, period, status |
| All tenants (historical) | Many | Table | From lease_agreements - unique tenants who rented |
| Property creator (created_by) | One | Inline | Link to user or display "System" if null |
| All transactions | Many | Table | Already exists, ensure shows all with lease reference |

#### New Sections to Add:
1. **Historia umów** (Lease History) - table with all lease agreements
2. **Historia najemców** (Tenant History) - table with unique tenants from leases  
3. **Twórca** (Creator) - inline display in property details section

---

### 2. TenantDetail (TenantDetail.tsx)

#### Currently Shows:
- Tenant contact details (name, email, phone, id document, emergency contact, notes)
- All lease agreements with property info
- Active leases in sidebar
- Billing items (from billing_with_payments view)

#### Missing References to Add:
| Reference | Type | Display Format | Notes |
|-----------|------|-----------------|-------|
| User account (user_id) | One | Inline | Link to account or "Nie połączono" |
| Attachments | Many | Table | Show all attachments for this tenant |
| All transactions | Many | Table | From all tenant's leases |

#### New Sections to Add:
1. **Konto użytkownika** (User Account) - inline in contact details
2. **Załączniki** (Attachments) - table with all tenant attachments
3. **Wszystkie transakcje** (All Transactions) - table with transactions from all leases

---

### 3. LeaseDetail (LeaseDetail.tsx)

#### Currently Shows:
- Lease details with property name/address and tenant name
- Transactions/billing items
- Payments

#### Missing References to Add:
| Reference | Type | Display Format | Notes |
|-----------|------|-----------------|-------|
| Property details | One | Card | Full property info (address, type, rent, status) |
| Tenant details | One | Card | Full tenant info (email, phone, status) |
| Attachments | Many | Table | Show all lease-related attachments |
| Lease creator (created_by) | One | Inline | Display creator info |

#### New Sections to Add:
1. **Szczegóły nieruchomości** (Property Details) - card with full property info
2. **Szczegóły najemcy** (Tenant Details) - card with full tenant info
3. **Załączniki** (Attachments) - table with lease attachments
4. **Twórca umowy** (Created By) - inline in lease details

---

### 4. TransactionDetail (NEW COMPONENT)

#### Create new component with:
| Reference | Type | Display Format | Notes |
|-----------|------|-----------------|-------|
| Transaction details | — | Inline | type, amount, description, status, dates |
| Lease (if lease_id exists) | One | Card | Link to lease with property and tenant info |
| Property (if property_id exists) | One | Card | Full property details |
| Property (if no lease) | One | Card | For property-level expenses |
| Attachments | Many | Table | Transaction-related documents |
| Creator (created_by) | One | Inline | Display who created |

#### Layout:
```
Transaction Details (main section)
├── Basic info (type, amount, description, status, dates)
├── Lease reference (if exists) - Card with link
├── Property reference (if exists) - Card with link  
├── Attachments - Table
└── Creator - Inline
```

---

## Implementation Order

1. Add missing labels to constants/labels.ts for transaction types
2. Modify PropertyDetail - add lease history table, tenant history table, creator
3. Modify TenantDetail - add user account link, attachments table, transactions table
4. Modify LeaseDetail - add property card, tenant card, attachments table, creator
5. Create TransactionDetail component
6. Update routes to support transaction detail view
7. Update PaymentsList to link to transaction detail

---

## Key Technical Notes

### Query Patterns:
- Use Supabase joins for fetching related data
- Use `select('*, table(column1, column2)')` for fetching related records
- Use polymorphic queries for attachments (filter by related_to_type and related_to_id)

### Display Patterns:
- **One-to-Many**: Use existing table components (LeasesTable style)
- **One-to-One**: Use info cards with label-value pairs
- **Lookup references**: Use inline links to related detail pages

### Labels to Add:
```typescript
// Transaction type labels
export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
    rent: 'Czynsz',
    utility: 'Media',
    expense: 'Wydatek',
    payment: 'Płatność',
    withdraw: 'Wypłata',
    fee: 'Opłata',
    other: 'Inne',
};
```
