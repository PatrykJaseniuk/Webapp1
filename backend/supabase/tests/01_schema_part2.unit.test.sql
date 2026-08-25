-- ================================================
-- pgTAP: SCHEMA — Lease/Attach/Transaction Columns (Part 2/2)
-- ================================================

BEGIN;
SELECT plan(49);

-- ── lease_agreements ────────────────────────────
SELECT has_column('public', 'lease_agreement', 'id',               'leases.id');
SELECT has_column('public', 'lease_agreement', 'tenant_id',        'leases.tenant_id');
SELECT has_column('public', 'lease_agreement', 'property_id',      'leases.property_id');
SELECT has_column('public', 'lease_agreement', 'start_date',       'leases.start_date');
SELECT has_column('public', 'lease_agreement', 'end_date',         'leases.end_date');
SELECT has_column('public', 'lease_agreement', 'monthly_rent',     'leases.monthly_rent');
SELECT has_column('public', 'lease_agreement', 'deposit_amount',   'leases.deposit_amount');
SELECT has_column('public', 'lease_agreement', 'lease_status',     'leases.lease_status');
SELECT has_column('public', 'lease_agreement', 'notes',            'leases.notes');
SELECT has_column('public', 'lease_agreement', 'created_at',       'leases.created_at');
SELECT has_column('public', 'lease_agreement', 'updated_at',       'leases.updated_at');
SELECT has_column('public', 'lease_agreement', 'created_by',       'leases.created_by');
SELECT col_is_pk('public', 'lease_agreement', 'id',                'leases PK');
SELECT col_type_is('public', 'lease_agreement', 'lease_status', 'public.lease_status',
    'leases.lease_status type');
SELECT col_type_is('public', 'lease_agreement', 'start_date', 'date', 'leases.start_date date');

-- ── attachments ─────────────────────────────────
SELECT has_column('public', 'attachment', 'id',              'attachments.id');
SELECT has_column('public', 'attachment', 'related_to_type', 'attachments.related_to_type');
SELECT has_column('public', 'attachment', 'related_to_id',   'attachments.related_to_id');
SELECT has_column('public', 'attachment', 'file_name',       'attachments.file_name');
SELECT has_column('public', 'attachment', 'file_url',        'attachments.file_url');
SELECT has_column('public', 'attachment', 'file_type',       'attachments.file_type');
SELECT has_column('public', 'attachment', 'file_size',       'attachments.file_size');
SELECT has_column('public', 'attachment', 'description',     'attachments.description');
SELECT has_column('public', 'attachment', 'created_by',      'attachments.created_by');
SELECT has_column('public', 'attachment', 'created_at',      'attachments.created_at');
SELECT col_is_pk('public', 'attachment', 'id',               'attachments PK');
SELECT col_type_is('public', 'attachment', 'related_to_type', 'public.related_to_type',
    'attachments.related_to_type type');
SELECT col_type_is('public', 'attachment', 'file_type', 'public.file_type',
    'attachments.file_type type');

-- ── treasuries ──────────────────────────────────
SELECT has_column('public', 'treasury', 'id',                'treasuries.id');
SELECT has_column('public', 'treasury', 'name',              'treasuries.name');
SELECT has_column('public', 'treasury', 'is_active',         'treasuries.is_active');
SELECT has_column('public', 'treasury', 'created_at',        'treasuries.created_at');
SELECT has_column('public', 'treasury', 'updated_at',        'treasuries.updated_at');
SELECT has_column('public', 'treasury', 'created_by',        'treasuries.created_by');
SELECT col_is_pk('public', 'treasury', 'id',                 'treasuries PK');

-- ── financial_entries ───────────────────────────
SELECT has_column('public', 'financial_entry', 'id',          'financial_entries.id');
SELECT has_column('public', 'financial_entry', 'lease_id',    'financial_entries.lease_id');
SELECT has_column('public', 'financial_entry', 'property_id', 'financial_entries.property_id');
SELECT has_column('public', 'financial_entry', 'treasury_id', 'financial_entries.treasury_id');
SELECT has_column('public', 'financial_entry', 'description', 'financial_entries.description');
SELECT has_column('public', 'financial_entry', 'amount',      'financial_entries.amount');
SELECT has_column('public', 'financial_entry', 'value_date',  'financial_entries.value_date');
SELECT has_column('public', 'financial_entry', 'created_at',  'financial_entries.created_at');
SELECT has_column('public', 'financial_entry', 'updated_at',  'financial_entries.updated_at');
SELECT has_column('public', 'financial_entry', 'created_by',  'financial_entries.created_by');
SELECT col_is_pk('public', 'financial_entry', 'id',           'financial_entries PK');

-- ── lease deposit settlement columns ────────────
SELECT has_column('public', 'lease_agreement', 'deposit_entry_id', 'leases.deposit_entry_id');
SELECT has_column('public', 'lease_agreement', 'deposit_released', 'leases.deposit_released');
SELECT has_column('public', 'lease_agreement', 'deposit_retained', 'leases.deposit_retained');

SELECT finish();
ROLLBACK;
