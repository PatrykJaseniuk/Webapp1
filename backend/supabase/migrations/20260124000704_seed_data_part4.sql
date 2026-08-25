-- ================================================
-- RENTAL MANAGEMENT SYSTEM - SEED DATA (PART 4)
-- ================================================
-- Part 4: Lease 4 closing (partial deposit release), property-level and
-- treasury-level entries, attachments, and deposit settlement.
-- This file is split to keep migration files under 400 lines

-- ================================================
-- SECTION 8: FINANCIAL ENTRIES (CONTINUED)
-- ================================================

-- ===== LEASE 4: Lodz Apartment (Maria Lewandowska) - EXPIRED, DEPOSIT PARTIALLY RELEASED =====
-- Deposit 2800.00: 2300.00 returned to the tenant, 500.00 retained and granted
-- to the property for damages. The lease account nets to zero, deposit_held
-- drops to 500.00 and deposit_outstanding to 0.00 once deposit_retained is set.

INSERT INTO public.financial_entry (id, lease_id, property_id, treasury_id, description, amount, value_date, created_at, updated_at, created_by) VALUES
    ('d0000000-0000-0000-0000-000000000300',
     'c0000000-0000-0000-0000-000000000004', NULL, NULL,
     'Security deposit - charged', -2800.00, '2024-01-01',
     '2023-12-20 11:00:00+00', '2023-12-20 11:00:00+00', '00000000-0000-0000-0000-000000000002'),

    ('d0000000-0000-0000-0000-000000000301',
     'c0000000-0000-0000-0000-000000000004', NULL, 'f0000000-0000-0000-0000-000000000001',
     'Security deposit - received', 2800.00, '2024-01-01',
     '2024-01-01 11:00:00+00', '2024-01-01 11:00:00+00', '00000000-0000-0000-0000-000000000002'),

    ('d0000000-0000-0000-0000-000000000302',
     'c0000000-0000-0000-0000-000000000004', NULL, NULL,
     'Monthly rent - January 2024 - charged', -2800.00, '2024-01-01',
     '2024-01-01 09:00:00+00', '2024-01-01 09:00:00+00', '00000000-0000-0000-0000-000000000002'),

    ('d0000000-0000-0000-0000-000000000303',
     'c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000006', 'f0000000-0000-0000-0000-000000000001',
     'Monthly rent - January 2024 - paid', 2800.00, '2024-01-04',
     '2024-01-04 09:00:00+00', '2024-01-04 09:00:00+00', '00000000-0000-0000-0000-000000000002'),

    ('d0000000-0000-0000-0000-000000000304',
     'c0000000-0000-0000-0000-000000000004', NULL, NULL,
     'Monthly rent - February 2024 - charged', -2800.00, '2024-02-01',
     '2024-02-01 09:00:00+00', '2024-02-01 09:00:00+00', '00000000-0000-0000-0000-000000000002'),

    ('d0000000-0000-0000-0000-000000000305',
     'c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000006', 'f0000000-0000-0000-0000-000000000001',
     'Monthly rent - February 2024 - paid', 2800.00, '2024-02-05',
     '2024-02-05 09:00:00+00', '2024-02-05 09:00:00+00', '00000000-0000-0000-0000-000000000002'),

    -- Deposit settlement, step 1: release the portion returned to the tenant
    ('d0000000-0000-0000-0000-000000000306',
     'c0000000-0000-0000-0000-000000000004', NULL, NULL,
     'Security deposit - released to tenant', 2300.00, '2025-01-15',
     '2025-01-15 10:00:00+00', '2025-01-15 10:00:00+00', '00000000-0000-0000-0000-000000000002'),

    -- Deposit settlement, step 2: pay that portion out
    ('d0000000-0000-0000-0000-000000000307',
     'c0000000-0000-0000-0000-000000000004', NULL, 'f0000000-0000-0000-0000-000000000001',
     'Security deposit - returned to tenant', -2300.00, '2025-01-15',
     '2025-01-15 10:00:00+00', '2025-01-15 10:00:00+00', '00000000-0000-0000-0000-000000000002'),

    -- Deposit settlement, step 3: retained portion granted to the property.
    -- Property only: the cash arrived earlier as the deposit, so no cash leg.
    ('d0000000-0000-0000-0000-000000000308',
     NULL, 'a0000000-0000-0000-0000-000000000006', NULL,
     'Security deposit - retained for damages, granted to property', 500.00, '2025-01-15',
     '2025-01-15 10:00:00+00', '2025-01-15 10:00:00+00', '00000000-0000-0000-0000-000000000002');


