# Implementation Plan — Rental Management System Frontend

**Purpose:** Step-by-step build plan for the entire frontend application.  
**Related:** [System Architecture Guide](./SYSTEM_ARCHITECTURE_GUIDE.md) · [Frontend Style Guide](./FRONTEND_STYLE_GUIDE.md) · [Backend Style Guide](./BACKEND_STYLE_GUIDE.md)

---

## Current State

| Layer | Status | Details |
|-------|--------|---------|
| **Database** | ✅ Complete | 12 tables, indexes, constraints, functions/triggers, RLS policies, views, seed data |
| **Supabase Client** | ✅ Complete | `src/api/database.ts` + auto-generated `database.types.ts` |
| **Frontend Scaffold** | ✅ Complete | `package.json`, `next.config.ts`, `tsconfig.json` — dependencies installed |
| **Frontend App** | 🔲 Not Started | No pages, no components, no hooks, no utilities |

---

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Component structure | Domain-grouped flat | No redundant `Button/Button.tsx` nesting; grouped by feature domain |
| Routing | Role-separated (`/tenant/*`, `/landlord/*`, `/admin/*`) | Clean separation, no conditional role rendering in components |
| Detail/edit views | URL search params (`?id=xxx`, `?action=new`) | No dynamic routes — `output: 'export'` incompatible with `[id]` segments |
| Role protection | `RoleGuard` component per page | Each page wrapper imports RoleGuard + domain component |
| Data fetching | `useAsync` (load) / `useAsyncFn` (actions) from react-use | Per Frontend Style Guide F-008 |
| Styling | CSS Modules (`.module.css`) co-located with components | Per Frontend Style Guide F-007 |

---

## Phase 1: Foundation — Shared Infrastructure

**Goal:** Create all reusable building blocks that every page depends on.

### 1.1 Utilities

| # | File | Purpose |
|---|------|---------|
| 1 | `src/utils/formatCurrency.ts` | Format numbers as PLN currency (`1 234,56 zł`) |
| 2 | `src/utils/formatDate.ts` | Format ISO dates to locale strings |

### 1.2 Hooks

| # | File | Purpose | Key Details |
|---|------|---------|-------------|
| 1 | `src/hooks/useAuth.ts` | Auth state management | `login()`, `signup()`, `logout()`, `user`, `session`, `isAuthenticated`. Uses `database.auth` + `onAuthStateChange`. |
| 2 | `src/hooks/useUserRole.ts` | Fetch current user's role | Queries `user_roles` table, returns `{ role, loading, error }`. Depends on `useAuth` for `user.id`. |

### 1.3 Shared Components

| # | File | CSS | Purpose | Key Details |
|---|------|-----|---------|-------------|
| 1 | `src/components/shared/Spinner.tsx` | `Spinner.module.css` | Loading indicator | Simple CSS spinner animation |
| 2 | `src/components/shared/ErrorBanner.tsx` | `ErrorBanner.module.css` | Error display with retry | Props: `msg: string`, `retry?: () => void` |
| 3 | `src/components/shared/EmptyState.tsx` | `EmptyState.module.css` | Empty data placeholder | Props: `message: string`, `actionLabel?: string`, `actionHref?: string` |
| 4 | `src/components/shared/RoleGuard.tsx` | `RoleGuard.module.css` | Role-based access control | Props: `allowedRoles: string[]`, `children`. Uses `useAuth` + `useUserRole`. Shows Spinner while loading, "Access denied" if wrong role, redirects to login if unauthenticated. |
| 5 | `src/components/shared/AppLayout.tsx` | `AppLayout.module.css` | App shell (sidebar + header + content) | Wraps all authenticated pages. Shows user email in header, logout button. |
| 6 | `src/components/shared/Sidebar.tsx` | `Sidebar.module.css` | Navigation menu | Role-aware: shows different links for tenant/landlord/admin. Uses `useUserRole` to determine which nav items to render. |

### 1.4 App Shell

| # | File | Purpose | Key Details |
|---|------|---------|-------------|
| 1 | `src/app/globals.css` | CSS reset + design tokens | CSS custom properties: `--color-primary`, `--color-error`, `--spacing-*`, `--radius-*`, `--font-*` |
| 2 | `src/app/layout.tsx` | Root HTML layout | No `'use client'`. Imports `globals.css`. Sets `<html lang="pl">`, `<body>`. |

