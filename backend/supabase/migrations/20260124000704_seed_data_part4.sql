-- ================================================
-- RENTAL MANAGEMENT SYSTEM - SEED DATA (PART 4)
-- ================================================
-- Part 4: Property-level Expenses and Attachments
-- This file is split to keep migration files under 400 lines

-- ================================================
-- SECTION 7: TRANSACTIONS (CONTINUED - PROPERTY-LEVEL)
-- ================================================
-- Property-level expenses (no lease_id, only property_id)

INSERT INTO public.transactions (id, lease_id, property_id, type, description, amount, due_date, transaction_status, created_at, updated_at, created_by) VALUES
    -- ===== PROPERTY 1: Warsaw Apartment Expenses =====
    ('e0000000-0000-0000-0000-000000000001', 
     NULL, 
     'a0000000-0000-0000-0000-000000000001', 
     'expense', 
     'Maintenance - plumbing repair', 
     -250.00, 
     '2025-06-15', 
     'paid', 
     '2025-06-15 14:00:00+00', 
     '2025-06-15 14:00:00+00', 
     '00000000-0000-0000-0000-000000000002'),
    
    ('e0000000-0000-0000-0000-000000000002', 
     NULL, 
     'a0000000-0000-0000-0000-000000000001', 
     'expense', 
     'Annual property tax', 
     -1200.00, 
     '2025-03-15', 
     'paid', 
     '2025-03-15 09:00:00+00', 
     '2025-03-15 09:00:00+00', 
     '00000000-0000-0000-0000-000000000002'),
    
    -- ===== PROPERTY 2: Kraków Apartment Expenses =====
    ('e0000000-0000-0000-0000-000000000003', 
     NULL, 
     'a0000000-0000-0000-0000-000000000002', 
     'expense', 
     'Kitchen renovation', 
     -3500.00, 
     '2025-04-10', 
     'paid', 
     '2025-04-10 09:00:00+00', 
     '2025-04-10 09:00:00+00', 
     '00000000-0000-0000-0000-000000000002'),
    
    ('e0000000-0000-0000-0000-000000000004', 
     NULL, 
     'a0000000-0000-0000-0000-000000000002', 
     'expense', 
     'Annual property tax', 
     -980.00, 
     '2025-03-15', 
     'paid', 
     '2025-03-15 09:00:00+00', 
     '2025-03-15 09:00:00+00', 
     '00000000-0000-0000-0000-000000000002'),
    
    -- ===== PROPERTY 3: Gdańsk House Expenses =====
    ('e0000000-0000-0000-0000-000000000005', 
     NULL, 
     'a0000000-0000-0000-0000-000000000003', 
     'expense', 
     'Garden maintenance - annual service', 
     -800.00, 
     '2025-04-01', 
     'paid', 
     '2025-04-01 10:00:00+00', 
     '2025-04-01 10:00:00+00', 
     '00000000-0000-0000-0000-000000000002'),
    
    ('e0000000-0000-0000-0000-000000000006', 
     NULL, 
     'a0000000-0000-0000-0000-000000000003', 
     'expense', 
     'Property insurance - annual', 
     -2400.00, 
     '2025-01-10', 
     'paid', 
     '2025-01-10 09:00:00+00', 
     '2025-01-10 09:00:00+00', 
     '00000000-0000-0000-0000-000000000002'),
    
    ('e0000000-0000-0000-0000-000000000007', 
     NULL, 
     'a0000000-0000-0000-0000-000000000003', 
     'expense', 
     'Annual property tax', 
     -2100.00, 
     '2025-03-15', 
     'paid', 
     '2025-03-15 09:00:00+00', 
     '2025-03-15 09:00:00+00', 
     '00000000-0000-0000-0000-000000000002'),
    
    ('e0000000-0000-0000-0000-000000000008', 
     NULL, 
     'a0000000-0000-0000-0000-000000000003', 
     'expense', 
     'Roof repair', 
     -1500.00, 
     '2025-07-20', 
     'paid', 
     '2025-07-20 11:00:00+00', 
     '2025-07-20 11:00:00+00', 
     '00000000-0000-0000-0000-000000000002'),
    
    -- ===== PROPERTY 4: Poznań Commercial Expenses =====
    ('e0000000-0000-0000-0000-000000000009', 
     NULL, 
     'a0000000-0000-0000-0000-000000000004', 
     'expense', 
     'Building maintenance fee', 
     -500.00, 
     '2025-06-01', 
     'paid', 
     '2025-06-01 10:00:00+00', 
     '2025-06-01 10:00:00+00', 
     '00000000-0000-0000-0000-000000000002'),
    
    -- ===== PROPERTY 6: Łódź Apartment Expenses =====
    ('e0000000-0000-0000-0000-000000000010', 
     NULL, 
     'a0000000-0000-0000-0000-000000000006', 
     'expense', 
     'Renovation materials', 
     -1800.00, 
     '2025-02-01', 
     'paid', 
     '2025-02-01 14:00:00+00', 
     '2025-02-01 14:00:00+00', 
     '00000000-0000-0000-0000-000000000002'),
    
    ('e0000000-0000-0000-0000-000000000011', 
     NULL, 
     'a0000000-0000-0000-0000-000000000006', 
     'expense', 
     'Painting service', 
     -2200.00, 
     '2025-02-15', 
     'paid', 
     '2025-02-15 14:00:00+00', 
     '2025-02-15 14:00:00+00', 
     '00000000-0000-0000-0000-000000000002');

-- ================================================
-- SECTION 8: ATTACHMENTS
-- ================================================
-- Sample document and image attachments
-- Note: Only valid related_to_type values: property, tenant, lease, maintenance

INSERT INTO public.attachments (id, related_to_type, related_to_id, file_name, file_url, file_type, file_size, description, created_by, created_at) VALUES
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
