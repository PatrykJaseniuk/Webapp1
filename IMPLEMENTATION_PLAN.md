# Rental Management App - Implementation Plan

## 🎯 Overview
- **Frontend**: Next.js 16 + React 19 (Client-only, SSG, GitHub Pages)
- **Backend**: Supabase (PostgreSQL + RLS + Auth)
- **Architecture**: RBAC with 3 roles (Admin, Landlord, Tenant)
- **Style Guide**: Follow FRONTEND_STYLE_GUIDE.md (arrow functions, ternary, useAsync, CSS Modules)

---

## 🛡️ RBAC Structure

| Role | Routes | Data Access |
|------|--------|-------------|
| **Admin** | `/admin/*` | All users, system settings |
| **Landlord** | `/landlord/*` | Own properties, tenants, leases (created_by = auth.uid()) |
| **Tenant** | `/tenant/*` | Own leases only (where tenant_id = user.id) |

---

## 🌐 Route Structure (Shortened)

### PUBLIC
```
/login                   Login form
/signup                  Signup with role selection (email, password, role)
/access-denied          403 page
```

### ADMIN (/admin)
```
/admin/dashboard         Users count, roles stats, recent signups
/admin/users            User list, search, filter by role
/admin/users/[id]       User details, change role, delete
/admin/settings         Utility prices, system settings
```

### LANDLORD (/landlord)
```
/landlord/dashboard     Property count, active leases, pending payments, revenue
/landlord/properties                List, search, filter, pagination
/landlord/properties/new            Create form
/landlord/properties/[id]           Details, edit link
/landlord/properties/[id]/edit      Edit form
/landlord/tenants                   List, search, filter
/landlord/tenants/new               Create form
/landlord/tenants/[id]              Details, lease history
/landlord/tenants/[id]/edit         Edit form
/landlord/leases                    List, search, filter, status badges
/landlord/leases/new                Create form (tenant selector, property selector)
/landlord/leases/[id]               Details, billing items, utilities, docs
/landlord/leases/[id]/edit          Edit form
/landlord/billing                   Billing items list, status, paid amount progress
/landlord/billing/new               Create billing item
/landlord/billing/[id]              Details, payment history
/landlord/billing/[id]/payment      Record payment form
/landlord/utilities                 Meters list, last reading, status
/landlord/utilities/new             Add meter form
/landlord/utilities/[id]            Meter details, readings history
/landlord/utilities/[id]/reading    Record reading form
```

### TENANT (/tenant)
```
/tenant/dashboard       Current lease, pending payments, recent payments, balance
/tenant/leases/[id]     Lease details (view-only), property info, landlord contact
/tenant/payments        Billing items list, status, payment schedule
/tenant/payments/[id]   Billing details, payment history, receipts
/tenant/documents       Lease agreements, receipts, photos, landlord docs (download)
/tenant/profile         Account info (mostly view-only)
```

---

## 🔧 Implementation Priority

1. **Phase 1**: Auth system
   - AuthContext (sign up, sign in, sign out, role fetching)
   - Login/Signup pages
   - ProtectedRoute component
   - Root layout with role-based navigation

2. **Phase 2**: Landlord core
   - Properties CRUD
   - Tenants CRUD
   - Leases CRUD

3. **Phase 3**: Billing & Utilities
   - Billing items CRUD
   - Payments recording
   - Meters & readings

4. **Phase 4**: Admin & Tenant
   - Admin user management
   - Tenant pages (view-only access to lease/payments/docs)

5. **Phase 5**: Styling & Deployment
   - CSS Modules for all pages
   - Responsive design
   - Deploy to GitHub Pages

---

## 📋 Key Components to Create

```
contexts/AuthContext.tsx            Auth state, useAuth hook, role checking
hooks/useLocalStorage.ts            Persistent state
components/ProtectedRoute.tsx       Role-based route guard
components/Header.tsx               Role-specific navbar
components/Sidebar.tsx              Role-specific navigation
components/Button.tsx
components/FormInput.tsx             (text, email, number, date, select)
components/Card.tsx
components/Table.tsx                Generic table (reusable)
components/Modal.tsx
components/Loading.tsx
components/ErrorBanner.tsx
components/SuccessBanner.tsx
forms/LoginForm.tsx
forms/SignupForm.tsx
forms/PropertyForm.tsx              (create & edit)
forms/TenantForm.tsx
forms/LeaseForm.tsx
forms/BillingForm.tsx
forms/MeterForm.tsx
```

