# Migration Plan: Transaction Amount Sign Rules

## Overview
Update the database schema to enforce that transaction amounts can be positive or negative depending on the transaction type.

## Transaction Type Rules
- **Income (positive amount > 0):** `payment`, `deposit`, `other`
- **Expense (negative amount < 0):** `rent`, `utility`, `expense`, `withdraw`, `fee`

---

## Changes Required

### 1. Schema File (`20260124000000_schema.sql`)
**Current state:**
- Transaction types: `'rent', 'utility', 'expense', 'payment', 'withdraw', 'fee', 'other'`
- Missing: `'deposit'` type

**Changes needed:**
- Add `'deposit'` to the CHECK constraint for type
- Update comments to clarify the sign rules

```sql
-- Line 99: Update type CHECK constraint
type text NOT NULL CHECK (type IN ('rent', 'utility', 'expense', 'payment', 'withdraw', 'fee', 'deposit', 'other')),
```

### 2. Constraints File (`20260124000200_constraints.sql`)
**Changes needed:**
Add new CHECK constraint to enforce amount sign based on transaction type:

```sql
-- Amount sign must match transaction type
-- Income types must have positive amounts, expense types must have negative amounts
ALTER TABLE public.transactions 
    ADD CONSTRAINT check_transaction_amount_sign 
    CHECK (
        (type IN ('payment', 'deposit', 'other') AND amount > 0) OR
        (type IN ('rent', 'utility', 'expense', 'withdraw', 'fee') AND amount < 0)
    );
```

### 3. Views File (`20260124000500_views.sql`)
**Current issue:**
- `property_financial_summary` view sums amounts directly
- With negative expenses, the calculation needs to handle signs correctly

**Changes needed:**
- Update `property_financial_summary` to include 'deposit' in income types
- Update calculations to properly handle negative amounts for expenses

```sql
-- Line 93: Add 'deposit' to income types
COALESCE(SUM(CASE WHEN tr.type IN ('rent', 'utility', 'deposit', 'payment') AND tr.status = 'paid' THEN tr.amount ELSE 0 END), 0) as total_income,

-- Line 95: For expenses, use ABS() since they'll be negative
COALESCE(SUM(CASE WHEN tr.type IN ('expense', 'withdraw', 'fee') THEN ABS(tr.amount) ELSE 0 END), 0) as total_expenses,

-- Line 97-98: Net calculation stays the same since expenses are now negative
```

### 4. Seed Data Files
**Files to update:**
- `20260124000702_seed_data_part2.sql`
- `20260124000703_seed_data_part3.sql`
- `20260124000704_seed_data_part4.sql`

**Changes needed:**
Convert expense-type transactions to negative amounts:

| Type | Current | New |
|------|---------|-----|
| rent | 4200.00 | -4200.00 |
| utility | 85.20 | -85.20 |
| expense | 250.00 | -250.00 |
| withdraw | (if any) | (negative) |
| fee | (if any) | (negative) |
| payment | (if any) | (positive - unchanged) |
| deposit | (if any) | (positive - unchanged) |
| other | (if any) | (positive - unchanged) |

---

## New Migration File Recommended

Instead of modifying existing migration files, create a new migration file:

**File:** `database/supabase/migrations/20260124000600_transaction_amount_signs.sql`

```sql
-- ================================================
-- RENTAL MANAGEMENT SYSTEM - TRANSACTION AMOUNT SIGNS
-- ================================================
-- Enforce positive/negative amounts based on transaction type
-- Income types (payment, deposit, other): positive amounts
-- Expense types (rent, utility, expense, withdraw, fee): negative amounts

-- 1. Add 'deposit' to transaction type constraint (if not already present)
ALTER TABLE public.transactions 
    DROP CONSTRAINT IF EXISTS transactions_type_check,
    ADD CONSTRAINT transactions_type_check 
    CHECK (type IN ('rent', 'utility', 'expense', 'payment', 'withdraw', 'fee', 'deposit', 'other'));

-- 2. Add amount sign constraint
ALTER TABLE public.transactions 
    DROP CONSTRAINT IF EXISTS check_transaction_amount_sign,
    ADD CONSTRAINT check_transaction_amount_sign 
    CHECK (
        (type IN ('payment', 'deposit', 'other') AND amount > 0) OR
        (type IN ('rent', 'utility', 'expense', 'withdraw', 'fee') AND amount < 0)
    );

-- 3. Update existing transactions to use negative amounts for expenses
-- This is handled in seed data migration files
```

---

## Implementation Order

1. Create new migration file with constraints
2. Update seed data files to use negative amounts for expenses
3. Update views to handle the sign changes correctly

---

## Rollback Plan

If rollback is needed:
1. Remove the amount sign constraint
2. Update seed data back to positive amounts
3. Update views back to original logic
