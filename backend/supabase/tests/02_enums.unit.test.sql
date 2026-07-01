-- ================================================
-- pgTAP: ENUM TYPES
-- ================================================

BEGIN;
SELECT plan(20);

-- ── Enum existence ──────────────────────────────
SELECT has_enum('public', 'app_role',            'app_role enum');
SELECT has_enum('public', 'property_type',       'property_type enum');
SELECT has_enum('public', 'property_status',     'property_status enum');
SELECT has_enum('public', 'tenant_status',       'tenant_status enum');
SELECT has_enum('public', 'lease_status',        'lease_status enum');
SELECT has_enum('public', 'related_to_type',     'related_to_type enum');
SELECT has_enum('public', 'file_type',           'file_type enum');
SELECT has_enum('public', 'transaction_type',    'transaction_type enum');
SELECT has_enum('public', 'transaction_status',  'transaction_status enum');

-- ── Enum values ─────────────────────────────────
SELECT enum_has_labels('public', 'app_role',
    ARRAY['tenant', 'landlord', 'admin']);
SELECT enum_has_labels('public', 'property_type',
    ARRAY['apartment', 'house', 'commercial', 'room']);
SELECT enum_has_labels('public', 'property_status',
    ARRAY['available', 'occupied', 'inactive']);
SELECT enum_has_labels('public', 'tenant_status',
    ARRAY['active', 'past', 'applicant']);
SELECT enum_has_labels('public', 'lease_status',
    ARRAY['active', 'expired', 'terminated']);
SELECT enum_has_labels('public', 'related_to_type',
    ARRAY['property', 'tenant', 'lease', 'maintenance', 'meter_reading', 'expense']);
SELECT enum_has_labels('public', 'file_type',
    ARRAY['image', 'video', 'pdf', 'document', 'other']);
SELECT enum_has_labels('public', 'transaction_type',
    ARRAY['rent', 'utility', 'expense', 'payment', 'withdraw', 'fee', 'other']);
SELECT enum_has_labels('public', 'transaction_status',
    ARRAY['pending', 'paid', 'overdue']);

SELECT results_eq(
    $$ SELECT count(*) FROM pg_enum WHERE enumtypid = 'public.app_role'::regtype $$,
    $$ VALUES (3::bigint) $$,
    'app_role has exactly 3 values'
);

SELECT results_eq(
    $$ SELECT count(*) FROM pg_enum WHERE enumtypid = 'public.transaction_type'::regtype $$,
    $$ VALUES (7::bigint) $$,
    'transaction_type has exactly 7 values'
);

SELECT finish();
ROLLBACK;
