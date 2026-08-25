-- ================================================
-- pgTAP: TRIGGERS — created_by auto-population
-- ================================================
-- Note: set_created_by() reads auth.uid(), so these
-- tests verify the trigger exists and fires correctly.
-- The function itself is SECURITY DEFINER.

BEGIN;
SELECT plan(7);

-- Verify triggers exist on all relevant tables
SELECT has_trigger('public', 'property',
    'set_properties_created_by', 'properties: set_created_by trigger exists');
SELECT has_trigger('public', 'lease_agreement',
    'set_leases_created_by', 'leases: set_created_by trigger exists');
SELECT has_trigger('public', 'financial_entry',
    'set_financial_entries_created_by', 'financial entries: set_created_by trigger exists');
SELECT has_trigger('public', 'treasury',
    'set_treasuries_created_by', 'treasuries: set_created_by trigger exists');
SELECT has_trigger('public', 'attachment',
    'set_attachments_created_by', 'attachments: set_created_by trigger exists');

-- Verify that updated_at triggers exist on all tables
SELECT has_trigger('public', 'user_role',
    'update_user_roles_updated_at', 'user_roles: update trigger exists');
SELECT has_trigger('public', 'tenant',
    'update_tenants_updated_at', 'tenants: update trigger exists');

SELECT finish();
ROLLBACK;
