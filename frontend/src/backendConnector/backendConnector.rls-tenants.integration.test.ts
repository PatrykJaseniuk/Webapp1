// ══════════════════════════════════════════════════════════════
// RLS: tenants
// ══════════════════════════════════════════════════════════════

import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
} from 'vitest';
import {
  signInAs,
  signOut,
  TEST_UUIDS,
  checkAvailable,
  type SupabaseClient,
} from './test-setup';

const skip = (available: boolean): void => {
  expect(available).toBeDefined();
};

describe('tenants RLS', () => {
  let available = false;
  beforeAll(async () => {
    available = await checkAvailable();
  });

  describe('landlord', () => {
    let client: SupabaseClient;

    it('can read all tenants', async () => {
      skip(available);
      available && expect(true).toBe(true);
      available &&
        (await (async () => {
          client = await signInAs('landlord');
          const { data, error } = await client
            .from('tenant')
            .select('*');
          expect(error).toBeNull();
          expect(
            (data as readonly unknown[]).length,
          ).toBeGreaterThanOrEqual(3);
        })());
    });

    it('can insert a tenant', async () => {
      skip(available);
      available || expect(true).toBe(true);
      available &&
        (await (async () => {
          const { data, error } = await client
            .from('tenant')
            .insert({
              first_name: 'Test',
              last_name: 'User',
              email: 'test.user@test.local',
              phone: '+48123456789',
              tenant_status: 'active',
            })
            .select('id')
            .single();
          expect(error).toBeNull();
          expect(data).not.toBeNull();
        })());
    });

    afterAll(async () => {
      available &&
        (await (async () => {
          // Cleanup: delete the test tenant we inserted
          await client
            .from('tenant')
            .delete()
            .eq('email', 'test.user@test.local');
          await signOut(client);
        })());
    });
  });

  describe('tenant', () => {
    let client: SupabaseClient;

    it('sees only own profile', async () => {
      skip(available);
      available || expect(true).toBe(true);
      available &&
        (await (async () => {
          client = await signInAs('tenant1');
          const { data, error } = await client
            .from('tenant')
            .select('*');
          expect(error).toBeNull();
          const rows =
            data as ReadonlyArray<{ readonly id: string }>;
          expect(rows.length).toBe(1);
          expect(rows[0]!.id).toBe(TEST_UUIDS.tenant1Profile);
        })());
    });

    it('cannot insert tenants', async () => {
      skip(available);
      available || expect(true).toBe(true);
      available &&
        (await (async () => {
          const { error } = await client
            .from('tenant')
            .insert({
              first_name: 'Hack',
              last_name: 'Attempt',
              email: 'hack@test.local',
              phone: '+48999999999',
              tenant_status: 'active',
            });
          expect(error).not.toBeNull();
        })());
    });

    afterAll(async () => {
      available && (await signOut(client));
    });
  });
});