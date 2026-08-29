-- ================================================
-- RENTAL MANAGEMENT SYSTEM - SEED DATA (PART 2)
-- ================================================
-- Part 2: Tenants, Leases, Transactions, and Attachments
-- This file is split to keep migration files under 400 lines

-- ================================================
-- SECTION 5: TENANTS
-- ================================================
-- Tenant profiles with contact information

INSERT INTO public.tenant (id, user_id, first_name, last_name, email, phone, id_document_number, emergency_contact_name, emergency_contact_phone, notes, tenant_status, created_at, updated_at) VALUES
    -- Tenant 1: Jan Kowalski (active, Warsaw apartment)
    ('b0000000-0000-0000-0000-000000000001', 
     '00000000-0000-0000-0000-000000000010', 
     'Jan', 
     'Kowalski', 
     'jan.kowalski@test.local', 
     '+48 600 100 200', 
     'ABC123456', 
     'Maria Kowalska', 
     '+48 600 100 300', 
     'Reliable tenant. Always pays on time. Works as software developer.', 
      'active', 
      '2025-05-15 10:00:00+00', 
      '2025-06-01 10:00:00+00'),
    
    -- Tenant 2: Anna Nowak (active, Kraków apartment)
    ('b0000000-0000-0000-0000-000000000002', 
     '00000000-0000-0000-0000-000000000011', 
     'Anna', 
     'Nowak', 
     'anna.nowak@test.local', 
     '+48 601 200 300', 
     'DEF789012', 
     'Piotr Nowak', 
     '+48 601 200 400', 
     'Graduate student at Jagiellonian University. Quiet and responsible.', 
      'active', 
      '2025-02-20 14:30:00+00', 
      '2025-03-01 14:30:00+00'),
    
    -- Tenant 3: Piotr Wiśniewski (active, Gdańsk house)
    ('b0000000-0000-0000-0000-000000000003', 
     '00000000-0000-0000-0000-000000000012', 
     'Piotr', 
     'Wiśniewski', 
     'piotr.wisniewski@test.local', 
     '+48 602 300 400', 
     'GHI345678', 
     'Katarzyna Wiśniewska', 
     '+48 602 300 500', 
     'Family of 4. Two children. Father works at port authority.', 
      'active', 
      '2023-12-01 09:00:00+00', 
      '2024-01-01 09:00:00+00'),
    
    -- Tenant 4: Maria Lewandowska (past, was in Łódź apartment)
    ('b0000000-0000-0000-0000-000000000004', 
     '00000000-0000-0000-0000-000000000013', 
     'Maria', 
     'Lewandowska', 
     'maria.lewandowska@test.local', 
     '+48 603 400 500', 
     'JKL901234', 
     'Tomasz Lewandowski', 
     '+48 603 400 600', 
     'Previous tenant. Left on good terms. Relocated for work.', 
      'past', 
      '2023-11-15 11:00:00+00', 
      '2025-01-01 11:00:00+00'),
    
    -- Tenant 5: Tomasz Zieliński (applicant)
    ('b0000000-0000-0000-0000-000000000005', 
     '00000000-0000-0000-0000-000000000014', 
     'Tomasz', 
     'Zieliński', 
     'tomasz.zielinski@test.local', 
     '+48 604 500 600', 
     'MNO567890', 
     'Ewa Zielińska', 
     '+48 604 500 700', 
     'Applicant interested in Wrocław room. Student at Wrocław University.', 
      'applicant', 
      '2026-01-10 16:00:00+00', 
      '2026-01-10 16:00:00+00');


-- ================================================
-- SECTION 6: LEASE AGREEMENTS
-- ================================================
-- Active and historical lease agreements

