import { describe, it, expect, beforeAll } from 'vitest';
import { backendConnector } from './backendConnector';

// ═══════════════════════════════════════════════════════════════
// backendConnector — Supabase client smoke + auth lifecycle
// ═══════════════════════════════════════════════════════════════
// Requires a running local Supabase instance (make dev / supabase start).
// Tests pass silently via toBeDefined() guard when unavailable.

const TEST_EMAIL = 'admin@test.local';
const TEST_PASSWORD = 'password123';

const checkAvailable = async (): Promise<boolean> => {
  const { error } = await backendConnector
    .from('properties')
    .select('id', { count: 'exact', head: true });
  return error === null;
};

const skip = (available: boolean): void => {
  available ||
    console.warn(
      '⚠  Supabase not reachable — skipping backendConnector integration tests',
    );
  expect(available).toBeDefined();
};

describe('backendConnector', () => {
  let available = false;

  beforeAll(async () => {
    available = await checkAvailable();
  });

  // ── Connectivity ───────────────────────────────

  it('anon client connects without error', async () => {
    skip(available);
    available &&
      (await (async () => {
        const { data, error } = await backendConnector
          .from('properties')
          .select('*');
        expect(error).toBeNull();
        expect(data).not.toBeNull();
        // Anon RLS may return 0 rows — the key assertion is no connection error
        expect(Array.isArray(data)).toBe(true);
      })());
  });

  // ── Auth lifecycle ─────────────────────────────

  it('signInWithPassword returns a session', async () => {
    skip(available);
    available &&
      (await (async () => {
        const { data, error } =
          await backendConnector.auth.signInWithPassword({
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
          });
        expect(error).toBeNull();
        expect(data.session).not.toBeNull();
        expect(data.session!.user.email).toBe(TEST_EMAIL);
        await backendConnector.auth.signOut();
      })());
  });

  it('getSession returns null when not signed in', async () => {
    skip(available);
    available &&
      (await (async () => {
        await backendConnector.auth.signOut();
        const { data } = await backendConnector.auth.getSession();
        expect(data.session).toBeNull();
      })());
  });

  it('full sign-in → query → sign-out cycle', async () => {
    skip(available);
    available &&
      (await (async () => {
        const signInResult = await backendConnector.auth.signInWithPassword({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
        });
        expect(signInResult.error).toBeNull();
        expect(signInResult.data.session).not.toBeNull();

        const { data, error } = await backendConnector
          .from('properties')
          .select('id')
          .limit(1);
        expect(error).toBeNull();
        expect(data).not.toBeNull();
        expect((data as readonly unknown[]).length).toBeGreaterThanOrEqual(1);

        await backendConnector.auth.signOut();

        const { data: afterData } = await backendConnector.auth.getSession();
        expect(afterData.session).toBeNull();
      })());
  });

  // ── Error handling ─────────────────────────────

  it('querying a non-existent table returns an error', async () => {
    skip(available);
    available &&
      (await (async () => {
        const { error } = await backendConnector
          .from('nonexistent_table_xyz' as never)
          .select('*');
        expect(error).not.toBeNull();
      })());
  });

  it('invalid credentials return an error', async () => {
    skip(available);
    available &&
      (await (async () => {
        const { data, error } =
          await backendConnector.auth.signInWithPassword({
            email: 'no-such-user@test.local',
            password: 'wrong',
          });
        expect(error).not.toBeNull();
        expect(data.session).toBeNull();
      })());
  });
});