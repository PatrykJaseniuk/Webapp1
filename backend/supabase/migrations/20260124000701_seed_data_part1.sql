-- ================================================
-- RENTAL MANAGEMENT SYSTEM - SEED DATA (PART 1)
-- ================================================
-- Comprehensive test data for the rental management system
-- Part 1: Users, Roles, and Properties
-- This file is split to keep migration files under 400 lines

-- ================================================
-- SECTION 1: TEST USER UUIDS
-- ================================================
-- Define test user UUIDs for reference
-- These are created in auth.users first, then referenced in user_roles

-- Admin user: 00000000-0000-0000-0000-000000000001
-- Landlord user: 00000000-0000-0000-0000-000000000002
-- Tenant 1 (Jan Kowalski): 00000000-0000-0000-0000-000000000010
-- Tenant 2 (Anna Nowak): 00000000-0000-0000-0000-000000000011
-- Tenant 3 (Piotr Wiśniewski): 00000000-0000-0000-0000-000000000012
-- Tenant 4 (Maria Lewandowska): 00000000-0000-0000-0000-000000000013
-- Tenant 5 (Tomasz Zieliński): 00000000-0000-0000-0000-000000000014

-- ================================================
-- SECTION 2: AUTH USERS
-- ================================================
-- Create test users in auth.users table
-- These are required for the foreign key constraint in user_roles

INSERT INTO auth.users (
    id, 
    instance_id,
    email, 
    encrypted_password,
    email_confirmed_at,
    created_at, 
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token,
    raw_app_meta_data,
    raw_user_meta_data, 
    is_super_admin,
    aud,
    role
) VALUES
    -- Admin user
    ('00000000-0000-0000-0000-000000000001',    
     '00000000-0000-0000-0000-000000000000',
     'admin@test.local', 
     crypt('password123', gen_salt('bf')),
     '2024-01-01 00:00:00+00',
     '2024-01-01 00:00:00+00', 
     '2024-01-01 00:00:00+00',
     '',
     '',
     '',
     '',
     '{"provider":"email","providers":["email"]}',
     '{"full_name":"Admin User"}',
     false,
     'authenticated',
     'authenticated'),
    
    -- Landlord user
    ('00000000-0000-0000-0000-000000000002', 
     '00000000-0000-0000-0000-000000000000',
     'landlord@test.local', 
     crypt('password123', gen_salt('bf')),
     '2024-01-01 00:00:00+00',
     '2024-01-01 00:00:00+00', 
     '2024-01-01 00:00:00+00',
     '',
     '',
     '',
     '',
     '{"provider":"email","providers":["email"]}',
     '{"full_name":"Property Owner"}',
     false,
     'authenticated',
     'authenticated'),
    
    -- Tenant 1: Jan Kowalski
    ('00000000-0000-0000-0000-000000000010', 
     '00000000-0000-0000-0000-000000000000',
     'jan.kowalski@test.local', 
     crypt('password123', gen_salt('bf')),
     '2025-05-15 00:00:00+00',
     '2025-05-15 10:00:00+00', 
     '2025-05-15 10:00:00+00',
     '',
     '',
     '',
     '',
     '{"provider":"email","providers":["email"]}',
     '{"full_name":"Jan Kowalski"}',
     false,
     'authenticated',
     'authenticated'),
    
    -- Tenant 2: Anna Nowak
    ('00000000-0000-0000-0000-000000000011', 
     '00000000-0000-0000-0000-000000000000',
     'anna.nowak@test.local', 
     crypt('password123', gen_salt('bf')),
     '2025-02-20 00:00:00+00',
     '2025-02-20 14:30:00+00', 
     '2025-02-20 14:30:00+00',
     '',
     '',
     '',
     '',
     '{"provider":"email","providers":["email"]}',
     '{"full_name":"Anna Nowak"}',
     false,
     'authenticated',
     'authenticated'),
    
    -- Tenant 3: Piotr Wiśniewski
    ('00000000-0000-0000-0000-000000000012', 
     '00000000-0000-0000-0000-000000000000',
     'piotr.wisniewski@test.local', 
     crypt('password123', gen_salt('bf')),
     '2023-12-01 00:00:00+00',
     '2023-12-01 09:00:00+00', 
     '2023-12-01 09:00:00+00',
     '',
     '',
     '',
     '',
     '{"provider":"email","providers":["email"]}',
     '{"full_name":"Piotr Wiśniewski"}',
     false,
     'authenticated',
     'authenticated'),
    
    -- Tenant 4: Maria Lewandowska
    ('00000000-0000-0000-0000-000000000013', 
     '00000000-0000-0000-0000-000000000000',
     'maria.lewandowska@test.local', 
     crypt('password123', gen_salt('bf')),
     '2023-11-15 00:00:00+00',
     '2023-11-15 11:00:00+00', 
     '2023-11-15 11:00:00+00',
     '',
     '',
     '',
     '',
     '{"provider":"email","providers":["email"]}',
     '{"full_name":"Maria Lewandowska"}',
     false,
     'authenticated',
     'authenticated'),
    
    -- Tenant 5: Tomasz Zieliński
     ('00000000-0000-0000-0000-000000000014', 
      '00000000-0000-0000-0000-000000000000',
      'tomasz.zielinski@test.local', 
      crypt('password123', gen_salt('bf')),
      '2026-01-10 00:00:00+00',
      '2026-01-10 16:00:00+00', 
      '2026-01-10 16:00:00+00',
      '',
      '',
      '',
      '',
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Tomasz Zieliński"}',
      false,
      'authenticated',
      'authenticated'),
     
    -- Placeholder user for RLS test inserts (user_id used in admin insert/update/delete tests)
    ('00000000-0000-0000-0000-000000000999', 
     '00000000-0000-0000-0000-000000000000',
     'rls-test-insert@test.local', 
     crypt('password123', gen_salt('bf')),
     '2024-01-01 00:00:00+00',
     '2024-01-01 00:00:00+00', 
     '2024-01-01 00:00:00+00',
     '',
     '',
     '',
     '',
     '{"provider":"email","providers":["email"]}',
     '{"full_name":"RLS Test Insert User"}',
     false,
     'authenticated',
     'authenticated')
