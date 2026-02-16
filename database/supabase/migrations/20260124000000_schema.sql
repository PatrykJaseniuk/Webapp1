-- ================================================
-- RENTAL MANAGEMENT SYSTEM - SCHEMA
-- ================================================
-- All table definitions for the rental management system
-- Tables are created without indexes, constraints, or triggers
-- Those are added in subsequent migration files

-- 1. USER ROLES TABLE
-- Manages user access levels: tenant, landlord, admin
CREATE TABLE public.user_roles (
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role text NOT NULL CHECK (role IN ('tenant', 'landlord', 'admin')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. PROPERTIES TABLE
-- Stores rental property information
CREATE TABLE public.properties (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    address text NOT NULL,
    property_type text NOT NULL CHECK (property_type IN ('apartment', 'house', 'commercial', 'room')),
    size_sqm decimal(10,2),
    bedrooms integer,
    monthly_rent decimal(10,2) NOT NULL,
    deposit_amount decimal(10,2) NOT NULL,
    status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'inactive')),
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 3. TENANTS TABLE
-- Stores tenant contact and personal information
CREATE TABLE public.tenants (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    id_document_number text,
    emergency_contact_name text,
    emergency_contact_phone text,
    notes text,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past', 'applicant')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 4. LEASE AGREEMENTS TABLE
-- Links tenants to properties with rental terms
CREATE TABLE public.lease_agreements (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    start_date date NOT NULL,
    end_date date,
    monthly_rent decimal(10,2) NOT NULL,
    deposit_amount decimal(10,2) NOT NULL,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'terminated')),
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 5. ATTACHMENTS TABLE
-- Universal file storage for documents, photos, videos
CREATE TABLE public.attachments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    related_to_type text NOT NULL CHECK (related_to_type IN ('property', 'tenant', 'lease', 'maintenance', 'meter_reading', 'expense')),
    related_to_id uuid NOT NULL,
    file_name text NOT NULL,
    file_url text NOT NULL,
    file_type text CHECK (file_type IN ('image', 'video', 'pdf', 'document', 'other')),
    file_size integer,
    description text,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now()
);

-- 6. TRANSACTIONS TABLE
-- all kind of finans operations (incomes, outcomes) 
-- Note: lease_id and property_id are nullable to allow flexible references:
-- - A transaction can reference only a lease, only a property, or both
-- - If both are set, they must be consistent (lease.property_id = transaction.property_id)
-- - Property-level expenses have only property_id (lease_id = NULL)
-- - Lease-level transactions (rent, utilities) have both lease_id and property_id
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

-- -- 7. PAYMENTS TABLE
-- -- Records of payments made towards billing items
-- CREATE TABLE public.payments (
--     id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
--     billing_item_id uuid NOT NULL REFERENCES public.billing_items(id) ON DELETE CASCADE,
--     amount decimal(10,2) NOT NULL,
--     payment_date date NOT NULL,
--     payment_method text NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer', 'card', 'other')),
--     notes text,
--     created_at timestamptz DEFAULT now(),
--     updated_at timestamptz DEFAULT now(),
--     created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
-- );

-- -- 8. METERS TABLE
-- -- Utility meters attached to properties
-- CREATE TABLE public.meters (
--     id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
--     property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
--     meter_type text NOT NULL CHECK (meter_type IN ('electricity', 'water', 'gas', 'heating')),
--     meter_number text NOT NULL,
--     unit text NOT NULL CHECK (unit IN ('kwh', 'm3')),
--     active boolean DEFAULT true,
--     created_at timestamptz DEFAULT now(),
--     updated_at timestamptz DEFAULT now()
-- );

-- -- 9. METER READINGS TABLE
-- -- Historical meter reading values
-- CREATE TABLE public.meter_readings (
--     id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
--     meter_id uuid NOT NULL REFERENCES public.meters(id) ON DELETE CASCADE,
--     reading_value decimal(10,2) NOT NULL,
--     reading_date date NOT NULL,
--     notes text,
--     created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
--     created_at timestamptz DEFAULT now()
-- );

-- -- 10. UTILITY BILLS TABLE
-- -- Calculated utility bills based on meter readings
-- CREATE TABLE public.utility_bills (
--     id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
--     lease_id uuid NOT NULL REFERENCES public.lease_agreements(id) ON DELETE CASCADE,
--     meter_id uuid NOT NULL REFERENCES public.meters(id) ON DELETE CASCADE,
--     billing_item_id uuid REFERENCES public.billing_items(id) ON DELETE SET NULL,
--     start_reading_id uuid NOT NULL REFERENCES public.meter_readings(id) ON DELETE CASCADE,
--     end_reading_id uuid NOT NULL REFERENCES public.meter_readings(id) ON DELETE CASCADE,
--     consumption decimal(10,2) NOT NULL,
--     unit_price decimal(10,2) NOT NULL,
--     total_amount decimal(10,2) NOT NULL,
--     billing_period_start date NOT NULL,
--     billing_period_end date NOT NULL,
--     created_at timestamptz DEFAULT now()
-- );

-- -- 11. UTILITY PRICES TABLE
-- -- Historical utility pricing for billing calculations
-- CREATE TABLE public.utility_prices (
--     id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
--     utility_type text NOT NULL CHECK (utility_type IN ('electricity', 'water', 'gas', 'heating')),
--     price_per_unit decimal(10,4) NOT NULL,
--     effective_date date NOT NULL,
--     created_at timestamptz DEFAULT now(),
--     updated_at timestamptz DEFAULT now()
-- );

-- -- 12. PROPERTY EXPENSES TABLE
-- -- Track spending on property maintenance and operations
-- CREATE TABLE public.property_expenses (
--     id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
--     property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
--     expense_type text NOT NULL CHECK (expense_type IN ('maintenance', 'tax', 'insurance', 'renovation', 'other')),
--     description text NOT NULL,
--     amount decimal(10,2) NOT NULL,
--     expense_date date NOT NULL,
--     created_at timestamptz DEFAULT now(),
--     updated_at timestamptz DEFAULT now(),
--     created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
-- );