### Phase 1 Verification
- [ ] `npm run build` succeeds (empty app with layout)
- [ ] All shared components render correctly in isolation

---

## Phase 2: Authentication

**Goal:** Login, signup, and role-based home page redirect.

### 2.1 Auth Components

| # | File | CSS | Purpose | Key Details |
|---|------|-----|---------|-------------|
| 1 | `src/components/auth/LoginForm.tsx` | `LoginForm.module.css` | Email + password login | Uses `useAuth().login`. Shows loading state, error messages. On success → redirect based on role. |
| 2 | `src/components/auth/SignupForm.tsx` | `SignupForm.module.css` | Email + password registration | Uses `useAuth().signup`. Shows success message (check email). New users auto-assigned `tenant` role via DB trigger. |

### 2.2 Auth Pages

| # | File | Purpose | Key Details |
|---|------|---------|-------------|
| 1 | `src/app/login/page.tsx` | Login route | Thin wrapper → `<LoginForm />` |
| 2 | `src/app/signup/page.tsx` | Signup route | Thin wrapper → `<SignupForm />` |
| 3 | `src/app/page.tsx` | Landing / home | Checks auth + role → redirects to `/tenant/dashboard`, `/landlord/dashboard`, or `/admin/users`. Shows login prompt if unauthenticated. |

### Phase 2 Verification
- [ ] Can create account, login, see redirect to correct dashboard URL
- [ ] Unauthenticated user sees login prompt on `/`
- [ ] `npm run build` succeeds

---

## Phase 3: Landlord — Dashboard, Properties, Tenants

**Goal:** Core landlord management features.

### 3.1 Landlord Dashboard

| # | File | CSS | Purpose | Key Details |
|---|------|-----|---------|-------------|
| 1 | `src/components/landlord/LandlordDashboard.tsx` | `LandlordDashboard.module.css` | Overview dashboard | Summary cards: total properties, occupied/available count, active leases, unpaid billing total. Uses `useAsync` to fetch from views: `property_occupancy`, `unpaid_billing_summary`. |

### 3.2 Properties Management

| # | File | CSS | Purpose | Key Details |
|---|------|-----|---------|-------------|
| 1 | `src/components/landlord/PropertiesPage.tsx` | — | Mini-router | Reads `?id=` and `?action=` from `useSearchParams`. Routes to List/Detail/Form. |
| 2 | `src/components/landlord/PropertiesList.tsx` | `PropertiesList.module.css` | List all properties | Fetches `properties` table. Shows name, address, type, status badge, monthly rent. Link to detail (`?id=xxx`) and create (`?action=new`). |
| 3 | `src/components/landlord/PropertyDetail.tsx` | `PropertyDetail.module.css` | Single property view | Props: `id: string`. Fetches property by ID. Shows all fields, current lease info (from `property_occupancy` view), meters list, expenses summary. Edit button → `?action=edit&id=xxx`. |
| 4 | `src/components/landlord/PropertyForm.tsx` | `PropertyForm.module.css` | Create/edit property | Props: `id?: string` (edit mode if provided). Fields: name, address, type (select), size, bedrooms, monthly_rent, deposit, status, notes. Uses `useAsyncFn` for insert/update. On success → navigate to list. |

### 3.3 Tenants Management

| # | File | CSS | Purpose | Key Details |
|---|------|-----|---------|-------------|
| 1 | `src/components/landlord/TenantsPage.tsx` | — | Mini-router | Same pattern as PropertiesPage. |
| 2 | `src/components/landlord/TenantsList.tsx` | `TenantsList.module.css` | List all tenants | Fetches `tenants` table. Shows name, email, phone, status badge. |
| 3 | `src/components/landlord/TenantDetail.tsx` | `TenantDetail.module.css` | Tenant detail view | Props: `id: string`. Shows contact info, emergency contact, active leases, billing history for their leases. |
| 4 | `src/components/landlord/TenantForm.tsx` | `TenantForm.module.css` | Create/edit tenant | Fields: first_name, last_name, email, phone, id_document_number, emergency contacts, notes, status. |

