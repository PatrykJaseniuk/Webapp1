# Migration Files Update Plan

## Overview

The schema.sql file has been updated with the following structural changes:

### Active Tables (6)
1. `user_roles` - User access levels
2. `properties` - Rental property information
3. `tenants` - Tenant contact and personal information
4. `lease_agreements` - Links tenants to properties
5. `attachments` - Universal file storage
6. `transactions` - All financial operations (NEW - consolidates multiple tables)

### Removed/Commented Out Tables (7)
- `billing_items` - implicitly removed (not in new schema)
- `payments` - commented out
- `meters` - commented out
- `meter_readings` - commented out
- `utility_bills` - commented out
- `utility_prices` - commented out
- `property_expenses` - commented out

## Summary of Changes by File

### 1. Schema.sql Update

**Action**: Comment out the `utility_bills` table (lines 140-155)

The utility_bills table references billing_items which no longer exists, so it needs to be commented out.

---

### 2. Indexes.sql (20260124000100_indexes.sql)

**Remove the following indexes:**

| Table | Indexes to Remove |
|-------|-------------------|
| billing_items | `idx_billing_items_lease_id`, `idx_billing_items_status`, `idx_billing_items_due_date`, `idx_billing_items_type`, `idx_billing_items_created_by`, `idx_billing_unpaid` |
| payments | `idx_payments_billing_item_id`, `idx_payments_date`, `idx_payments_method`, `idx_payments_created_by` |
| meters | `idx_meters_property_id`, `idx_meters_type`, `idx_meters_active` |
| meter_readings | `idx_meter_readings_meter_id`, `idx_meter_readings_date`, `idx_meter_readings_created_by` |
| utility_bills | `idx_utility_bills_lease_id`, `idx_utility_bills_meter_id`, `idx_utility_bills_billing_item_id`, `idx_utility_bills_start_reading`, `idx_utility_bills_end_reading`, `idx_utility_bills_period` |
| utility_prices | `idx_utility_prices_type`, `idx_utility_prices_date`, `idx_utility_prices_type_date` |
| property_expenses | `idx_expenses_property_id`, `idx_expenses_type`, `idx_expenses_date`, `idx_expenses_created_by` |

**Add the following indexes for transactions table:**

```sql
-- TRANSACTIONS INDEXES
CREATE INDEX idx_transactions_lease_id ON public.transactions(lease_id);
CREATE INDEX idx_transactions_property_id ON public.transactions(property_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_due_date ON public.transactions(due_date);
CREATE INDEX idx_transactions_type ON public.transactions(type);
CREATE INDEX idx_transactions_created_by ON public.transactions(created_by);
-- Composite index for unpaid/overdue transactions
CREATE INDEX idx_transactions_unpaid ON public.transactions(status, due_date) 
    WHERE status IN ('pending', 'overdue');
```

---

### 3. Constraints.sql (20260124000200_constraints.sql)

**Remove the following constraints:**

| Table | Constraints to Remove |
|-------|----------------------|
| billing_items | `check_billing_due_date` |
| payments | `check_positive_payment`, `check_payment_date` |
| meters | `unique_meter_per_property` |
| meter_readings | `check_positive_reading`, `check_reading_date` |
| utility_bills | `check_positive_consumption`, `check_positive_unit_price`, `check_total_calculation`, `check_billing_period` |
| utility_prices | `check_positive_price`, `check_effective_date` |
| property_expenses | `check_positive_expense`, `check_expense_date` |

**Add the following constraints for transactions table:**

```sql
-- TRANSACTIONS CONSTRAINTS
-- Ensure at least one reference is set
ALTER TABLE public.transactions 
    ADD CONSTRAINT check_transaction_reference 
    CHECK (lease_id IS NOT NULL OR property_id IS NOT NULL);

-- Ensure lease-property consistency when both are set
-- If both lease_id and property_id are set, the lease must belong to that property
ALTER TABLE public.transactions 
    ADD CONSTRAINT check_lease_property_consistency 
    CHECK (
        lease_id IS NULL 
        OR property_id IS NULL 
        OR property_id = (SELECT property_id FROM public.lease_agreements WHERE id = lease_id)
    );

-- Ensure due date is not in the far past (sanity check)
ALTER TABLE public.transactions 
    ADD CONSTRAINT check_transaction_due_date 
    CHECK (due_date >= '2020-01-01'::date);
```

---

### 4. Functions & Triggers.sql (20260124000300_functions_triggers.sql)

**Remove the following triggers:**

| Table | Triggers to Remove |
|-------|-------------------|
| billing_items | `update_billing_items_updated_at`, `set_billing_items_created_by` |
| payments | `update_payments_updated_at`, `set_payments_created_by` |
| meters | `update_meters_updated_at` |
| utility_prices | `update_utility_prices_updated_at` |
| property_expenses | `update_expenses_updated_at`, `set_expenses_created_by` |

**Add the following triggers for transactions table:**

