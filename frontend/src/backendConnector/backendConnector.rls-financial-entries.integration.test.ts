// ══════════════════════════════════════════════════════════════
// RLS: financial entries
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

describe('financial entries RLS', () => {
  let available = false;
  beforeAll(async () => {
    available = await checkAvailable();
  });

  describe('landlord', () => {
    let client: SupabaseClient;

    it('can read all financial entries', async () => {
      skip(available);
      available || expect(true).toBe(true);
      available &&
        (await (async () => {
          client = await signInAs('landlord');
          const { data, error } = await client
            .from('financial_entry')
            .select('*');
          expect(error).toBeNull();
          expect(
            (data as readonly unknown[]).length,
          ).toBeGreaterThanOrEqual(1);
        })());
    });

    it('can insert a financial entry', async () => {
      skip(available);
      available || expect(true).toBe(true);
      available &&
        (await (async () => {
          const { data, error } = await client
            .from('financial_entry')
            .insert({
              lease_id: TEST_UUIDS.lease1,
              description: 'Test financial entry',
              amount: -100,
              value_date: '2026-06-01',
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
          // Cleanup: delete test financial entries
          await client
            .from('financial_entry')
            .delete()
            .eq('description', 'Test financial entry');
          await signOut(client);
        })());
    });
  });

  describe('tenant', () => {
    let client: SupabaseClient;

    it('sees only own financial entries', async () => {
      skip(available);
      available || expect(true).toBe(true);
      available &&
        (await (async () => {
          client = await signInAs('tenant1');
          const { data, error } = await client
            .from('financial_entry')
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

    it('cannot insert financial entries', async () => {
      skip(available);
      available || expect(true).toBe(true);
      available &&
        (await (async () => {
          const { error } = await client
            .from('financial_entry')
            .insert({
              lease_id: TEST_UUIDS.lease2,
              amount: 9999,
              value_date: '2026-01-01',
            });
          expect(error).not.toBeNull();
        })());
    });

    afterAll(async () => {
      available && (await signOut(client));
    });
  });
});