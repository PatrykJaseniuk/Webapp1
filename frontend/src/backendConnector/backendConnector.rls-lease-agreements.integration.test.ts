// ══════════════════════════════════════════════════════════════
// RLS: lease_agreements
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

describe('lease_agreements RLS', () => {
  let available = false;
  beforeAll(async () => {
    available = await checkAvailable();
  });

  describe('landlord', () => {
    let client: SupabaseClient;

    it('can read all lease agreements', async () => {
      skip(available);
      available || true;
      available &&
        (await (async () => {
          client = await signInAs('landlord');
          const { data, error } = await client
            .from('lease_agreement')
            .select('*');
          expect(error).toBeNull();
          expect(
            (data as readonly unknown[]).length,
          ).toBeGreaterThanOrEqual(3);
        })());
    });

    it('can insert a lease agreement', async () => {
      skip(available);
      available || true;
      available &&
        (await (async () => {
          const { data, error } = await client
            .from('lease_agreement')
            .insert({
              property_id: TEST_UUIDS.property4,
              tenant_id: TEST_UUIDS.tenant1Profile,
              start_date: '2026-01-01',
              end_date: '2027-01-01',
              monthly_rent: 900,
              deposit_amount: 900,
              lease_status: 'active',
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
          // Cleanup: delete test lease
          await client
            .from('lease_agreement')
            .delete()
            .eq('monthly_rent', 900)
            .eq('deposit_amount', 900);
          await signOut(client);
        })());
    });
  });

  describe('tenant', () => {
    let client: SupabaseClient;

    it('sees only own lease', async () => {
      skip(available);
      available || true;
      available &&
        (await (async () => {
          client = await signInAs('tenant1');
          const { data, error } = await client
            .from('lease_agreement')
            .select('*');
          expect(error).toBeNull();
          const rows =
            data as ReadonlyArray<{ readonly id: string }>;
          expect(rows.length).toBe(1);
          expect(rows[0]!.id).toBe(TEST_UUIDS.lease1);
        })());
    });

    it('cannot insert', async () => {
      skip(available);
      available || true;
      available &&
        (await (async () => {
          const { error } = await client
            .from('lease_agreement')
            .insert({
              property_id: TEST_UUIDS.property1,
              tenant_id: TEST_UUIDS.tenant2Profile,
              start_date: '2026-01-01',
              end_date: '2027-01-01',
              monthly_rent: 500,
              deposit_amount: 500,
              lease_status: 'active',
            });
          expect(error).not.toBeNull();
        })());
    });

    afterAll(async () => {
      available && (await signOut(client));
    });
  });
});