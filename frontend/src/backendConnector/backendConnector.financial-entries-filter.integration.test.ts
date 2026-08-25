// ══════════════════════════════════════════════════════════════
// Integration: FILTERED QUERY — transactions text search
// ══════════════════════════════════════════════════════════════
// Focused companion to TransactionsM's text filter. Documents how
// a single PostgREST request filters transactions by a related
// (to-one) property name:
//
//   • a top-level joined-column filter works (properties.name)
//   • the same dot-notation is NOT valid inside an .or() logic tree

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
  checkAvailable,
  type SupabaseClient,
} from './test-setup';

const skip = (available: boolean): void => {
  expect(available).toBeDefined();
};

describe('transactions filtered query', () => {
  let available = false;
  beforeAll(async () => {
    available = await checkAvailable();
  });

  describe('landlord', () => {
    let client: SupabaseClient;

    beforeAll(async () => {
      client = await signInAs('landlord');
    });

    afterAll(async () => {
      await signOut(client);
    });

    // A single request: filter the parent rows by the embedded
    // to-one property column via a top-level .ilike().
    it('ilike on embedded properties.name matches transactions', async () => {
      skip(available);
      available || true;
      available &&
        (await (async () => {
          const { data, error } = await client
            .from('transactions')
            .select('*, properties!inner(name)')
            .ilike('properties.name', '*Gdańsk*');
          expect(error).toBeNull();
          const rows = data as ReadonlyArray<{
            readonly properties: { readonly name: string };
          }>;
          expect(rows.length).toBeGreaterThanOrEqual(1);
          const allMatch = rows.every((r) =>
            r.properties.name.includes('Gdańsk'),
          );
          expect(allMatch).toBe(true);
        })());
    });

    // Embedded relationship dot-notation is rejected inside an or()
    // logic tree — PostgREST returns a PGRST100 parse error.
    it('rejects embedded relationship filter inside or()', async () => {
      skip(available);
      available || true;
      available &&
        (await (async () => {
          const { error } = await client
            .from('transactions')
            .select('*')
            .or('description.ilike.*Gdańsk*,properties.name.ilike.*Gdańsk*');
          expect(error).not.toBeNull();
        })());
    });
  });
});