ON CONFLICT (id) DO NOTHING;

-- Create identities for the users (required for Supabase Auth)
INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
) VALUES
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'admin@test.local', '{"sub":"00000000-0000-0000-0000-000000000001","email":"admin@test.local"}', 'email', '2024-01-01 00:00:00+00', '2024-01-01 00:00:00+00', '2024-01-01 00:00:00+00'),
    ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'landlord@test.local', '{"sub":"00000000-0000-0000-0000-000000000002","email":"landlord@test.local"}', 'email', '2024-01-01 00:00:00+00', '2024-01-01 00:00:00+00', '2024-01-01 00:00:00+00'),
    ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000010', 'jan.kowalski@test.local', '{"sub":"00000000-0000-0000-0000-000000000010","email":"jan.kowalski@test.local"}', 'email', '2025-05-15 10:00:00+00', '2025-05-15 10:00:00+00', '2025-05-15 10:00:00+00'),
    ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000011', 'anna.nowak@test.local', '{"sub":"00000000-0000-0000-0000-000000000011","email":"anna.nowak@test.local"}', 'email', '2025-02-20 14:30:00+00', '2025-02-20 14:30:00+00', '2025-02-20 14:30:00+00'),
    ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000012', 'piotr.wisniewski@test.local', '{"sub":"00000000-0000-0000-0000-000000000012","email":"piotr.wisniewski@test.local"}', 'email', '2023-12-01 09:00:00+00', '2023-12-01 09:00:00+00', '2023-12-01 09:00:00+00'),
    ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000013', 'maria.lewandowska@test.local', '{"sub":"00000000-0000-0000-0000-000000000013","email":"maria.lewandowska@test.local"}', 'email', '2023-11-15 11:00:00+00', '2023-11-15 11:00:00+00', '2023-11-15 11:00:00+00'),
    ('00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000014', 'tomasz.zielinski@test.local', '{"sub":"00000000-0000-0000-0000-000000000014","email":"tomasz.zielinski@test.local"}', 'email', '2026-01-10 16:00:00+00', '2026-01-10 16:00:00+00', '2026-01-10 16:00:00+00'),
    ('00000000-0000-0000-0000-000000000999', '00000000-0000-0000-0000-000000000999', 'rls-test-insert@test.local', '{"sub":"00000000-0000-0000-0000-000000000999","email":"rls-test-insert@test.local"}', 'email', '2024-01-01 00:00:00+00', '2024-01-01 00:00:00+00', '2024-01-01 00:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- ================================================
-- SECTION 3: USER ROLES
-- ================================================
-- Assign roles to test users
-- Using ON CONFLICT to handle cases where trigger already created the role

INSERT INTO public.user_role (user_id, role, created_at, updated_at) VALUES
    -- Admin user
    ('00000000-0000-0000-0000-000000000001', 'admin', '2024-01-01 00:00:00+00', '2024-01-01 00:00:00+00'),
    -- Landlord user
    ('00000000-0000-0000-0000-000000000002', 'landlord', '2024-01-01 00:00:00+00', '2024-01-01 00:00:00+00'),
    -- Tenant users
    ('00000000-0000-0000-0000-000000000010', 'tenant', '2025-05-15 10:00:00+00', '2025-05-15 10:00:00+00'),
    ('00000000-0000-0000-0000-000000000011', 'tenant', '2025-02-20 14:30:00+00', '2025-02-20 14:30:00+00'),
    ('00000000-0000-0000-0000-000000000012', 'tenant', '2023-12-01 09:00:00+00', '2023-12-01 09:00:00+00'),
    ('00000000-0000-0000-0000-000000000013', 'tenant', '2023-11-15 11:00:00+00', '2023-11-15 11:00:00+00'),
    ('00000000-0000-0000-0000-000000000014', 'tenant', '2026-01-10 16:00:00+00', '2026-01-10 16:00:00+00')
ON CONFLICT (user_id) DO UPDATE SET
    role = EXCLUDED.role,
    updated_at = EXCLUDED.updated_at;

-- ================================================
-- SECTION 4: PROPERTIES
-- ================================================
-- Rental properties across major Polish cities

INSERT INTO public.property (id, name, address, property_type, size_sqm, bedrooms, monthly_rent, deposit_amount, property_status, notes, created_at, updated_at, created_by) VALUES
    -- Property 1: Warsaw Apartment
    ('a0000000-0000-0000-0000-000000000001', 
     'Apartament Warszawa Centrum', 
     'ul. Marszałkowska 15/12, 00-001 Warszawa', 
     'apartment', 
     45.50, 
     1, 
     3500.00, 
     3500.00, 
     'occupied', 
     'Modern studio apartment in city center. Recently renovated kitchen. Good public transport access.', 
     '2024-06-01 10:00:00+00', 
     '2025-06-01 10:00:00+00', 
     '00000000-0000-0000-0000-000000000002'),
    
    -- Property 2: Kraków Apartment
    ('a0000000-0000-0000-0000-000000000002', 
     'Apartament Kraków Kazimierz', 
     'ul. Szeroka 28/3, 31-053 Kraków', 
     'apartment', 
     62.00, 
     2, 
     4200.00, 
     4200.00, 
     'occupied', 
     'Charming apartment in historic Kazimierz district. Original architectural details preserved.', 
     '2024-03-01 09:00:00+00', 
     '2025-03-01 09:00:00+00', 
     '00000000-0000-0000-0000-000000000002'),
    
    -- Property 3: Gdańsk House
    ('a0000000-0000-0000-0000-000000000003', 
     'Dom Gdańsk Wrzeszcz', 
     'ul. Partyzantów 8, 80-252 Gdańsk', 
     'house', 
     120.00, 
     4, 
     6500.00, 
     6500.00, 
     'occupied', 
     'Spacious family house with garden. Garage included. Quiet residential area near parks.', 
     '2023-12-01 11:00:00+00', 
     '2024-01-01 11:00:00+00', 
     '00000000-0000-0000-0000-000000000002'),
    
    -- Property 4: Poznań Commercial
    ('a0000000-0000-0000-0000-000000000004', 
     'Lokal Usługowy Poznań', 
     'ul. Święty Marcin 45, 61-725 Poznań', 
     'commercial', 
     85.00, 
     0, 
     8000.00, 
     8000.00, 
     'available', 
     'Prime commercial space on main street. Suitable for retail or office. High foot traffic.', 
     '2024-09-01 14:00:00+00', 
     '2025-09-01 14:00:00+00', 
     '00000000-0000-0000-0000-000000000002'),
    
    -- Property 5: Wrocław Room
    ('a0000000-0000-0000-0000-000000000005', 
     'Pokój Wrocław', 
     'ul. Piłsudskiego 120/5, 50-020 Wrocław', 
     'room', 
     18.00, 
     0, 
     1500.00, 
     1500.00, 
     'available', 
     'Single room in shared apartment. Shared kitchen and bathroom. Near university campus.', 
     '2024-11-01 16:00:00+00', 
     '2025-11-01 16:00:00+00', 
     '00000000-0000-0000-0000-000000000002'),
    
    -- Property 6: Łódź Apartment (inactive - past tenant)
    ('a0000000-0000-0000-0000-000000000006', 
     'Apartament Łódź Piotrkowska', 
     'ul. Piotrkowska 142/8, 90-430 Łódź', 
     'apartment', 
     55.00, 
     2, 
     2800.00, 
     2800.00, 
     'inactive', 
     'Apartment on famous Piotrkowska street. Currently under renovation.', 
     '2023-10-01 12:00:00+00', 
     '2025-01-15 12:00:00+00', 
     '00000000-0000-0000-0000-000000000002');