-- ===== PROPERTY-LEVEL ENTRIES (property + treasury: expense paid in cash) =====

INSERT INTO public.financial_entry (id, lease_id, property_id, treasury_id, description, amount, value_date, created_at, updated_at, created_by) VALUES
    ('e0000000-0000-0000-0000-000000000001', NULL, 'a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001',
     'Maintenance - plumbing repair', -250.00, '2025-06-15',
     '2025-06-15 14:00:00+00', '2025-06-15 14:00:00+00', '00000000-0000-0000-0000-000000000002'),

    ('e0000000-0000-0000-0000-000000000002', NULL, 'a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001',
     'Annual property tax', -1200.00, '2025-03-15',
     '2025-03-15 09:00:00+00', '2025-03-15 09:00:00+00', '00000000-0000-0000-0000-000000000002'),

    ('e0000000-0000-0000-0000-000000000003', NULL, 'a0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000001',
     'Kitchen renovation', -3500.00, '2025-04-10',
     '2025-04-10 09:00:00+00', '2025-04-10 09:00:00+00', '00000000-0000-0000-0000-000000000002'),

    ('e0000000-0000-0000-0000-000000000004', NULL, 'a0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000001',
     'Annual property tax', -980.00, '2025-03-15',
     '2025-03-15 09:00:00+00', '2025-03-15 09:00:00+00', '00000000-0000-0000-0000-000000000002'),

    ('e0000000-0000-0000-0000-000000000005', NULL, 'a0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000001',
     'Garden maintenance - annual service', -800.00, '2025-04-01',
     '2025-04-01 10:00:00+00', '2025-04-01 10:00:00+00', '00000000-0000-0000-0000-000000000002'),

    ('e0000000-0000-0000-0000-000000000006', NULL, 'a0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000001',
     'Property insurance - annual', -2400.00, '2025-01-10',
     '2025-01-10 09:00:00+00', '2025-01-10 09:00:00+00', '00000000-0000-0000-0000-000000000002'),

    ('e0000000-0000-0000-0000-000000000007', NULL, 'a0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000001',
     'Annual property tax', -2100.00, '2025-03-15',
     '2025-03-15 09:00:00+00', '2025-03-15 09:00:00+00', '00000000-0000-0000-0000-000000000002'),

    ('e0000000-0000-0000-0000-000000000008', NULL, 'a0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000001',
     'Roof repair', -1500.00, '2025-07-20',
     '2025-07-20 11:00:00+00', '2025-07-20 11:00:00+00', '00000000-0000-0000-0000-000000000002'),

    ('e0000000-0000-0000-0000-000000000009', NULL, 'a0000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000001',
     'Building maintenance fee', -500.00, '2025-06-01',
     '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00', '00000000-0000-0000-0000-000000000002'),

    ('e0000000-0000-0000-0000-000000000010', NULL, 'a0000000-0000-0000-0000-000000000006', 'f0000000-0000-0000-0000-000000000001',
     'Renovation after tenant moved out', -4000.00, '2025-02-01',
     '2025-02-01 09:00:00+00', '2025-02-01 09:00:00+00', '00000000-0000-0000-0000-000000000002');


-- ===== TREASURY-LEVEL ENTRIES (treasury only: no property, no lease) =====