### 3.4 Landlord Routes (Phase 3)

| # | File | Purpose |
|---|------|---------|
| 1 | `src/app/landlord/dashboard/page.tsx` | `<RoleGuard allowedRoles={['landlord', 'admin']}><LandlordDashboard /></RoleGuard>` |
| 2 | `src/app/landlord/properties/page.tsx` | `<RoleGuard ...><PropertiesPage /></RoleGuard>` |
| 3 | `src/app/landlord/tenants/page.tsx` | `<RoleGuard ...><TenantsPage /></RoleGuard>` |

### Phase 3 Verification
- [ ] Landlord dashboard shows property/lease/billing summaries
- [ ] Can CRUD properties (list → create → view detail → edit)
- [ ] Can CRUD tenants
- [ ] Non-landlord users see "Access denied" on `/landlord/*`
- [ ] `npm run build` succeeds

---

## Phase 4: Landlord — Leases, Billing, Payments

**Goal:** Financial management — lease agreements, charges, and payment recording.

### 4.1 Leases Management

| # | File | CSS | Purpose | Key Details |
|---|------|-----|---------|-------------|
| 1 | `src/components/landlord/LeasesPage.tsx` | — | Mini-router | `?id=`, `?action=new` |
| 2 | `src/components/landlord/LeasesList.tsx` | `LeasesList.module.css` | List all leases | Fetches `lease_agreements` with tenant/property names (join or use `active_leases` view). Shows status, dates, rent amount. Filter by status (active/expired/terminated). |
| 3 | `src/components/landlord/LeaseDetail.tsx` | `LeaseDetail.module.css` | Lease detail | Props: `id`. Shows terms, linked tenant/property, billing items for this lease, payment history. |
| 4 | `src/components/landlord/LeaseForm.tsx` | `LeaseForm.module.css` | Create/edit lease | Select tenant (dropdown from `tenants`), select property (dropdown from `properties` where available), start/end dates, monthly_rent, deposit, status, notes. |

### 4.2 Billing Management

| # | File | CSS | Purpose | Key Details |
|---|------|-----|---------|-------------|
| 1 | `src/components/landlord/BillingPage.tsx` | — | Mini-router | |
| 2 | `src/components/landlord/BillingList.tsx` | `BillingList.module.css` | List billing items | Fetches `billing_with_payments` view. Shows description, amount, balance, due date, status badge (pending/paid/overdue). Filter by status. |
| 3 | `src/components/landlord/BillingForm.tsx` | `BillingForm.module.css` | Create billing item | Select lease (dropdown), item_type (rent/utility/deposit/fee/other), description, amount, due_date. |

### 4.3 Payments Management

| # | File | CSS | Purpose | Key Details |
|---|------|-----|---------|-------------|
| 1 | `src/components/landlord/PaymentsPage.tsx` | — | Mini-router | |
| 2 | `src/components/landlord/PaymentsList.tsx` | `PaymentsList.module.css` | List all payments | Fetches `payments` with billing item info. Shows date, amount, method, related billing item. |
| 3 | `src/components/landlord/PaymentForm.tsx` | `PaymentForm.module.css` | Record payment | Select billing item (dropdown of unpaid items), amount, payment_date, payment_method (cash/bank_transfer/card/other), notes. |

### 4.4 Landlord Routes (Phase 4)

| # | File | Purpose |
|---|------|---------|
| 1 | `src/app/landlord/leases/page.tsx` | `<RoleGuard ...><LeasesPage /></RoleGuard>` |
| 2 | `src/app/landlord/billing/page.tsx` | `<RoleGuard ...><BillingPage /></RoleGuard>` |
| 3 | `src/app/landlord/payments/page.tsx` | `<RoleGuard ...><PaymentsPage /></RoleGuard>` |

### Phase 4 Verification
- [ ] Can create lease linking tenant ↔ property
- [ ] Property status auto-updates to "occupied" when active lease created (via DB trigger)
- [ ] Can create billing items, record payments
- [ ] `billing_with_payments` view shows correct balances
- [ ] `npm run build` succeeds

---

## Phase 5: Landlord — Meters, Utilities, Expenses

**Goal:** Utility meter tracking, bill calculation, and property expense management.

### 5.1 Meters & Readings

