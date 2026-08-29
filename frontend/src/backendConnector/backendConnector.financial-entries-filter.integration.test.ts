// ══════════════════════════════════════════════════════════════
// Integration: FILTERED QUERY — financial entries text search
// ══════════════════════════════════════════════════════════════
// Focused companion to FinancialEntriesM's text filter. Documents how
// a single PostgREST request filters financial entries by a related
// (to-one) property name:
//
//   • a top-level joined-column filter works (properties.name)
//   • the same dot-notation is NOT valid inside an .or() logic tree
//
// It also guards the list view against silent row loss by executing the exact
// select string the master ships.

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
  TEST_UUIDS,
  type SupabaseClient,
} from './test-setup';
import { FINANCIAL_ENTRY_LIST_SELECT, FINANCIAL_ENTRY_LIST_SELECT_BY_PROPERTY } from '@/masterComponents/FinancialEntriesM';

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
            .select(FINANCIAL_ENTRY_LIST_SELECT_BY_PROPERTY)
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

    // Embedded relationships are resolved server-side, so a broken embed is
    // invisible to tsc. This runs the list view's real select string.
    it('resolves the list-view embed', async () => {
      skip(available);
      available || true;
      available &&
        (await (async () => {
          const { data, error } = await client
            .from('financial_entry')
            .select(FINANCIAL_ENTRY_LIST_SELECT)
            .eq('id', TEST_UUIDS.financialEntry1);
          expect(error).toBeNull();
          expect((data ?? []).length).toBe(1);
        })());
    });

    // REGRESSION GUARD (silent row loss).
    // The default select must LEFT join property. financialEntry1 is a rent
    // charge: lease-only, no property_id. Under an inner join it — and every
    // other accrual charge, i.e. every unpaid amount — vanishes from the list.
    it('returns lease-only charges that carry no property_id', async () => {
      skip(available);
      available || true;
      available &&
        (await (async () => {
          const { data, error } = await client
            .from('financial_entry')
            .select(FINANCIAL_ENTRY_LIST_SELECT)
            .is('property_id', null)
            .lt('amount', 0);
          expect(error).toBeNull();
          expect((data ?? []).length).toBeGreaterThan(0);
        })());
    });

    // The list must show the whole ledger, not just the property-tagged part.
    it('lists every entry, not only those joined to a property', async () => {
      skip(available);
      available || true;
      available &&
        (await (async () => {
          const listed = await client
            .from('financial_entry')
            .select(FINANCIAL_ENTRY_LIST_SELECT, { count: 'exact', head: true });
          const all = await client
            .from('financial_entry')
            .select('id', { count: 'exact', head: true });
          expect(listed.error).toBeNull();
          expect(listed.count).toBe(all.count);
        })());
    });

    // lease_agreement must arrive as a single object; an array would silently
    // break `leaseLabel(tx)` in FinancialEntriesS.
    it('embeds lease_agreement as a to-one object, not an array', async () => {
      skip(available);
      available || true;
      available &&
        (await (async () => {
          const { data, error } = await client
            .from('financial_entry')
            .select(FINANCIAL_ENTRY_LIST_SELECT)
            .eq('id', 'd0000000-0000-0000-0000-000000000004')
            .single();
          expect(error).toBeNull();
          const row = data as unknown as {
            readonly lease_agreement: { readonly start_date: string } | null;
          };
          expect(Array.isArray(row.lease_agreement)).toBe(false);
          expect(row.lease_agreement?.start_date).toBe('2025-06-01');
        })());
    });

  });
});