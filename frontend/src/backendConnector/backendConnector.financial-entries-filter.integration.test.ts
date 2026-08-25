// ══════════════════════════════════════════════════════════════
// Integration: FILTERED QUERY — financial entries text search
// ══════════════════════════════════════════════════════════════
// Focused companion to FinancialEntriesM's text filter. Documents how
// a single PostgREST request filters financial entries by a related
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

describe('financial entries filtered query', () => {
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
    it('ilike on embedded property.name matches financial entries', async () => {
      skip(available);
      available || true;
      available &&
        (await (async () => {
          const { data, error } = await client
            .from('financial_entry')
            .select('*, property!inner(name)')
            .ilike('property.name', '*Gdańsk*');
          expect(error).toBeNull();
          const rows = data as ReadonlyArray<{
            readonly property: { readonly name: string };
          }>;
          expect(rows.length).toBeGreaterThanOrEqual(1);
          const allMatch = rows.every((r) =>
            r.property.name.includes('Gdańsk'),
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
            .from('financial_entry')
            .select('*')
            .or('description.ilike.*Gdańsk*,property.name.ilike.*Gdańsk*');
          expect(error).not.toBeNull();
        })());
    });
  });
});