INSERT INTO public.lease_agreement (id, tenant_id, property_id, start_date, end_date, monthly_rent, deposit_amount, lease_status, notes, created_at, updated_at, created_by) VALUES
    -- Lease 1: Jan Kowalski - Warsaw apartment (active)
    ('c0000000-0000-0000-0000-000000000001', 
     'b0000000-0000-0000-0000-000000000001', 
     'a0000000-0000-0000-0000-000000000001', 
     '2025-06-01', 
     '2026-05-31', 
     3500.00, 
     3500.00, 
      'active', 
      '12-month lease. Standard terms. Pet-friendly.', 
      '2025-05-20 10:00:00+00', 
      '2025-06-01 10:00:00+00', 
      '00000000-0000-0000-0000-000000000002'),
    
    -- Lease 2: Anna Nowak - Kraków apartment (active, ending soon)
    ('c0000000-0000-0000-0000-000000000002', 
     'b0000000-0000-0000-0000-000000000002', 
     'a0000000-0000-0000-0000-000000000002', 
     '2025-03-01', 
     '2026-02-28', 
     4200.00, 
     4200.00, 
      'active', 
      '12-month lease. Tenant considering renewal.', 
      '2025-02-25 14:00:00+00', 
      '2025-03-01 14:00:00+00', 
      '00000000-0000-0000-0000-000000000002'),
    
    -- Lease 3: Piotr Wiśniewski - Gdańsk house (active, long-term)
    ('c0000000-0000-0000-0000-000000000003', 
     'b0000000-0000-0000-0000-000000000003', 
     'a0000000-0000-0000-0000-000000000003', 
     '2024-01-01', 
     '2026-12-31', 
     6500.00, 
     6500.00, 
      'active', 
      '3-year lease. Family with children. Garden maintenance included.', 
      '2023-12-15 09:00:00+00', 
      '2024-01-01 09:00:00+00', 
      '00000000-0000-0000-0000-000000000002'),
    
    -- Lease 4: Maria Lewandowska - Łódź apartment (expired)
    ('c0000000-0000-0000-0000-000000000004', 
     'b0000000-0000-0000-0000-000000000004', 
     'a0000000-0000-0000-0000-000000000006', 
     '2024-01-01', 
     '2024-12-31', 
     2800.00, 
     2800.00, 
      'expired', 
      '12-month lease completed. Tenant relocated to Berlin for work.', 
      '2023-12-20 11:00:00+00', 
      '2025-01-01 11:00:00+00', 
      '00000000-0000-0000-0000-000000000002');


-- ================================================
-- SECTION 7: TREASURIES
-- ================================================
-- Cash accounts through which money physically moves.
-- One treasury is shared across all properties and leases.

INSERT INTO public.treasury (id, name, is_active, created_at, updated_at, created_by) VALUES
    ('f0000000-0000-0000-0000-000000000001',
     'Konto bankowe PKO',
     true,
     '2023-01-01 08:00:00+00',
     '2023-01-01 08:00:00+00',
     '00000000-0000-0000-0000-000000000002'),

    ('f0000000-0000-0000-0000-000000000002',
     'Kasa gotowkowa',
     true,
     '2023-01-01 08:00:00+00',
     '2023-01-01 08:00:00+00',
     '00000000-0000-0000-0000-000000000002');