| # | File | CSS | Purpose | Key Details |
|---|------|-----|---------|-------------|
| 1 | `src/components/landlord/MetersPage.tsx` | — | Mini-router | Routes between list, meter form, reading form, readings history. Uses `?action=new-meter`, `?action=new-reading&meterId=xxx`, `?meterId=xxx` (history). |
| 2 | `src/components/landlord/MetersList.tsx` | `MetersList.module.css` | List meters grouped by property | Fetches `meters` joined with `properties`. Shows meter_type, meter_number, unit, active status. Latest reading from `latest_meter_readings` view. |
| 3 | `src/components/landlord/MeterForm.tsx` | `MeterForm.module.css` | Add/edit meter | Select property, meter_type (electricity/water/gas/heating), meter_number, unit (kwh/m3), active toggle. |
| 4 | `src/components/landlord/ReadingForm.tsx` | `ReadingForm.module.css` | Record meter reading | Props: `meterId?: string`. Select meter (or pre-filled), reading_value, reading_date, notes. |
| 5 | `src/components/landlord/ReadingsHistory.tsx` | `ReadingsHistory.module.css` | Readings history for a meter | Props: `meterId: string`. Fetches `meter_readings` ordered by date DESC. Shows value, date, consumption delta from previous reading. |

### 5.2 Utility Prices

| # | File | CSS | Purpose | Key Details |
|---|------|-----|---------|-------------|
| 1 | `src/components/landlord/UtilityPricesList.tsx` | `UtilityPricesList.module.css` | List utility prices | Fetches `utility_prices` ordered by effective_date DESC. Grouped by utility_type. Shows price_per_unit, effective_date. |
| 2 | `src/components/landlord/UtilityPriceForm.tsx` | `UtilityPriceForm.module.css` | Add new price | utility_type (select), price_per_unit, effective_date. |

### 5.3 Property Expenses

| # | File | CSS | Purpose | Key Details |
|---|------|-----|---------|-------------|
| 1 | `src/components/landlord/ExpensesList.tsx` | `ExpensesList.module.css` | List property expenses | Fetches `property_expenses` with property name. Filter by property, expense_type. Shows description, amount, date, type badge. |
| 2 | `src/components/landlord/ExpenseForm.tsx` | `ExpenseForm.module.css` | Add/edit expense | Select property, expense_type (maintenance/tax/insurance/renovation/other), description, amount, expense_date. |

### 5.4 Landlord Routes (Phase 5)

| # | File | Purpose |
|---|------|---------|
| 1 | `src/app/landlord/meters/page.tsx` | `<RoleGuard ...><MetersPage /></RoleGuard>` |
| 2 | `src/app/landlord/utility-prices/page.tsx` | `<RoleGuard ...>` wrapping `UtilityPricesList` + `UtilityPriceForm` (inline `?action=new` router) |
| 3 | `src/app/landlord/expenses/page.tsx` | `<RoleGuard ...>` wrapping expenses page router |

### Phase 5 Verification
- [ ] Can add meters to properties, record readings
- [ ] Readings history shows consumption deltas
- [ ] Can manage utility prices
- [ ] Can add property expenses
- [ ] `npm run build` succeeds

---

## Phase 6: Tenant Views

**Goal:** Read-only tenant experience — view own properties, leases, billing, meters, and edit profile.

### 6.1 Tenant Components

| # | File | CSS | Purpose | Key Details |
|---|------|-----|---------|-------------|
| 1 | `src/components/tenant/TenantDashboard.tsx` | `TenantDashboard.module.css` | Tenant overview | Shows active leases, upcoming bills, recent payments. Uses `active_leases` view filtered to current tenant, `unpaid_billing_summary`. |
| 2 | `src/components/tenant/TenantProperties.tsx` | `TenantProperties.module.css` | My properties | Lists properties linked via active leases. Read-only view: name, address, type, lease dates. |
| 3 | `src/components/tenant/TenantLeases.tsx` | `TenantLeases.module.css` | My leases | Lists own leases (active + past). Shows property name, dates, rent, status. Detail view with `?id=xxx` showing full lease terms. |
| 4 | `src/components/tenant/TenantBilling.tsx` | `TenantBilling.module.css` | My bills | Lists own billing items from `billing_with_payments` view. Shows status badges, amounts, balance. Read-only. |
| 5 | `src/components/tenant/TenantMeters.tsx` | `TenantMeters.module.css` | My meters | Lists meters for leased properties with latest readings. Shows consumption history. Read-only. |
| 6 | `src/components/tenant/TenantProfile.tsx` | `TenantProfile.module.css` | Edit my profile | Fetches own `tenants` record (by `user_id`). Editable fields: phone, emergency_contact_name, emergency_contact_phone. Uses `useAsyncFn` for update. |