INSERT INTO public.financial_entry (id, lease_id, property_id, treasury_id, description, amount, value_date, created_at, updated_at, created_by) VALUES
    ('e0000000-0000-0000-0000-000000000011', NULL, NULL, 'f0000000-0000-0000-0000-000000000001',
     'Bank account fees - June 2025', -45.00, '2025-06-30',
     '2025-06-30 23:00:00+00', '2025-06-30 23:00:00+00', '00000000-0000-0000-0000-000000000002'),

    -- Opening balance pattern: a treasury-only entry, no property, no lease
    ('e0000000-0000-0000-0000-000000000012', NULL, NULL, 'f0000000-0000-0000-0000-000000000002',
     'Saldo otwarcia - kasa gotowkowa', 1000.00, '2025-01-01',
     '2025-01-01 08:00:00+00', '2025-01-01 08:00:00+00', '00000000-0000-0000-0000-000000000002');


-- SECTION 8: ATTACHMENTS
-- ================================================
-- Sample document and image attachments
-- Note: Only valid related_to_type values: property, tenant, lease, maintenance

INSERT INTO public.attachment (id, related_to_type, related_to_id, file_name, file_url, file_type, file_size, description, created_by, created_at) VALUES
    -- Property attachments
    ('aad00000-0000-0000-0000-000000000001', 'property', 'a0000000-0000-0000-0000-000000000001', 'floor_plan_warsaw.pdf', '/uploads/properties/warsaw/floor_plan.pdf', 'pdf', 245000, 'Floor plan document', '00000000-0000-0000-0000-000000000002', '2024-06-01 10:00:00+00'),
    ('aad00000-0000-0000-0000-000000000002', 'property', 'a0000000-0000-0000-0000-000000000001', 'living_room.jpg', '/uploads/properties/warsaw/living_room.jpg', 'image', 1500000, 'Living room photo', '00000000-0000-0000-0000-000000000002', '2024-06-01 10:00:00+00'),
    ('aad00000-0000-0000-0000-000000000003', 'property', 'a0000000-0000-0000-0000-000000000001', 'kitchen.jpg', '/uploads/properties/warsaw/kitchen.jpg', 'image', 1800000, 'Kitchen photo', '00000000-0000-0000-0000-000000000002', '2024-06-01 10:00:00+00'),
    ('aad00000-0000-0000-0000-000000000004', 'property', 'a0000000-0000-0000-0000-000000000003', 'house_front.jpg', '/uploads/properties/gdansk/house_front.jpg', 'image', 2500000, 'Front view of house', '00000000-0000-0000-0000-000000000002', '2023-12-01 11:00:00+00'),
    ('aad00000-0000-0000-0000-000000000005', 'property', 'a0000000-0000-0000-0000-000000000003', 'garden.jpg', '/uploads/properties/gdansk/garden.jpg', 'image', 2200000, 'Garden view', '00000000-0000-0000-0000-000000000002', '2023-12-01 11:00:00+00'),
    
    -- Tenant attachments
    ('aad00000-0000-0000-0000-000000000010', 'tenant', 'b0000000-0000-0000-0000-000000000001', 'id_document.pdf', '/uploads/tenants/kowalski/id_scan.pdf', 'pdf', 500000, 'ID document scan', '00000000-0000-0000-0000-000000000002', '2025-05-15 10:00:00+00'),
    ('aad00000-0000-0000-0000-000000000011', 'tenant', 'b0000000-0000-0000-0000-000000000002', 'id_document.pdf', '/uploads/tenants/nowak/id_scan.pdf', 'pdf', 480000, 'ID document scan', '00000000-0000-0000-0000-000000000002', '2025-02-20 14:30:00+00'),
    
    -- Lease attachments
    ('aad00000-0000-0000-0000-000000000020', 'lease', 'c0000000-0000-0000-0000-000000000001', 'lease_agreement.pdf', '/uploads/leases/warsaw_001/contract.pdf', 'pdf', 750000, 'Signed lease agreement', '00000000-0000-0000-0000-000000000002', '2025-05-20 10:00:00+00'),
    ('aad00000-0000-0000-0000-000000000021', 'lease', 'c0000000-0000-0000-0000-000000000002', 'lease_agreement.pdf', '/uploads/leases/krakow_001/contract.pdf', 'pdf', 720000, 'Signed lease agreement', '00000000-0000-0000-0000-000000000002', '2025-02-25 14:00:00+00'),
    ('aad00000-0000-0000-0000-000000000022', 'lease', 'c0000000-0000-0000-0000-000000000003', 'lease_agreement.pdf', '/uploads/leases/gdansk_001/contract.pdf', 'pdf', 800000, 'Signed lease agreement', '00000000-0000-0000-0000-000000000002', '2023-12-15 09:00:00+00'),
    
    -- Maintenance attachments (property-level maintenance records)
    ('aad00000-0000-0000-0000-000000000030', 'maintenance', 'a0000000-0000-0000-0000-000000000001', 'plumbing_invoice.pdf', '/uploads/maintenance/warsaw_plumbing.pdf', 'pdf', 180000, 'Plumbing repair invoice', '00000000-0000-0000-0000-000000000002', '2025-06-15 14:00:00+00'),
    ('aad00000-0000-0000-0000-000000000031', 'maintenance', 'a0000000-0000-0000-0000-000000000003', 'roof_repair_invoice.pdf', '/uploads/maintenance/gdansk_roof.pdf', 'pdf', 250000, 'Roof repair invoice', '00000000-0000-0000-0000-000000000002', '2025-07-20 11:00:00+00');