-- ================================================
-- SECTION 8: FINANCIAL ENTRIES
-- ================================================
-- A signed ledger. The same signed amount is posted to every referenced
-- account; + = value in, - = value out (landlord's point of view).
--
-- Every lease cash movement is paired with an accrual leg, so a fully settled
-- lease account nets to zero:
--   charge   lease only                     -> receivable created
--   payment  lease + property + treasury    -> settles it, income, cash in
--
-- ===== LEASE 1: Warsaw Apartment (Jan Kowalski) - FULLY SETTLED =====

INSERT INTO public.financial_entry (id, lease_id, property_id, treasury_id, description, amount, value_date, created_at, updated_at, created_by) VALUES
    -- Rent June 2025: charged, then paid
    ('d0000000-0000-0000-0000-000000000003',
     'c0000000-0000-0000-0000-000000000001', NULL, NULL,
     'Monthly rent - June 2025 - charged', -3500.00, '2025-06-01',
     '2025-06-01 09:00:00+00', '2025-06-01 09:00:00+00', '00000000-0000-0000-0000-000000000002'),

    ('d0000000-0000-0000-0000-000000000004',
     'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001',
     'Monthly rent - June 2025 - paid', 3500.00, '2025-06-05',
     '2025-06-05 09:00:00+00', '2025-06-05 09:00:00+00', '00000000-0000-0000-0000-000000000002'),

    -- Rent July 2025
    ('d0000000-0000-0000-0000-000000000005',
     'c0000000-0000-0000-0000-000000000001', NULL, NULL,
     'Monthly rent - July 2025 - charged', -3500.00, '2025-07-01',
     '2025-07-01 09:00:00+00', '2025-07-01 09:00:00+00', '00000000-0000-0000-0000-000000000002'),

    ('d0000000-0000-0000-0000-000000000006',
     'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001',
     'Monthly rent - July 2025 - paid', 3500.00, '2025-07-03',
     '2025-07-03 09:00:00+00', '2025-07-03 09:00:00+00', '00000000-0000-0000-0000-000000000002'),

    -- Rent August 2025
    ('d0000000-0000-0000-0000-000000000007',
     'c0000000-0000-0000-0000-000000000001', NULL, NULL,
     'Monthly rent - August 2025 - charged', -3500.00, '2025-08-01',
     '2025-08-01 09:00:00+00', '2025-08-01 09:00:00+00', '00000000-0000-0000-0000-000000000002'),

    ('d0000000-0000-0000-0000-000000000008',
     'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001',
     'Monthly rent - August 2025 - paid', 3500.00, '2025-08-04',
     '2025-08-04 09:00:00+00', '2025-08-04 09:00:00+00', '00000000-0000-0000-0000-000000000002'),

    -- Rent September 2025
    ('d0000000-0000-0000-0000-000000000009',
     'c0000000-0000-0000-0000-000000000001', NULL, NULL,
     'Monthly rent - September 2025 - charged', -3500.00, '2025-09-01',
     '2025-09-01 09:00:00+00', '2025-09-01 09:00:00+00', '00000000-0000-0000-0000-000000000002'),

    ('d0000000-0000-0000-0000-000000000010',
     'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001',
     'Monthly rent - September 2025 - paid', 3500.00, '2025-09-02',
     '2025-09-02 09:00:00+00', '2025-09-02 09:00:00+00', '00000000-0000-0000-0000-000000000002'),

    -- Utilities June 2025: charged, then paid
    ('d0000000-0000-0000-0000-000000000011',
     'c0000000-0000-0000-0000-000000000001', NULL, NULL,
     'Electricity - June 2025 - charged', -112.50, '2025-07-10',
     '2025-07-10 10:00:00+00', '2025-07-10 10:00:00+00', '00000000-0000-0000-0000-000000000002'),

    ('d0000000-0000-0000-0000-000000000012',
     'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001',
     'Electricity - June 2025 - paid', 112.50, '2025-07-12',
     '2025-07-12 10:00:00+00', '2025-07-12 10:00:00+00', '00000000-0000-0000-0000-000000000002'),

    ('d0000000-0000-0000-0000-000000000013',
     'c0000000-0000-0000-0000-000000000001', NULL, NULL,
     'Water - June 2025 - charged', -45.00, '2025-07-10',
     '2025-07-10 10:00:00+00', '2025-07-10 10:00:00+00', '00000000-0000-0000-0000-000000000002'),

    ('d0000000-0000-0000-0000-000000000014',
     'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001',
     'Water - June 2025 - paid', 45.00, '2025-07-12',
     '2025-07-12 10:00:00+00', '2025-07-12 10:00:00+00', '00000000-0000-0000-0000-000000000002');
