-- ================================================
-- pgTAP: SCHEMA — Tables & Core Columns (Part 1/2)
-- ================================================

BEGIN;
SELECT plan(39);

-- ── Tables ───────────────────────────────────────
SELECT has_table('public', 'user_roles',       'table user_roles exists');
SELECT has_table('public', 'properties',       'table properties exists');
SELECT has_table('public', 'tenants',          'table tenants exists');
SELECT has_table('public', 'lease_agreements', 'table lease_agreements exists');
SELECT has_table('public', 'attachments',      'table attachments exists');
SELECT has_table('public', 'transactions',     'table transactions exists');

-- ── user_roles ──────────────────────────────────
SELECT has_column('public', 'user_roles', 'user_id',    'user_roles.user_id');
SELECT has_column('public', 'user_roles', 'role',       'user_roles.role');
SELECT has_column('public', 'user_roles', 'created_at', 'user_roles.created_at');
SELECT has_column('public', 'user_roles', 'updated_at', 'user_roles.updated_at');
SELECT col_is_pk('public', 'user_roles', 'user_id',    'user_roles PK');
SELECT col_type_is('public', 'user_roles', 'role', 'public.app_role',
    'user_roles.role type');

-- ── properties ──────────────────────────────────
SELECT has_column('public', 'properties', 'id',              'properties.id');
SELECT has_column('public', 'properties', 'name',            'properties.name');
SELECT has_column('public', 'properties', 'address',         'properties.address');
SELECT has_column('public', 'properties', 'property_type',   'properties.property_type');
SELECT has_column('public', 'properties', 'size_sqm',        'properties.size_sqm');
SELECT has_column('public', 'properties', 'bedrooms',        'properties.bedrooms');
SELECT has_column('public', 'properties', 'monthly_rent',    'properties.monthly_rent');
SELECT has_column('public', 'properties', 'deposit_amount',  'properties.deposit_amount');
SELECT has_column('public', 'properties', 'property_status', 'properties.property_status');
SELECT has_column('public', 'properties', 'notes',           'properties.notes');
SELECT has_column('public', 'properties', 'created_at',      'properties.created_at');
SELECT has_column('public', 'properties', 'updated_at',      'properties.updated_at');
SELECT has_column('public', 'properties', 'created_by',      'properties.created_by');
SELECT col_is_pk('public', 'properties', 'id',               'properties PK');
SELECT col_type_is('public', 'properties', 'property_type', 'public.property_type',
    'properties.property_type type');
SELECT col_type_is('public', 'properties', 'property_status', 'public.property_status',
    'properties.property_status type');

-- ── tenants ─────────────────────────────────────
SELECT has_column('public', 'tenants', 'id',            'tenants.id');
SELECT has_column('public', 'tenants', 'user_id',       'tenants.user_id');
SELECT has_column('public', 'tenants', 'first_name',    'tenants.first_name');
SELECT has_column('public', 'tenants', 'last_name',     'tenants.last_name');
SELECT has_column('public', 'tenants', 'email',         'tenants.email');
SELECT has_column('public', 'tenants', 'phone',         'tenants.phone');
SELECT has_column('public', 'tenants', 'tenant_status', 'tenants.tenant_status');
SELECT has_column('public', 'tenants', 'created_at',    'tenants.created_at');
SELECT has_column('public', 'tenants', 'updated_at',    'tenants.updated_at');
SELECT col_is_pk('public', 'tenants', 'id',             'tenants PK');
SELECT col_type_is('public', 'tenants', 'tenant_status', 'public.tenant_status',
    'tenants.tenant_status type');

SELECT finish();
ROLLBACK;
