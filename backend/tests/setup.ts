// ══════════════════════════════════════════════════════════════
// BACKEND INTEGRATION TESTS — setup
// ══════════════════════════════════════════════════════════════
// Creates Supabase clients for each role, auth helpers,
// and test fixture constants matching seed data.
//
// Requires local Supabase running on 127.0.0.1:54321
// Run `make dev` in another terminal or supabase start first.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// ── Test credentials (matching seed data) ───────
const TEST_CREDENTIALS = {
  admin:    { email: 'admin@test.local',    password: 'password123' },
  landlord: { email: 'landlord@test.local', password: 'password123' },
  tenant1:  { email: 'jan.kowalski@test.local',  password: 'password123' },
  tenant2:  { email: 'anna.nowak@test.local',    password: 'password123' },
  tenant3:  { email: 'piotr.wisniewski@test.local', password: 'password123' },
} as const;

// ── Seed UUIDs ──────────────────────────────────
export const TEST_UUIDS = {
  admin:    '00000000-0000-0000-0000-000000000001',
  landlord: '00000000-0000-0000-0000-000000000002',
  tenant1:  '00000000-0000-0000-0000-000000000010',
  tenant2:  '00000000-0000-0000-0000-000000000011',
  tenant3:  '00000000-0000-0000-0000-000000000012',

  property1: 'a0000000-0000-0000-0000-000000000001', // Warsaw apt
  property2: 'a0000000-0000-0000-0000-000000000002', // Kraków apt
  property3: 'a0000000-0000-0000-0000-000000000003', // Gdańsk house
  property4: 'a0000000-0000-0000-0000-000000000004', // Łódź apt (inactive)
  property5: 'a0000000-0000-0000-0000-000000000005', // Wrocław apt

  tenant1Profile:  'b0000000-0000-0000-0000-000000000001',
  tenant2Profile:  'b0000000-0000-0000-0000-000000000002',
  tenant3Profile:  'b0000000-0000-0000-0000-000000000003',

  lease1: 'c0000000-0000-0000-0000-000000000001', // Jan → Warsaw
  lease2: 'c0000000-0000-0000-0000-000000000002', // Anna → Kraków
  lease3: 'c0000000-0000-0000-0000-000000000003', // Piotr → Gdańsk

  attachment1: 'aad00000-0000-0000-0000-000000000001', // Warsaw floor plan

  transaction1: 'd0000000-0000-0000-0000-000000000001', // Warsaw deposit
} as const;

// ── Client factory ──────────────────────────────
const supabaseUrl = process.env['SUPABASE_URL'] ?? 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env['SUPABASE_ANON_KEY'] ?? '';

const createAnonClient = (): SupabaseClient =>
  createClient(supabaseUrl, supabaseAnonKey);

// ── Auth helpers ────────────────────────────────

type RoleName = 'admin' | 'landlord' | 'tenant1' | 'tenant2' | 'tenant3';

/**
 * Sign in as a specific test user and return an authenticated client.
 * Each call creates a fresh client — no shared state.
 */
export const signInAs = async (role: RoleName): Promise<SupabaseClient> => {
  const client = createAnonClient();
  const creds = TEST_CREDENTIALS[role];
  const { data, error } = await client.auth.signInWithPassword(creds);

  if (error !== null || data.session === null) {
    throw new Error(`signInAs(${role}) failed: ${error?.message ?? 'no session'}`);
  }

  return client;
};

/** Sign out the given client. */
export const signOut = async (client: SupabaseClient): Promise<void> => {
  await client.auth.signOut();
};

// ── Re-export ───────────────────────────────────
export { createAnonClient };
export type { SupabaseClient, RoleName };