---

## ⚠️ Critical Rules

### Frontend (Style Guide)
- ✅ Arrow functions only
- ✅ Ternary operators (no if statements)
- ✅ const only (no let/var)
- ✅ useAsync/useAsyncFn from react-use for data fetching
- ✅ Immutable state updates
- ✅ CSS Modules (no tailwind)
- ✅ No server components / server actions
- ✅ Nullish coalescing (??) and optional chaining

### Backend (RLS)
- ✅ All tables MUST have RLS enabled
- ✅ Landlord policies: `created_by = auth.uid()`
- ✅ Tenant policies: Check if tenant_id matches user
- ✅ Admin policies: Full access via helper function
- ✅ Frontend accesses Supabase directly (no API routes)

### Data Fetching Pattern
```typescript
const state = useAsync(async () => {
  const { data, error } = await database
    .from('table_name')
    .select('*')
    .eq('field', value);
  return { data, error };
}, [dependencies]);

return (
  state.loading ? <Loading /> :
  state.error ? <ErrorBanner msg={state.error.message} /> :
  <Content data={state.value?.data ?? []} />
);
```

---

## 📂 File Structure
```
frontend/src/
├── app/
│   ├── layout.tsx              (Root + AuthProvider)
│   ├── page.tsx                (Redirect to role dashboard)
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── access-denied/page.tsx
│   ├── admin/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── users/page.tsx
│   │   ├── users/[id]/page.tsx
│   │   └── settings/page.tsx
│   ├── landlord/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── properties/page.tsx
│   │   ├── properties/new/page.tsx
│   │   ├── properties/[id]/page.tsx
│   │   ├── properties/[id]/edit/page.tsx
│   │   ├── tenants/page.tsx
│   │   ├── tenants/new/page.tsx
│   │   ├── tenants/[id]/page.tsx
│   │   ├── tenants/[id]/edit/page.tsx
│   │   ├── leases/page.tsx
│   │   ├── leases/new/page.tsx
│   │   ├── leases/[id]/page.tsx
│   │   ├── leases/[id]/edit/page.tsx
│   │   ├── billing/page.tsx
│   │   ├── billing/new/page.tsx
│   │   ├── billing/[id]/page.tsx
│   │   ├── billing/[id]/payment/page.tsx
│   │   ├── utilities/page.tsx
│   │   ├── utilities/new/page.tsx
│   │   ├── utilities/[id]/page.tsx
│   │   └── utilities/[id]/reading/page.tsx
│   └── tenant/
│       ├── layout.tsx
│       ├── dashboard/page.tsx
│       ├── leases/[id]/page.tsx
│       ├── payments/page.tsx
│       ├── payments/[id]/page.tsx
│       ├── documents/page.tsx
│       └── profile/page.tsx
├── components/
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   ├── Button.tsx
│   ├── FormInput.tsx
│   ├── Card.tsx
│   ├── Table.tsx
│   ├── Modal.tsx
│   ├── Loading.tsx
│   ├── ErrorBanner.tsx
│   ├── SuccessBanner.tsx
│   ├── ProtectedRoute.tsx
│   └── [all .module.css files]
├── contexts/
│   └── AuthContext.tsx
├── hooks/
│   └── useLocalStorage.ts
├── api/
│   ├── database.ts          (Already exists)
│   └── database.types.ts    (Already exists)
├── forms/
│   ├── LoginForm.tsx
│   ├── SignupForm.tsx
│   ├── PropertyForm.tsx
│   ├── TenantForm.tsx
│   ├── LeaseForm.tsx
│   ├── BillingForm.tsx
│   └── MeterForm.tsx
└── styles/
    └── globals.css
```

---

## 🚀 Quick Start for Another LLM

1. Start with **AuthContext** → Signup/Login pages → Root layout
2. Implement **ProtectedRoute** wrapper
3. Build **Landlord** features first (core CRUD)
4. Add **Admin** user management
5. Add **Tenant** read-only pages
6. Style everything with CSS Modules
7. Test with local Supabase + npm run dev
8. Deploy: npm run build → GitHub Pages

---

## 📞 Notes
- All environment variables must use `NEXT_PUBLIC_` prefix
- .env.local should be copied from .env.local.example
- Database migrations are already in place (check database/supabase/migrations/)
- RLS policies need to be verified/added (especially for tenant access patterns)
- No API routes - everything is client-side via Supabase SDK