```sql
-- TRANSACTIONS TRIGGERS
CREATE TRIGGER update_transactions_updated_at 
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_transactions_created_by 
    BEFORE INSERT ON public.transactions
    FOR EACH ROW 
    WHEN (NEW.created_by IS NULL)
    EXECUTE FUNCTION public.set_created_by();
```

---

### 5. Security.sql (20260124000400_security.sql)

**Remove RLS for the following tables:**
- `billing_items`
- `payments`
- `meters`
- `meter_readings`
- `utility_bills`
- `utility_prices`
- `property_expenses`

**Add RLS for transactions table:**

```sql
-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- SELECT policy
CREATE POLICY "Authenticated users can read transactions"
    ON public.transactions
    FOR SELECT
    TO authenticated
    USING (
        -- Landlords see all transactions
        is_landlord()
        OR
        -- Tenants see transactions related to their leases
        (lease_id IN (
            SELECT id FROM public.lease_agreements 
            WHERE tenant_id = get_current_tenant_id()
        ))
        OR
        -- Tenants see property-level transactions for their leased properties
        (lease_id IS NULL AND property_id IN (
            SELECT property_id FROM public.lease_agreements 
            WHERE tenant_id = get_current_tenant_id() 
            AND status = 'active'
        ))
    );

-- INSERT policy
CREATE POLICY "Landlords can insert transactions"
    ON public.transactions
    FOR INSERT
    TO authenticated
    WITH CHECK (is_landlord());

-- UPDATE policy
CREATE POLICY "Landlords can update transactions"
    ON public.transactions
    FOR UPDATE
    TO authenticated
    USING (is_landlord())
    WITH CHECK (is_landlord());

-- DELETE policy
CREATE POLICY "Landlords can delete transactions"
    ON public.transactions
    FOR DELETE
    TO authenticated
    USING (is_landlord());
```

---

### 6. Views.sql (20260124000500_views.sql)

**Remove the following views:**

| View | Reason |
|------|--------|
| `billing_with_payments` | References billing_items and payments tables |
| `latest_meter_readings` | References meters and meter_readings tables |

**Update the following views:**

| View | Action |
|------|--------|
| `unpaid_billing_summary` | Replace with `unpaid_transactions_summary` using transactions table |
| `property_financial_summary` | Update to use transactions table |

**New/Updated Views:**

```sql
-- VIEW: UNPAID TRANSACTIONS SUMMARY
-- Shows unpaid and overdue transactions per lease
CREATE VIEW public.unpaid_transactions_summary 
WITH (security_invoker = true) AS
SELECT 
    la.id as lease_id,
    la.tenant_id,
    la.property_id,
    t.first_name || ' ' || t.last_name as tenant_name,
    p.name as property_name,
    COUNT(tr.id) as unpaid_items_count,
    SUM(tr.amount) as total_unpaid_amount,
    MIN(tr.due_date) as earliest_due_date,
    COUNT(CASE WHEN tr.status = 'overdue' THEN 1 END) as overdue_items_count,
    SUM(CASE WHEN tr.status = 'overdue' THEN tr.amount ELSE 0 END) as total_overdue_amount
FROM public.lease_agreements la
JOIN public.tenants t ON la.tenant_id = t.id
JOIN public.properties p ON la.property_id = p.id
LEFT JOIN public.transactions tr ON la.id = tr.lease_id AND tr.status IN ('pending', 'overdue')
WHERE la.status = 'active'
GROUP BY la.id, la.tenant_id, la.property_id, t.first_name, t.last_name, p.name;

-- VIEW: PROPERTY FINANCIAL SUMMARY
-- Shows income and expenses per property using transactions
CREATE VIEW public.property_financial_summary 
WITH (security_invoker = true) AS
SELECT 
    p.id as property_id,
    p.name as property_name,
    p.address,
    -- Income from rent, utilities, deposits, payments (must be paid)
    COALESCE(SUM(CASE WHEN tr.type IN ('rent', 'utility', 'deposit', 'payment') AND tr.status = 'paid' THEN tr.amount ELSE 0 END), 0) as total_income,
    -- Expenses (property-level or lease-level)
    COALESCE(SUM(CASE WHEN tr.type IN ('expense', 'withdraw', 'fee') THEN tr.amount ELSE 0 END), 0) as total_expenses,
    -- Net profit/loss
    COALESCE(SUM(CASE WHEN tr.type IN ('rent', 'utility', 'deposit', 'payment') AND tr.status = 'paid' THEN tr.amount ELSE 0 END), 0) - 
    COALESCE(SUM(CASE WHEN tr.type IN ('expense', 'withdraw', 'fee') THEN tr.amount ELSE 0 END), 0) as net_profit,
    -- Current lease status
    p.status,
    p.monthly_rent
FROM public.properties p
LEFT JOIN public.transactions tr ON p.id = tr.property_id
GROUP BY p.id;
```

**Keep the following views unchanged:**
- `active_leases` - No references to removed tables
- `property_occupancy` - No references to removed tables

---