### 6.2 Tenant Routes

| # | File | Purpose |
|---|------|---------|
| 1 | `src/app/tenant/dashboard/page.tsx` | `<RoleGuard allowedRoles={['tenant']}><TenantDashboard /></RoleGuard>` |
| 2 | `src/app/tenant/properties/page.tsx` | `<RoleGuard ...><TenantProperties /></RoleGuard>` |
| 3 | `src/app/tenant/leases/page.tsx` | `<RoleGuard ...><TenantLeases /></RoleGuard>` |
| 4 | `src/app/tenant/billing/page.tsx` | `<RoleGuard ...><TenantBilling /></RoleGuard>` |
| 5 | `src/app/tenant/meters/page.tsx` | `<RoleGuard ...><TenantMeters /></RoleGuard>` |
| 6 | `src/app/tenant/profile/page.tsx` | `<RoleGuard ...><TenantProfile /></RoleGuard>` |

### Phase 6 Verification
- [ ] Tenant sees only their own data (verified via RLS)
- [ ] Tenant can update their contact info
- [ ] Tenant cannot access `/landlord/*` or `/admin/*` routes
- [ ] All views handle loading/error/empty states
- [ ] `npm run build` succeeds

---

## Phase 7: Admin — User Management + Final Polish

**Goal:** Admin-only user role management and final verification.

### 7.1 Admin Components

| # | File | CSS | Purpose | Key Details |
|---|------|-----|---------|-------------|
| 1 | `src/components/admin/UserRolesList.tsx` | `UserRolesList.module.css` | List all users + roles | Fetches `user_roles` table (admin can see all via RLS). Shows user_id, role, created_at. Edit button per row. |
| 2 | `src/components/admin/UserRoleForm.tsx` | `UserRoleForm.module.css` | Change user role | Props: `userId: string`. Select new role (tenant/landlord/admin). Uses `useAsyncFn` to update `user_roles`. |

### 7.2 Admin Routes

| # | File | Purpose |
|---|------|---------|
| 1 | `src/app/admin/users/page.tsx` | `<RoleGuard allowedRoles={['admin']}><UserRolesList /></RoleGuard>` (with inline `?id=xxx` routing to `UserRoleForm`) |

### 7.3 Final Verification
- [ ] Admin can view and change user roles
- [ ] Only admin can access `/admin/*`
- [ ] Full end-to-end flow: signup → assign landlord role → create property → create tenant → create lease → add billing → record payment
- [ ] All pages handle loading, error, empty states
- [ ] `npm run build` succeeds with zero errors
- [ ] All routes accessible via static export

---

## Complete File Inventory

### Routes (18 page files)

| Route | File | Role Guard |
|-------|------|------------|
| `/` | `app/page.tsx` | Public (redirects by role) |
| `/login` | `app/login/page.tsx` | Public |
| `/signup` | `app/signup/page.tsx` | Public |
| `/tenant/dashboard` | `app/tenant/dashboard/page.tsx` | `['tenant']` |
| `/tenant/properties` | `app/tenant/properties/page.tsx` | `['tenant']` |
| `/tenant/leases` | `app/tenant/leases/page.tsx` | `['tenant']` |
| `/tenant/billing` | `app/tenant/billing/page.tsx` | `['tenant']` |
| `/tenant/meters` | `app/tenant/meters/page.tsx` | `['tenant']` |
| `/tenant/profile` | `app/tenant/profile/page.tsx` | `['tenant']` |
| `/landlord/dashboard` | `app/landlord/dashboard/page.tsx` | `['landlord', 'admin']` |
| `/landlord/properties` | `app/landlord/properties/page.tsx` | `['landlord', 'admin']` |
| `/landlord/tenants` | `app/landlord/tenants/page.tsx` | `['landlord', 'admin']` |
| `/landlord/leases` | `app/landlord/leases/page.tsx` | `['landlord', 'admin']` |
| `/landlord/billing` | `app/landlord/billing/page.tsx` | `['landlord', 'admin']` |
| `/landlord/payments` | `app/landlord/payments/page.tsx` | `['landlord', 'admin']` |
| `/landlord/meters` | `app/landlord/meters/page.tsx` | `['landlord', 'admin']` |
| `/landlord/utility-prices` | `app/landlord/utility-prices/page.tsx` | `['landlord', 'admin']` |
| `/landlord/expenses` | `app/landlord/expenses/page.tsx` | `['landlord', 'admin']` |
| `/admin/users` | `app/admin/users/page.tsx` | `['admin']` |

