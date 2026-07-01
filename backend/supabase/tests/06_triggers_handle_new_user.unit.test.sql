-- ================================================
-- pgTAP: TRIGGERS — handle_new_user (auto-assign tenant role)
-- ================================================
-- Verify the trigger exists. The trigger fires on
-- auth.users INSERT — tested via function existence
-- and trigger registration check.

BEGIN;
SELECT plan(3);

SELECT has_function('public', 'handle_new_user',
    'handle_new_user() function exists');

SELECT has_trigger('auth', 'users',
    'on_auth_user_created', 'on_auth_user_created trigger exists');

-- Verify the function has correct return type
SELECT function_returns('public', 'handle_new_user', 'trigger',
    'handle_new_user() returns trigger');

SELECT finish();
ROLLBACK;
