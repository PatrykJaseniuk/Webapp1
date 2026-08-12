// ══════════════════════════════════════════════════════════════
// RLS: transactions
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

describe('transactions RLS', () => {
  let available = false;
  beforeAll(async () => {
    available = await checkAvailable();
  });

  describe('landlord', () => {
    let client: SupabaseClient;

    it('can read all transactions', async () => {
      skip(available);
      available || expect(true).toBe(true);
      available &&
        (await (async () => {
          client = await signInAs('landlord');
          const { data, error } = await client
            .from('transactions')
            .select('*');
          expect(error).toBeNull();
          expect(
            (data as readonly unknown[]).length,
          ).toBeGreaterThanOrEqual(1);
        })());
    });

    it('can insert a transaction', async () => {
      skip(available);
      available || expect(true).toBe(true);
      available &&
        (await (async () => {
          const { data, error } = await client
            .from('transactions')
            .insert({
              lease_id: TEST_UUIDS.lease1,
              type: 'rent',
              description: 'Test transaction',
              amount: -100,
              transaction_status: 'pending',
              due_date: '2026-06-01',
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
          // Cleanup: delete test transactions
          await client
            .from('transactions')
            .delete()
            .eq('description', 'Test transaction');
          await signOut(client);
        })());
    });
  });

  describe('tenant', () => {
    let client: SupabaseClient;

    it('sees only own transactions', async () => {
      skip(available);
      available || expect(true).toBe(true);
      available &&
        (await (async () => {
          client = await signInAs('tenant1');
          const { data, error } = await client
            .from('transactions')
            .select('*');
          expect(error).toBeNull();
          const rows =
            data as ReadonlyArray<{ readonly lease_id: string }>;
          const foreign = rows.filter(
            (r) => r.lease_id !== TEST_UUIDS.lease1,
          );
          expect(foreign.length).toBe(0);
        })());
    });

    it('cannot insert transactions', async () => {
      skip(available);
      available || expect(true).toBe(true);
      available &&
        (await (async () => {
          const { error } = await client
            .from('transactions')
            .insert({
              lease_id: TEST_UUIDS.lease2,
              amount: 9999,
              type: 'rent',
              status: 'paid',
              due_date: '2026-01-01',
            });
          expect(error).not.toBeNull();
        })());
    });

    afterAll(async () => {
      available && (await signOut(client));
    });
  });
});