# Seed Data Implementation Plan

## Current State Analysis

### Migration Files Status

| File | Lines | Status | Action Needed |
|------|-------|--------|---------------|
| `20260124000000_schema.sql` | 185 | ✅ Complete | None |
| `20260124000100_indexes.sql` | 45 | ✅ Complete | None |
| `20260124000200_constraints.sql` | 60 | ✅ Complete | None |
| `20260124000300_functions_triggers.sql` | 173 | ✅ Complete | None |
| `20260124000400_security.sql` | 356 | ✅ Complete | None |
| `20260124000500_views.sql` | 104 | ✅ Complete | None |
| `20260124000700_seed_data.sql` | 511 | ❌ Needs Update | Split + Add transactions |

### Current seed_data.sql Structure

The file contains these sections:
- Section 1: Test User UUIDs (comments only)
- Section 2: Auth Users (INSERT into auth.users and auth.identities)
- Section 3: User Roles (INSERT into public.user_roles)
- Section 4: Properties (INSERT into public.properties)
- Section 5: Tenants (INSERT into public.tenants)
- Section 6: Lease Agreements (INSERT into public.lease_agreements)
- Section 13: Attachments (INSERT into public.attachments)

**Missing:** Section 7-12 were for old tables that are now removed/commented out
**Missing:** Transactions seed data

## Implementation Plan

### Step 1: Split seed_data.sql into Parts

Since the current file is 511 lines and adding transactions will make it larger, split into:

1. **`20260124000700_seed_data_part1.sql`** (~250 lines)
   - Section 1: Test User UUIDs
   - Section 2: Auth Users
   - Section 3: User Roles
   - Section 4: Properties

2. **`20260124000701_seed_data_part2.sql`** (~250 lines)
   - Section 5: Tenants
   - Section 6: Lease Agreements
   - Section 7: Transactions (NEW)
   - Section 8: Attachments

### Step 2: Add Transactions Seed Data

Based on the plan in `migration_update_plan.md`, add transactions that map from old tables:

| Transaction Type | Source | Reference Pattern |
|------------------|--------|-------------------|
| `rent` | billing_items (rent) | Both lease_id and property_id |
| `utility` | billing_items (utility) | Both lease_id and property_id |
| `deposit` | billing_items (deposit) | Both lease_id and property_id |
| `payment` | payments | Both lease_id and property_id |
| `expense` | property_expenses | Only property_id (lease_id = NULL) |

### Sample Transactions to Add

```sql
-- Section 7: Transactions
INSERT INTO public.transactions (id, lease_id, property_id, type, description, amount, due_date, status, created_at, updated_at, created_by) VALUES
    -- Rent transactions for Lease 1 (Jan Kowalski - Warsaw)
    ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'rent', 'Monthly rent - June 2025', 3500.00, '2025-06-01', 'paid', '2025-06-01 10:00:00+00', '2025-06-05 10:00:00+00', '00000000-0000-0000-0000-000000000002'),
    ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'rent', 'Monthly rent - July 2025', 3500.00, '2025-07-01', 'paid', '2025-07-01 10:00:00+00', '2025-07-03 10:00:00+00', '00000000-0000-0000-0000-000000000002'),
    -- ... more rent payments
    
    -- Deposit transactions
    ('d0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'deposit', 'Security deposit', 3500.00, '2025-06-01', 'paid', '2025-05-20 10:00:00+00', '2025-05-20 10:00:00+00', '00000000-0000-0000-0000-000000000002'),
    
    -- Utility transactions
    ('d0000000-0000-0000-0000-000000000020', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'utility', 'Electricity - June 2025', 150.00, '2025-07-10', 'paid', '2025-07-10 10:00:00+00', '2025-07-10 10:00:00+00', '00000000-0000-0000-0000-000000000002'),
    
    -- Property-level expenses (no lease_id)
    ('d0000000-0000-0000-0000-000000000030', NULL, 'a0000000-0000-0000-0000-000000000001', 'expense', 'Maintenance - plumbing repair', 250.00, '2025-06-15', 'paid', '2025-06-15 14:00:00+00', '2025-06-15 14:00:00+00', '00000000-0000-0000-0000-000000000002'),
    
    -- Pending/overdue transactions for testing
    ('d0000000-0000-0000-0000-000000000040', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'rent', 'Monthly rent - February 2026', 3500.00, '2026-02-01', 'pending', '2026-02-01 10:00:00+00', '2026-02-01 10:00:00+00', '00000000-0000-0000-0000-000000000002');
```

### Step 3: Update Attachments Section

Remove references to old tables:
- Remove `meter_reading` related attachments (IDs: aad00000-...000030, 000031)
- Remove `expense` related attachments (IDs: aad00000-...000040, 000041)

Or update them to reference transactions instead.

### Step 4: Update Notes Section

Update the notes at the end of the file to reflect the new schema:
- Remove references to meters, meter_readings, billing_items, payments, utility_bills, property_expenses
- Add reference to transactions

## File Size Estimates After Changes

| File | Estimated Lines |
|------|-----------------|
| `20260124000700_seed_data_part1.sql` | ~250 |
| `20260124000701_seed_data_part2.sql` | ~350 |

Both files will be under the 400-line limit.

## Execution Order

1. Create `20260124000700_seed_data_part1.sql` with Sections 1-4
2. Create `20260124000701_seed_data_part2.sql` with Sections 5-8 (including new transactions)
3. Delete the original `20260124000700_seed_data.sql`
4. Verify all migration files are under 400 lines
