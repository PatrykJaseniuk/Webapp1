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
CREATE TYPE public.related_to_type AS ENUM ('property', 'tenant', 'lease', 'maintenance', 'meter_reading', 'expense', 'financial_entry');
CREATE TYPE public.file_type AS ENUM ('image', 'video', 'pdf', 'document', 'other');



-- 1. USER ROLES TABLE
-- Manages user access levels: tenant, landlord, admin
CREATE TABLE public.user_role (
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role public.app_role NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. PROPERTIES TABLE
-- Stores rental property information
CREATE TABLE public.property (
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
CREATE TABLE public.tenant (
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
CREATE TABLE public.lease_agreement (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES public.tenant(id) ON DELETE RESTRICT,
    property_id uuid NOT NULL REFERENCES public.property(id) ON DELETE RESTRICT,
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
CREATE TABLE public.attachment (
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

-- 6. TREASURIES TABLE
-- Cash accounts (bank accounts, cash boxes) through which money physically moves.
-- One treasury may be shared across many properties and lease agreements.
CREATE TABLE public.treasury (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 7. FINANCIAL ENTRIES TABLE
-- A pure signed ledger of financial entries.
--
-- POSTING RULE (normative):
--   The same signed 'amount' is posted to EVERY referenced account.
--   The sign is taken from the landlord's point of view:
--     +  value in  (inflow / credit to that account)
--     -  value out (outflow / charge against that account)
--
-- References specify the accounts to which the entry is allocated.
-- At least one reference must be set; combinations are meaningful:
--   - lease_id                -> tenant/lease-scoped accrual (charge / credit)
--   - property_id             -> landlord/property-scoped result (income / expense)
--   - treasury_id             -> cash movement (inflow / outflow)
--   - lease + treasury        -> tenant cash movement that is not income
--   - lease + property + treasury -> rent payment / refund (cash AND income)
--   - property + treasury     -> property expense / income paid in cash
--   - property only           -> reclassification onto the property without cash
--
-- Consequences of the rule:
--   lease account    = accrual receivable ledger (negative = tenant owes)
--   property account = property result (cash movements + reclassifications)
--   treasury account = cash on hand (reconcilable against a bank statement)
--
-- There is deliberately NO 'type', 'category' or 'status' column: the accounting
-- kind is derived from (references, sign) and the paid/overdue state is derived
-- from the running balance with FIFO allocation over 'value_date'.
--
-- 'value_date' is the economic date of the entry on the accounts it references:
--   charge            -> the date it becomes payable (its due date)
--   payment / refund  -> the date the money actually moved
--   expense / income  -> the date of the cash flow
-- Distinct from 'created_at', which records when the row was written.
CREATE TABLE public.financial_entry (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    lease_id uuid REFERENCES public.lease_agreement(id) ON DELETE RESTRICT,
    property_id uuid REFERENCES public.property(id) ON DELETE RESTRICT,
    treasury_id uuid REFERENCES public.treasury(id) ON DELETE RESTRICT,
    description text NOT NULL,
    amount decimal(10,2) NOT NULL,
    value_date date NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ================================================
-- LEASE DEPOSIT (contract term only)
-- ================================================
-- lease_agreement.deposit_amount records the deposit agreed in the contract.
-- It is informational ONLY: the system does not track deposit receipt,
-- retention or return, and no deposit money is represented in the ledger.
--
-- Deposit settlement tracking was deliberately removed. If it is ever
-- reintroduced, model it as its own table whose columns REFERENCE real
-- financial_entry rows, rather than as amount columns on lease_agreement:
-- copied amounts cannot be forced to agree with the ledger and will drift,
-- which is the same defect as a stored paid/overdue flag.
