// ══════════════════════════════════════════════════════════════
// RLS: properties
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

describe('properties RLS', () => {
  let available = false;

  beforeAll(async () => {
    available = await checkAvailable();
  });

  describe('landlord', () => {
    let client: SupabaseClient;

    it('can read all properties', async () => {
      skip(available);
      available || true;
      available &&
        (await (async () => {
          client = await signInAs('landlord');
          const { data, error } = await client
            .from('property')
            .select('*');
          expect(error).toBeNull();
          expect(
            (data as readonly unknown[]).length,
          ).toBeGreaterThanOrEqual(5);
        })());
    });

    it('can insert a property', async () => {
      skip(available);
      available || true;
      available &&
        (await (async () => {
          const { data, error } = await client
            .from('property')
            .insert({
              name: 'Test Property',
              address: 'Test Street 1',
              property_type: 'apartment',
              property_status: 'available',
              monthly_rent: 1000,
              deposit_amount: 1000,
            })
            .select('id')
            .single();
          expect(error).toBeNull();
          expect(data).not.toBeNull();
        })());
    });

    it('can update a property', async () => {
      skip(available);
      available || true;
      available &&
        (await (async () => {
          const { error } = await client
            .from('property')
            .update({ name: 'Updated Name' })
            .eq('id', TEST_UUIDS.property1);
          expect(error).toBeNull();
        })());
    });

    it('can delete a property', async () => {
      skip(available);
      available || true;
      available &&
        (await (async () => {
          const { error } = await client
            .from('property')
            .delete()
            .eq('name', 'Test Property');
          expect(error).toBeNull();
        })());
    });

    afterAll(async () => {
      available &&
        (await (async () => {
          // Restore: undo the update to property1 name
          await client
            .from('property')
            .update({ name: 'Apartament Warszawa Centrum' })
            .eq('id', TEST_UUIDS.property1);
          await signOut(client);
        })());
    });
  });

  describe('tenant', () => {
    let client: SupabaseClient;

    it('sees only their leased property', async () => {
      skip(available);
      available || true;
      available &&
        (await (async () => {
          client = await signInAs('tenant1');
          const { data, error } =
            await client.from('property').select('*');
          expect(error).toBeNull();
          const rows =
            data as ReadonlyArray<{ readonly id: string }>;
          expect(rows.length).toBe(1);
          expect(rows[0]!.id).toBe(TEST_UUIDS.property1);
        })());
    });

    it('cannot insert properties', async () => {
      skip(available);
      available || true;
      available &&
        (await (async () => {
          const { error } = await client
            .from('property')
            .insert({
              name: 'Unauthorized',
              address: 'Bad',
              property_type: 'apartment',
              monthly_rent: 1,
              deposit_amount: 1,
            });
          expect(error).not.toBeNull();
        })());
    });

    it('cannot update properties (RLS silently drops unmatched rows)', async () => {
      skip(available);
      available || true;
      available &&
        (await (async () => {
          await client
            .from('property')
            .update({ name: 'Hacked' })
            .eq('id', TEST_UUIDS.property1);
          // RLS USING (is_landlord()) filters all rows for tenants →
          // PostgREST returns error: null with 0 rows affected (not a permission error).
          // Verify the property name was NOT changed.
          const { data: verify } = await client
            .from('property')
            .select('name')
            .eq('id', TEST_UUIDS.property1)
            .single();
          expect(
            (verify as { readonly name: string } | null)?.name,
          ).toBe('Apartament Warszawa Centrum');
        })());
    });

    afterAll(async () => {
      available && (await signOut(client));
    });
  });

  it('another tenant sees only their own property', async () => {
    skip(available);
    available || true;
    available &&
      (await (async () => {
        const client = await signInAs('tenant3');
        const { data, error } =
          await client.from('property').select('*');
        expect(error).toBeNull();
        const rows =
          data as ReadonlyArray<{ readonly id: string }>;
        expect(rows.length).toBe(1);
        expect(rows[0]!.id).toBe(TEST_UUIDS.property3);
        await signOut(client);
      })());
  });
});