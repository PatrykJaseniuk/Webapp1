-- ================================================
-- pgTAP: SCHEMA — Tables & Core Columns (Part 1/2)
-- ================================================

BEGIN;
SELECT plan(40);

-- ── Tables ───────────────────────────────────────
SELECT has_table('public', 'user_role',       'table user_roles exists');
SELECT has_table('public', 'property',       'table properties exists');
SELECT has_table('public', 'tenant',          'table tenants exists');
SELECT has_table('public', 'lease_agreement', 'table lease_agreements exists');
SELECT has_table('public', 'attachment',      'table attachments exists');
SELECT has_table('public', 'treasury',        'table treasuries exists');
SELECT has_table('public', 'financial_entry', 'table financial_entries exists');

-- ── user_roles ──────────────────────────────────
SELECT has_column('public', 'user_role', 'user_id',    'user_roles.user_id');
SELECT has_column('public', 'user_role', 'role',       'user_roles.role');
SELECT has_column('public', 'user_role', 'created_at', 'user_roles.created_at');
SELECT has_column('public', 'user_role', 'updated_at', 'user_roles.updated_at');
SELECT col_is_pk('public', 'user_role', 'user_id',    'user_roles PK');
SELECT col_type_is('public', 'user_role', 'role', 'public.app_role',
    'user_roles.role type');

-- ── properties ──────────────────────────────────
SELECT has_column('public', 'property', 'id',              'properties.id');
SELECT has_column('public', 'property', 'name',            'properties.name');
SELECT has_column('public', 'property', 'address',         'properties.address');
SELECT has_column('public', 'property', 'property_type',   'properties.property_type');
SELECT has_column('public', 'property', 'size_sqm',        'properties.size_sqm');
SELECT has_column('public', 'property', 'bedrooms',        'properties.bedrooms');
SELECT has_column('public', 'property', 'monthly_rent',    'properties.monthly_rent');
SELECT has_column('public', 'property', 'deposit_amount',  'properties.deposit_amount');
SELECT has_column('public', 'property', 'property_status', 'properties.property_status');
SELECT has_column('public', 'property', 'notes',           'properties.notes');
SELECT has_column('public', 'property', 'created_at',      'properties.created_at');
SELECT has_column('public', 'property', 'updated_at',      'properties.updated_at');
SELECT has_column('public', 'property', 'created_by',      'properties.created_by');
SELECT col_is_pk('public', 'property', 'id',               'properties PK');
SELECT col_type_is('public', 'property', 'property_type', 'public.property_type',
    'properties.property_type type');
SELECT col_type_is('public', 'property', 'property_status', 'public.property_status',
    'properties.property_status type');

-- ── tenants ─────────────────────────────────────
SELECT has_column('public', 'tenant', 'id',            'tenants.id');
SELECT has_column('public', 'tenant', 'user_id',       'tenants.user_id');
SELECT has_column('public', 'tenant', 'first_name',    'tenants.first_name');
SELECT has_column('public', 'tenant', 'last_name',     'tenants.last_name');
SELECT has_column('public', 'tenant', 'email',         'tenants.email');
SELECT has_column('public', 'tenant', 'phone',         'tenants.phone');
SELECT has_column('public', 'tenant', 'tenant_status', 'tenants.tenant_status');
SELECT has_column('public', 'tenant', 'created_at',    'tenants.created_at');
SELECT has_column('public', 'tenant', 'updated_at',    'tenants.updated_at');
SELECT col_is_pk('public', 'tenant', 'id',             'tenants PK');
SELECT col_type_is('public', 'tenant', 'tenant_status', 'public.tenant_status',
    'tenants.tenant_status type');

SELECT finish();
ROLLBACK;
