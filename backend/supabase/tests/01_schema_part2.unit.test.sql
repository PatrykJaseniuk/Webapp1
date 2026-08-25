-- ================================================
-- pgTAP: SCHEMA — Lease/Attach/Transaction Columns (Part 2/2)
-- ================================================

BEGIN;
SELECT plan(38);

-- ── lease_agreements ────────────────────────────
SELECT has_column('public', 'lease_agreements', 'id',               'leases.id');
SELECT has_column('public', 'lease_agreements', 'tenant_id',        'leases.tenant_id');
SELECT has_column('public', 'lease_agreements', 'property_id',      'leases.property_id');
SELECT has_column('public', 'lease_agreements', 'start_date',       'leases.start_date');
SELECT has_column('public', 'lease_agreements', 'end_date',         'leases.end_date');
SELECT has_column('public', 'lease_agreements', 'monthly_rent',     'leases.monthly_rent');
SELECT has_column('public', 'lease_agreements', 'deposit_amount',   'leases.deposit_amount');
SELECT has_column('public', 'lease_agreements', 'lease_status',     'leases.lease_status');
SELECT has_column('public', 'lease_agreements', 'notes',            'leases.notes');
SELECT has_column('public', 'lease_agreements', 'created_at',       'leases.created_at');
SELECT has_column('public', 'lease_agreements', 'updated_at',       'leases.updated_at');
SELECT has_column('public', 'lease_agreements', 'created_by',       'leases.created_by');
SELECT col_is_pk('public', 'lease_agreements', 'id',                'leases PK');
SELECT col_type_is('public', 'lease_agreements', 'lease_status', 'public.lease_status',
    'leases.lease_status type');
SELECT col_type_is('public', 'lease_agreements', 'start_date', 'date', 'leases.start_date date');

-- ── attachments ─────────────────────────────────
SELECT has_column('public', 'attachments', 'id',              'attachments.id');
SELECT has_column('public', 'attachments', 'related_to_type', 'attachments.related_to_type');
SELECT has_column('public', 'attachments', 'related_to_id',   'attachments.related_to_id');
SELECT has_column('public', 'attachments', 'file_name',       'attachments.file_name');
SELECT has_column('public', 'attachments', 'file_url',        'attachments.file_url');
SELECT has_column('public', 'attachments', 'file_type',       'attachments.file_type');
SELECT has_column('public', 'attachments', 'file_size',       'attachments.file_size');
SELECT has_column('public', 'attachments', 'description',     'attachments.description');
SELECT has_column('public', 'attachments', 'created_by',      'attachments.created_by');
SELECT has_column('public', 'attachments', 'created_at',      'attachments.created_at');
SELECT col_is_pk('public', 'attachments', 'id',               'attachments PK');
SELECT col_type_is('public', 'attachments', 'related_to_type', 'public.related_to_type',
    'attachments.related_to_type type');
SELECT col_type_is('public', 'attachments', 'file_type', 'public.file_type',
    'attachments.file_type type');

-- ── transactions ────────────────────────────────
SELECT has_column('public', 'transactions', 'id',                 'transactions.id');
SELECT has_column('public', 'transactions', 'lease_id',           'transactions.lease_id');
SELECT has_column('public', 'transactions', 'property_id',        'transactions.property_id');
SELECT has_column('public', 'transactions', 'description',        'transactions.description');
SELECT has_column('public', 'transactions', 'amount',             'transactions.amount');
SELECT has_column('public', 'transactions', 'due_date',           'transactions.due_date');
SELECT has_column('public', 'transactions', 'created_at',         'transactions.created_at');
SELECT has_column('public', 'transactions', 'updated_at',         'transactions.updated_at');
SELECT has_column('public', 'transactions', 'created_by',         'transactions.created_by');
SELECT col_is_pk('public', 'transactions', 'id',                  'transactions PK');

SELECT finish();
ROLLBACK;