-- ================================================
-- NOTES
-- ================================================
-- This seed data provides comprehensive test coverage for:
-- 
-- 1. User Roles: Admin, Landlord, and multiple Tenants
-- 2. Properties: Various types (apartment, house, commercial, room)
-- 3. Tenants: Active, past, and applicant statuses
-- 4. Leases: Active, expired, and ending soon scenarios
-- 5. Transactions: Rent, utilities, deposits, and property expenses
-- 6. Attachments: Various document and image types
--
-- Test User Credentials (for Supabase Auth):
-- Admin: admin@test.local
-- Landlord: landlord@test.local
-- Tenants: jan.kowalski@test.local, anna.nowak@test.local, etc.
--
-- Note: Actual auth.users records need to be created through
-- Supabase Auth before the user_roles references will work.
-- The UUIDs used here are placeholders for testing purposes.

-- ================================================
-- SECTION 9: ATTACHMENT ON A FINANCIAL ENTRY
-- ================================================
-- An invoice attached directly to the money row it documents.

INSERT INTO public.attachment (id, related_to_type, related_to_id, file_name, file_url, file_type, file_size, description, created_by, created_at) VALUES
    ('aad00000-0000-0000-0000-000000000040', 'financial_entry', 'e0000000-0000-0000-0000-000000000001', 'plumbing_invoice_fv.pdf', '/uploads/entries/warsaw_plumbing_fv.pdf', 'pdf', 180000, 'Invoice for the plumbing repair entry', '00000000-0000-0000-0000-000000000002', '2025-06-15 14:00:00+00');


-- ================================================
-- SECTION 10: DEPOSIT SETTLEMENT
-- ================================================
-- Link each lease to its deposit charge so a deposit charge can be told apart
-- from a rent charge (both are lease-only negative entries).

UPDATE public.lease_agreement SET deposit_entry_id = 'd0000000-0000-0000-0000-000000000001'
    WHERE id = 'c0000000-0000-0000-0000-000000000001';
UPDATE public.lease_agreement SET deposit_entry_id = 'd0000000-0000-0000-0000-000000000100'
    WHERE id = 'c0000000-0000-0000-0000-000000000002';
UPDATE public.lease_agreement SET deposit_entry_id = 'd0000000-0000-0000-0000-000000000200'
    WHERE id = 'c0000000-0000-0000-0000-000000000003';

-- Lease 4 is settled: 2300.00 returned to the tenant + 500.00 retained = 2800.00 charged.
-- The check_deposit_settlement constraint enforces that these add up to deposit_amount.
UPDATE public.lease_agreement
    SET deposit_entry_id = 'd0000000-0000-0000-0000-000000000300',
        deposit_released = 2300.00,
        deposit_retained = 500.00
    WHERE id = 'c0000000-0000-0000-0000-000000000004';