### 7. Seed Data.sql (20260124000700_seed_data.sql)

**Remove seed data for:**
- `billing_items` table
- `payments` table
- `meters` table
- `meter_readings` table
- `utility_bills` table
- `utility_prices` table
- `property_expenses` table

**Add seed data for transactions table:**

The transactions table should contain data that was previously split across billing_items, payments, and property_expenses. Key mappings:

| Old Table | New transactions.type | Reference Pattern |
|-----------|----------------------|-------------------|
| billing_items (rent) | 'rent' | Both lease_id and property_id |
| billing_items (utility) | 'utility' | Both lease_id and property_id |
| billing_items (deposit) | 'deposit' | Both lease_id and property_id |
| payments | 'payment' | Both lease_id and property_id |
| property_expenses | 'expense' | Only property_id (lease_id = NULL) |

Sample structure:
```sql
INSERT INTO public.transactions (id, lease_id, property_id, type, description, amount, due_date, status, created_at, updated_at, created_by) VALUES
    -- Rent transactions (linked to both lease and property)
    ('tr-uuid-1', 'lease-uuid-1', 'property-uuid-1', 'rent', 'Monthly rent - June 2025', 3500.00, '2025-06-01', 'paid', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00', 'landlord-uuid'),
    -- Utility transactions (linked to both lease and property)
    ('tr-uuid-2', 'lease-uuid-1', 'property-uuid-1', 'utility', 'Electricity - June 2025', 112.50, '2025-07-10', 'paid', '2025-07-10 10:00:00+00', '2025-07-10 10:00:00+00', 'landlord-uuid'),
    -- Deposit transactions (linked to both lease and property)
    ('tr-uuid-3', 'lease-uuid-1', 'property-uuid-1', 'deposit', 'Security deposit', 3500.00, '2025-06-01', 'paid', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00', 'landlord-uuid'),
    -- Property-level expense (only property_id, no lease)
    ('tr-uuid-4', NULL, 'property-uuid-1', 'expense', 'Maintenance - plumbing repair', 250.00, '2025-06-15', 'paid', '2025-06-15 14:00:00+00', '2025-06-15 14:00:00+00', 'landlord-uuid'),
    -- Property tax (only property_id, no lease)
    ('tr-uuid-5', NULL, 'property-uuid-2', 'expense', 'Annual property tax', 1200.00, '2025-01-15', 'paid', '2025-01-15 09:00:00+00', '2025-01-15 09:00:00+00', 'landlord-uuid');
```

---

## Execution Order

1. Update `indexes.sql` - Remove old indexes, add transactions indexes
2. Update `constraints.sql` - Remove old constraints, add transactions constraints
3. Update `functions_triggers.sql` - Remove old triggers, add transactions triggers
4. Update `security.sql` - Remove old RLS policies, add transactions RLS
5. Update `views.sql` - Remove/update views for transactions
6. Update `seed_data.sql` - Replace old seed data with transactions data

## Important Notes

### Transactions Table Reference Logic
The `transactions` table should be modified to allow flexible references:
- A transaction can reference **only a lease**, **only a property**, or **both**
- If both are referenced, they must be consistent (lease.property_id = transaction.property_id)

**Schema changes needed:**
```sql
-- 6. TRANSACTIONS TABLE
-- all kind of finans operations (incomes, outcomes) 
CREATE TABLE public.transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    lease_id uuid REFERENCES public.lease_agreements(id) ON DELETE CASCADE,
    property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('rent', 'utility', 'deposit', 'expense','payment','withdraw', 'fee', 'other')),
    description text NOT NULL,
    amount decimal(10,2) NOT NULL,
    due_date date NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
```

**All constraints for transactions (in constraints.sql):**
```sql
-- TRANSACTIONS CONSTRAINTS
-- Ensure at least one reference is set
ALTER TABLE public.transactions 
    ADD CONSTRAINT check_transaction_reference 
    CHECK (lease_id IS NOT NULL OR property_id IS NOT NULL);

-- Ensure lease-property consistency when both are set
ALTER TABLE public.transactions 
    ADD CONSTRAINT check_lease_property_consistency 
    CHECK (
        lease_id IS NULL 
        OR property_id IS NULL 
        OR property_id = (SELECT property_id FROM public.lease_agreements WHERE id = lease_id)
    );

-- Ensure due date is not in the far past (sanity check)
ALTER TABLE public.transactions 
    ADD CONSTRAINT check_transaction_due_date 
    CHECK (due_date >= '2020-01-01'::date);
```

### Active Tables Summary
After all changes, the database will have 6 active tables:
1. `user_roles` - User access levels
2. `properties` - Rental property information
3. `tenants` - Tenant contact and personal information
4. `lease_agreements` - Links tenants to properties
5. `attachments` - Universal file storage
6. `transactions` - All financial operations

### Removed Tables Summary
7 tables are being removed/commented out:
- `billing_items`
- `payments`
- `meters`
- `meter_readings`
- `utility_bills`
- `utility_prices`
- `property_expenses`
