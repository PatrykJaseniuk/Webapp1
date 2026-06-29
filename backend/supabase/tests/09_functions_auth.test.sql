-- ================================================
-- pgTAP: AUTH FUNCTIONS
-- ================================================

BEGIN;
SELECT plan(7);

-- ── Function existence ──────────────────────────
SELECT has_function('public', 'get_user_role',
    'get_user_role() exists');
SELECT has_function('public', 'is_admin',
    'is_admin() exists');
SELECT has_function('public', 'is_landlord',
    'is_landlord() exists');
SELECT has_function('public', 'custom_access_token_hook',
    'custom_access_token_hook() exists');

-- ── Return types ────────────────────────────────
SELECT function_returns('public', 'get_user_role', 'text',
    'get_user_role() returns text');
SELECT function_returns('public', 'is_admin', 'boolean',
    'is_admin() returns boolean');
SELECT function_returns('public', 'is_landlord', 'boolean',
    'is_landlord() returns boolean');

SELECT finish();
ROLLBACK;
