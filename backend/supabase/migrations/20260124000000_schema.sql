-- ================================================
-- RENTAL MANAGEMENT SYSTEM - SCHEMA
-- ================================================
-- All table definitions for the rental management system
-- Tables are created without indexes, constraints, or triggers
-- Those are added in subsequent migration files

-- ================================================
-- ENUM TYPES
-- ================================================

-- User roles
CREATE TYPE public.app_role AS ENUM ('tenant', 'landlord', 'admin');

-- Properties
CREATE TYPE public.property_type AS ENUM ('apartment', 'house', 'commercial', 'room');
CREATE TYPE public.property_status AS ENUM ('available', 'occupied', 'inactive');

-- Tenants
CREATE TYPE public.tenant_status AS ENUM ('active', 'past', 'applicant');

-- Leases
CREATE TYPE public.lease_status AS ENUM ('active', 'expired', 'terminated');

-- Attachments
CREATE TYPE public.related_to_type AS ENUM ('property', 'tenant', 'lease', 'maintenance', 'meter_reading', 'expense');
CREATE TYPE public.file_type AS ENUM ('image', 'video', 'pdf', 'document', 'other');

-- Transactions
CREATE TYPE public.transaction_type AS ENUM ('rent', 'utility', 'expense', 'payment', 'withdraw', 'fee', 'other');
CREATE TYPE public.transaction_status AS ENUM ('pending', 'paid', 'overdue');

-- 1. USER ROLES TABLE
-- Manages user access levels: tenant, landlord, admin
CREATE TABLE public.user_roles (
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role public.app_role NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. PROPERTIES TABLE
-- Stores rental property information
CREATE TABLE public.properties (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    address text NOT NULL,
    property_type public.property_type NOT NULL,
    size_sqm decimal(10,2),
    bedrooms integer,
    monthly_rent decimal(10,2) NOT NULL,
    deposit_amount decimal(10,2) NOT NULL,
    property_status public.property_status NOT NULL ,
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
    tenant_status public.tenant_status NOT NULL DEFAULT 'active',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 4. LEASE AGREEMENTS TABLE
-- Links tenants to properties with rental terms
CREATE TABLE public.lease_agreements (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
    property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE RESTRICT,
    start_date date NOT NULL,
    end_date date,
    monthly_rent decimal(10,2) NOT NULL,
    deposit_amount decimal(10,2) NOT NULL,
    lease_status public.lease_status NOT NULL DEFAULT 'active',
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 5. ATTACHMENTS TABLE
-- Universal file storage for documents, photos, videos
CREATE TABLE public.attachments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    related_to_type public.related_to_type NOT NULL,
    related_to_id uuid NOT NULL,
    file_name text NOT NULL,
    file_url text NOT NULL,
    file_type public.file_type,
    file_size integer,
    description text,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now()
);

-- 6. TRANSACTIONS TABLE
-- all kind of finans operations (incomes, outcomes)
-- filed 'amout' can have positive, or negative value:
-- - Positive are all of this transactions that rise account balance (payment, other)
-- - Negative are transaction that lower account balance (rent, utility, expense,withdraw,fee,other)
-- Note: lease_id and property_id are nullable to allow flexible references:
-- - A transaction can reference only a lease, only a property, or both
-- - If both are set, they must be consistent (lease.property_id = transaction.property_id)
-- - Property-level expenses have only property_id (lease_id = NULL)
-- - Lease-level transactions (rent, utilities) have both lease_id and property_id
CREATE TABLE public.transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    lease_id uuid REFERENCES public.lease_agreements(id) ON DELETE RESTRICT,
    property_id uuid REFERENCES public.properties(id) ON DELETE RESTRICT,
    type public.transaction_type NOT NULL,
    description text NOT NULL,
    amount decimal(10,2) NOT NULL,
    due_date date NOT NULL,
    transaction_status public.transaction_status NOT NULL DEFAULT 'pending',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);