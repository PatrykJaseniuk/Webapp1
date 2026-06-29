-- ================================================
-- pgTAP: TENANT HELPER FUNCTIONS
-- ================================================

BEGIN;
SELECT plan(9);

-- ── Function existence ──────────────────────────
SELECT has_function('public', 'get_current_tenant_id',
    'get_current_tenant_id() exists');
SELECT has_function('public', 'get_tenant_lease_ids',
    'get_tenant_lease_ids() exists');
SELECT has_function('public', 'get_tenant_visible_property_ids',
    'get_tenant_visible_property_ids() exists');

-- ── Return types ────────────────────────────────
SELECT function_returns('public', 'get_current_tenant_id', 'uuid',
    'get_current_tenant_id() returns uuid');
SELECT function_returns('public', 'get_tenant_lease_ids', 'uuid[]',
    'get_tenant_lease_ids() returns uuid[]');
SELECT function_returns('public', 'get_tenant_visible_property_ids', 'uuid[]',
    'get_tenant_visible_property_ids() returns uuid[]');

-- ── Security posture ────────────────────────────
-- get_current_tenant_id should be SECURITY INVOKER (not DEFINER)
SELECT is_definer('public', 'get_current_tenant_id',
    'get_current_tenant_id() is SECURITY DEFINER');

-- get_tenant_lease_ids and get_tenant_visible_property_ids are SECURITY DEFINER
-- (they need to bypass RLS on lease_agreements for tenant visibility)
SELECT is_definer('public', 'get_tenant_lease_ids',
    'get_tenant_lease_ids() is SECURITY DEFINER');
SELECT is_definer('public', 'get_tenant_visible_property_ids',
    'get_tenant_visible_property_ids() is SECURITY DEFINER');

SELECT finish();
ROLLBACK;
