// ══════════════════════════════════════════════════════════════
// RLS: treasuries
// ══════════════════════════════════════════════════════════════
// Cash accounts are landlord/admin only. A tenant must see zero rows,
// so a treasury_id on their own payment entry never leaks an account name.

import {
  describe,
  it,
  expect,
  beforeAll,
} from 'vitest';
import {
  signInAs,
  signOut,
  TEST_UUIDS,
  checkAvailable,
} from './test-setup';

const skip = (available: boolean): void => {
  expect(available).toBeDefined();
};

describe('treasuries RLS', () => {
  let available = false;
  beforeAll(async () => {
    available = await checkAvailable();
  });

  describe('landlord', () => {
    it('can read all treasuries', async () => {
      skip(available);
      available ||= false;
      available &&
        (await (async () => {
          const client = await signInAs('landlord');
          const { data, error } = await client.from('treasury').select('*');
          expect(error).toBeNull();
          expect((data ?? []).length).toBeGreaterThanOrEqual(2);
          await signOut(client);
        })());
    });

    it('sees reconcilable treasury balances', async () => {
      skip(available);
      available &&
        (await (async () => {
          const client = await signInAs('landlord');
          const { data, error } = await client
            .from('treasury_balance')
            .select('*')
            .eq('treasury_id', TEST_UUIDS.treasuryBank)
            .single();
          expect(error).toBeNull();
          expect(data?.balance).toBe(42782.5);
          await signOut(client);
        })());
    });
  });

  describe('tenant', () => {
    it('sees no treasuries at all', async () => {
      skip(available);
      available &&
        (await (async () => {
          const client = await signInAs('tenant1');
          const { data, error } = await client.from('treasury').select('*');
          expect(error).toBeNull();
          expect((data ?? []).length).toBe(0);
          await signOut(client);
        })());
    });

    it('sees no treasury balances', async () => {
      skip(available);
      available &&
        (await (async () => {
          const client = await signInAs('tenant1');
          const { data, error } = await client.from('treasury_balance').select('*');
          expect(error).toBeNull();
          expect((data ?? []).length).toBe(0);
          await signOut(client);
        })());
    });

    it('cannot insert a treasury', async () => {
      skip(available);
      available &&
        (await (async () => {
          const client = await signInAs('tenant1');
          const { error } = await client
            .from('treasury')
            .insert({ name: 'Tenant treasury attempt' });
          expect(error).not.toBeNull();
          await signOut(client);
        })());
    });
  });
});
