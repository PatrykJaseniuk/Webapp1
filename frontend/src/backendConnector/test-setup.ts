// ══════════════════════════════════════════════════════════════
// backendConnector TEST SETUP — auth helpers + seed UUIDs
// ══════════════════════════════════════════════════════════════
// Creates fresh Supabase clients per role for RLS tests.
// Uses the same env vars as backendConnector (VITE_*).
//
// Requires local Supabase running on 127.0.0.1:54321.
// Run `make dev` in another terminal or supabase start first.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// ── Test credentials (matching seed data) ───────
const TEST_CREDENTIALS = {
  admin: { email: 'admin@test.local', password: 'password123' },
  landlord: { email: 'landlord@test.local', password: 'password123' },
  tenant1: { email: 'jan.kowalski@test.local', password: 'password123' },
  tenant2: { email: 'anna.nowak@test.local', password: 'password123' },
  tenant3: {
    email: 'piotr.wisniewski@test.local',
    password: 'password123',
  },
} as const;

// ── Seed UUIDs ──────────────────────────────────
export const TEST_UUIDS = {
  admin: '00000000-0000-0000-0000-000000000001',
  landlord: '00000000-0000-0000-0000-000000000002',
  tenant1: '00000000-0000-0000-0000-000000000010',
  tenant2: '00000000-0000-0000-0000-000000000011',
  tenant3: '00000000-0000-0000-0000-000000000012',

  property1: 'a0000000-0000-0000-0000-000000000001',
  property2: 'a0000000-0000-0000-0000-000000000002',
  property3: 'a0000000-0000-0000-0000-000000000003',
  property4: 'a0000000-0000-0000-0000-000000000004',
  property5: 'a0000000-0000-0000-0000-000000000005',

  tenant1Profile: 'b0000000-0000-0000-0000-000000000001',
  tenant2Profile: 'b0000000-0000-0000-0000-000000000002',
  tenant3Profile: 'b0000000-0000-0000-0000-000000000003',

  lease1: 'c0000000-0000-0000-0000-000000000001',
  lease2: 'c0000000-0000-0000-0000-000000000002',
  lease3: 'c0000000-0000-0000-0000-000000000003',

  attachment1: 'aad00000-0000-0000-0000-000000000001',

  financialEntry1: 'd0000000-0000-0000-0000-000000000003',

  treasuryBank: 'f0000000-0000-0000-0000-000000000001',
  treasuryCash: 'f0000000-0000-0000-0000-000000000002',
} as const;

// ── Client factory ──────────────────────────────
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const createAnonClient = (): SupabaseClient =>
  createClient(supabaseUrl, supabaseAnonKey);

// ── Auth helpers ────────────────────────────────

type RoleName = 'admin' | 'landlord' | 'tenant1' | 'tenant2' | 'tenant3';

export const signInAs = async (role: RoleName): Promise<SupabaseClient> => {
  const client = createAnonClient();
  const creds = TEST_CREDENTIALS[role];
  const { data, error } = await client.auth.signInWithPassword(creds);

  const condition = error !== null || data.session === null;
  condition &&
    (() => {
      throw new Error(
        `signInAs(${role}) failed: ${error?.message ?? 'no session'}`,
      );
    })();

  return client;
};

export const signOut = async (client: SupabaseClient): Promise<void> => {
  await client.auth.signOut();
};

export { createAnonClient };
export type { SupabaseClient, RoleName };

export const checkAvailable = async (): Promise<boolean> => {
  const client = createAnonClient();
  const { error } = await client
    .from('property')
    .select('id', { count: 'exact', head: true });
  return error === null;
};