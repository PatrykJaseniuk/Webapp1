-- ================================================
-- pgTAP EXTENSION SETUP
-- ================================================
-- Enable pgTAP for database unit testing.
-- Must be run once before any test files.
-- Safe to run in migrations (idempotent: IF NOT EXISTS).

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA public;
