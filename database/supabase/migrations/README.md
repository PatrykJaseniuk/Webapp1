# Rental Management System - Database Migrations

This directory contains the complete database schema for the Rental Management System, organized into logical groups.

## 📁 Migration Files Structure

The migrations are organized in dependency order with clear separation of concerns:

### **1. Schema** (`20260124000000_schema.sql`)
**Purpose**: All table definitions
**Contains**:
- 12 core tables: user_roles, properties, tenants, lease_agreements, attachments, billing_items, payments, meters, meter_readings, utility_bills, utility_prices, property_expenses
- Basic column definitions with data types
- Foreign key relationships
- Primary keys and basic CHECK constraints

### **2. Indexes** (`20260124000100_indexes.sql`)
**Purpose**: Performance optimization
**Contains**:
- Single-column indexes for frequent queries
- Composite indexes for complex queries
- Partial indexes for filtered queries
- ~70 indexes total

### **3. Constraints** (`20260124000200_constraints.sql`)
**Purpose**: Data validation and integrity
**Contains**:
- CHECK constraints (positive amounts, date validations)
- UNIQUE constraints (emails, meter numbers per property)
- Business rule enforcement
- ~25 constraints total

### **4. Functions & Triggers** (`20260124000300_functions_triggers.sql`)
**Purpose**: Automation and business logic
**Contains**:
- `update_updated_at_column()` - Auto-update timestamps
- `set_created_by()` - Auto-populate created_by with current user
- `auto_update_property_status()` - Sync property status with lease status
- `handle_new_user()` - Auto-assign 'tenant' role on registration
- ~20 triggers applied to tables

### **5. Security** (`20260124000400_security.sql`)
**Purpose**: Row Level Security (RLS) and access control
**Contains**:
- Enable RLS on all 12 tables
- Helper functions: `get_user_role()`, `is_admin()`, `is_landlord()`, `get_current_tenant_id()`
- ~40 RLS policies for fine-grained access control
- Landlords: Full CRUD access
- Tenants: Read-only access to their own data
- Admins: Full system access

### **6. Views** (`20260124000500_views.sql`)
**Purpose**: Computed data and common queries
**Contains**:
- `billing_with_payments` - Payment status and balances
- `active_leases` - Current leases with full details
- `property_occupancy` - Property status with tenant info
- `unpaid_billing_summary` - Outstanding payments per lease
- `latest_meter_readings` - Most recent readings per meter
- `property_financial_summary` - Income vs expenses per property

### **7. Seed Data** (`20260124000700_seed_data.sql`)
**Purpose**: Initial reference data
**Contains**:
- Utility prices (2024-2026 historical rates)
- Baseline data for system operation

## 🎯 Execution Order

Migrations are executed in timestamp order (000000 → 000700):
1. Schema (tables must exist first)
2. Indexes (optimize queries)
3. Constraints (validate data)
4. Functions & Triggers (automation)
5. Security (access control)
6. Views (computed data)
7. Seed Data (initial data)

## 🔑 Key Features

### **Auto-Population**
- `created_by` automatically set to current user
- `updated_at` automatically updated on changes
- User roles automatically assigned on registration

### **Business Logic**
- Property status auto-syncs with lease status
- Occupied when lease is active
- Available when no active leases

### **Data Validation**
- Positive amounts enforced
- Date logic validated (end_date >= start_date)
- Unique constraints prevent duplicates
- Calculation accuracy checked

### **Access Control**
- **Landlords** (`landlord` role): Full access to manage properties, tenants, leases
- **Tenants** (`tenant` role): Read-only access to their own leases, billing, payments
- **Admins** (`admin` role): Full system access including user management

## 🚀 Running Migrations

### **Local Development**
```bash
# Reset database and apply all migrations
npx supabase db reset

# Generate TypeScript types
npx supabase gen types typescript --local > ../../app/src/api/database.types.ts
```

### **Production**
Migrations are automatically applied in order by Supabase when pushed to production.

## 📊 Database Schema Overview

```
user_roles (12 rows)
├── User access levels: tenant, landlord, admin

properties (0 rows) → Created by landlord
├── Rental property information
└── Status: available, occupied, inactive

tenants (0 rows) → Created by landlord
├── Tenant contact information
└── Optional link to user account (for portal access)

lease_agreements (0 rows) → Links tenants to properties
├── Rental terms and dates
└── Auto-updates property status

attachments (0 rows) → Universal file storage
├── PDFs, images, videos
└── Linked to leases, meter readings, expenses, etc.

billing_items (0 rows) → All charges/credits
├── Rent, utilities, deposits, fees
└── Status: pending, paid, overdue

payments (0 rows) → Payment records
└── Linked to billing items

meters (0 rows) → Utility meters per property
├── Electricity, water, gas, heating
└── Each has unique meter number

meter_readings (0 rows) → Historical readings
└── Photos attached via attachments table

utility_bills (0 rows) → Calculated bills
└── Based on meter reading differences

utility_prices (12 rows) → Historical pricing
└── Seeded with 2024-2026 rates

property_expenses (0 rows) → Landlord expenses
└── Maintenance, taxes, insurance, etc.
```

## 🔧 Customization

To modify the schema:

1. **Never edit existing migration files** (they're already applied)
2. **Create new migration files** with sequential timestamps
3. **Use ALTER statements** to modify existing tables
4. **Test locally first** with `npx supabase db reset`

Example:
```sql
-- 20260124000800_add_column.sql
ALTER TABLE properties ADD COLUMN parking_spots integer DEFAULT 0;
```

## 📝 Notes

- All dates are stored as `date` type (no time component)
- All timestamps use `timestamptz` (timezone-aware)
- Money amounts stored as `decimal(10,2)` (max 99,999,999.99)
- UUIDs used for all primary keys
- Utility prices use `decimal(10,4)` for precision

## 🐛 Troubleshooting

**Error: "relation already exists"**
- Run `npx supabase db reset` to clean slate

**Error: "function does not exist"**
- Check function names match exactly (case-sensitive)
- Ensure security.sql ran before policies

**Error: "RLS policy violation"**
- Check user has correct role assigned
- Verify policy logic in security.sql

**Error: "constraint violation"**
- Check data meets constraints (positive amounts, valid dates)
- Review constraints.sql for specific rules