### Components (43 component files + 37 CSS modules)

| Domain | Components | CSS Modules |
|--------|-----------|-------------|
| `shared/` | 6 | 6 |
| `auth/` | 2 | 2 |
| `tenant/` | 6 | 6 |
| `landlord/` | 27 | 21 (Page routers don't need CSS) |
| `admin/` | 2 | 2 |
| **Total** | **43** | **37** |

### Hooks (2 files)

| File | Exports |
|------|---------|
| `useAuth.ts` | `useAuth` → `{ user, session, isAuthenticated, login, loginState, signup, signupState, logout }` |
| `useUserRole.ts` | `useUserRole` → `{ role, loading, error }` |

### Utilities (2 files)

| File | Exports |
|------|---------|
| `formatCurrency.ts` | `formatCurrency(amount: number): string` → `"1 234,56 zł"` |
| `formatDate.ts` | `formatDate(isoDate: string): string`, `formatDateShort(isoDate: string): string` |

### App Shell (2 files)

| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root HTML layout |
| `app/globals.css` | CSS reset + design tokens |

### Grand Total: ~86 files

---

## Database Tables ↔ Frontend Mapping

| DB Table | Landlord Components | Tenant Components |
|----------|-------------------|-------------------|
| `user_roles` | Admin: UserRolesList, UserRoleForm | — (read own via `useUserRole` hook) |
| `properties` | PropertiesList, PropertyDetail, PropertyForm | TenantProperties (read-only) |
| `tenants` | TenantsList, TenantDetail, TenantForm | TenantProfile (edit own) |
| `lease_agreements` | LeasesList, LeaseDetail, LeaseForm | TenantLeases (read-only) |
| `billing_items` | BillingList, BillingForm | TenantBilling (read-only) |
| `payments` | PaymentsList, PaymentForm | (visible within TenantBilling) |
| `meters` | MetersList, MeterForm | TenantMeters (read-only) |
| `meter_readings` | ReadingForm, ReadingsHistory | (visible within TenantMeters) |
| `utility_bills` | (linked from BillingDetail) | (visible within TenantBilling) |
| `utility_prices` | UtilityPricesList, UtilityPriceForm | — |
| `property_expenses` | ExpensesList, ExpenseForm | — |

### DB Views ↔ Frontend Usage

| View | Used By |
|------|---------|
| `active_leases` | LandlordDashboard, TenantDashboard, TenantLeases |
| `billing_with_payments` | BillingList, TenantBilling |
| `property_occupancy` | LandlordDashboard, PropertyDetail |
| `unpaid_billing_summary` | LandlordDashboard, TenantDashboard |
| `latest_meter_readings` | MetersList, TenantMeters |
| `property_financial_summary` | LandlordDashboard, PropertyDetail |

---

## Implementation Order Summary

```
Phase 1 → Foundation (utils, hooks, shared components, layout)
  ↓
Phase 2 → Auth (login, signup, home redirect)
  ↓
Phase 3 → Landlord Core (dashboard, properties CRUD, tenants CRUD)
  ↓
Phase 4 → Landlord Financial (leases, billing, payments)
  ↓
Phase 5 → Landlord Utilities (meters, readings, prices, expenses)
  ↓
Phase 6 → Tenant Views (dashboard, read-only views, profile edit)
  ↓
Phase 7 → Admin (user role management, final verification)
```

Each phase builds on the previous one. After each phase, `npm run build` must succeed.
