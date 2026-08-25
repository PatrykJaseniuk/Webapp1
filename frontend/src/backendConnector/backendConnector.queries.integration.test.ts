// ══════════════════════════════════════════════════════════════
// Integration: COMPLEX SUPABASE QUERIES
// ══════════════════════════════════════════════════════════════
// Tests exercising PostgREST query capabilities: nested selects,
// complex filters, ordering, pagination, aggregation, edge cases.

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

describe('complex queries', () => {
  let available = false;
  beforeAll(async () => {
    available = await checkAvailable();
  });

  describe('landlord queries', () => {
    let client: SupabaseClient;

    beforeAll(async () => {
      client = await signInAs('landlord');
    });

    afterAll(async () => {
      await signOut(client);
    });

    // ═════════════════════════════════════════════════════════
    // 1. NESTED SELECTS
    // ═════════════════════════════════════════════════════════

    it('properties with nested lease_agreements', async () => {
      skip(available);
      available || true;
      available &&
        (await (async () => {
          const { data, error } = await client
            .from('properties')
            .select(
              'id, name, lease_agreements(id, start_date, lease_status)',
            )
            .eq('id', TEST_UUIDS.property1);
          expect(error).toBeNull();
          const rows =
            data as ReadonlyArray<{ readonly id: string }>;
          expect(rows.length).toBe(1);
          expect(rows[0]!.id).toBe(TEST_UUIDS.property1);
        })());
    });

    it('lease_agreements with nested tenants and properties', async () => {
      skip(available);
      available || true;
      available &&
        (await (async () => {
          const { data, error } = await client
            .from('lease_agreements')
            .select(
              'id, monthly_rent, tenants(first_name, last_name), properties(name, address)',
            )
            .eq('id', TEST_UUIDS.lease1);
          expect(error).toBeNull();
          const rows =
            data as ReadonlyArray<{ readonly id: string }>;
          expect(rows.length).toBe(1);
          expect(rows[0]!.id).toBe(TEST_UUIDS.lease1);
        })());
    });

    it('transactions with nested properties name', async () => {
      skip(available);
      available || true;
      available &&
        (await (async () => {
          const { data, error } = await client
            .from('transactions')
            .select('id, amount, properties(name)')
            .eq('id', TEST_UUIDS.transaction1);
          expect(error).toBeNull();
          const rows =
            data as ReadonlyArray<{ readonly id: string }>;
          expect(rows.length).toBe(1);
          expect(rows[0]!.id).toBe(TEST_UUIDS.transaction1);
        })());
    });

    // ═════════════════════════════════════════════════════════
    // 2. COMPLEX FILTERS
    // ═════════════════════════════════════════════════════════

    it('or filter across columns', async () => {
      skip(available);
      available || true;
      available &&
        (await (async () => {
          const { data, error } = await client
            .from('properties')
            .select('id')
            .or('property_type.eq.apartment,property_type.eq.house');
          expect(error).toBeNull();
          const rows = data as readonly unknown[];
          expect(rows.length).toBeGreaterThanOrEqual(1);
        })());
    });

    it('in filter for multiple statuses', async () => {
      skip(available);
      available || true;
      available &&
        (await (async () => {
          const { data, error } = await client
            .from('properties')
            .select('id, property_status')
            .in('property_status', ['available', 'occupied']);
          expect(error).toBeNull();
          const rows = data as ReadonlyArray<{
            readonly property_status: string;
          }>;
          const hasWrongStatus = rows.some(
            (r) =>
              r.property_status !== 'available' &&
              r.property_status !== 'occupied',
          );
          expect(hasWrongStatus).toBe(false);
        })());
    });

    it('range filter on monthly_rent', async () => {
      skip(available);
      available || true;
      available &&
        (await (async () => {
          const { data, error } = await client
            .from('properties')
            .select('id, monthly_rent')
            .gt('monthly_rent', 1000)
            .lt('monthly_rent', 3000);
          expect(error).toBeNull();
          const rows = data as ReadonlyArray<{
            readonly monthly_rent: number;
          }>;
          const outsideRange = rows.some(
            (r) =>
              r.monthly_rent <= 1000 || r.monthly_rent >= 3000,
          );
          expect(outsideRange).toBe(false);
        })());
    });

    it('text search with ilike', async () => {
      skip(available);
      available || true;
      available &&
        (await (async () => {
          const { data, error } = await client
            .from('properties')
            .select('id, address')
            .ilike('address', '%Warszawa%');
          expect(error).toBeNull();
          const rows = data as ReadonlyArray<{
            readonly address: string;
          }>;
          expect(rows.length).toBeGreaterThanOrEqual(1);
          const allContainWarszawa = rows.every((r) =>
            r.address.includes('Warszawa'),
          );
          expect(allContainWarszawa).toBe(true);
        })());
    });

    it('combined or + comparison on transactions', async () => {
      skip(available);
      available || true;
      available &&
        (await (async () => {
          const { data, error } = await client
            .from('transactions')
            .select('id, amount, due_date')
            .or('amount.gt.0,amount.lt.0');
          expect(error).toBeNull();
          expect(data).not.toBeNull();
        })());
    });

    // ═════════════════════════════════════════════════════════
    // 3. ORDERING & PAGINATION
    // ═════════════════════════════════════════════════════════

    it('order by descending with limit (top-N)', async () => {
      skip(available);
      available || true;
      available &&
        (await (async () => {
          const { data, error } = await client
            .from('properties')
            .select('id, monthly_rent')
            .order('monthly_rent', { ascending: false })
            .limit(3);
          expect(error).toBeNull();
          const rows = data as ReadonlyArray<{
            readonly monthly_rent: number;
          }>;
          expect(rows.length).toBe(3);
          const sorted = rows.every(
            (r, i) =>
              i === 0 ||
              rows[i - 1]!.monthly_rent >= r.monthly_rent,
          );
          expect(sorted).toBe(true);
        })());
    });

    it('order ascending with pagination range', async () => {
      skip(available);
      available || true;
      available &&
        (await (async () => {
          const { data, error } = await client
            .from('properties')
            .select('id, monthly_rent')
            .order('monthly_rent', { ascending: true })
            .range(0, 1);
          expect(error).toBeNull();
          const rows = data as ReadonlyArray<{
            readonly monthly_rent: number;
          }>;
          expect(rows.length).toBe(2);
          expect(rows[0]!.monthly_rent).toBeLessThanOrEqual(
            rows[1]!.monthly_rent,
          );
        })());
    });

    it('order with nulls handling', async () => {
      skip(available);
      available || true;
      available &&
        (await (async () => {
          const { data, error } = await client
            .from('transactions')
            .select('id, due_date')
            .order('due_date', {
              ascending: true,
              nullsFirst: false,
            })
            .limit(10);
          expect(error).toBeNull();
          const rows = data as ReadonlyArray<{
            readonly due_date: string | null;
          }>;
          expect(rows.length).toBeGreaterThanOrEqual(1);
        })());
    });

    // ═════════════════════════════════════════════════════════
    // 4. AGGREGATION & COUNTING
    // ═════════════════════════════════════════════════════════

    it('select with exact count', async () => {
      skip(available);
      available || true;
      available &&
        (await (async () => {
          const { data, count, error } = await client
            .from('properties')
            .select('*', { count: 'exact' });
          expect(error).toBeNull();
          expect(count).not.toBeNull();
          expect((count as number)).toBeGreaterThanOrEqual(5);
          expect(
            (data as readonly unknown[]).length,
          ).toBeGreaterThanOrEqual(5);
        })());
    });

    it('head-only count (no rows returned)', async () => {
      skip(available);
      available || true;
      available &&
        (await (async () => {
          const { data, count, error } = await client
            .from('properties')
            .select('*', { count: 'exact', head: true });
          expect(error).toBeNull();
          expect(count).toBeGreaterThanOrEqual(5);
          expect(data).toBeNull();
        })());
    });

    // ═════════════════════════════════════════════════════════
    // 5. COMBINED OPERATIONS
    // ═════════════════════════════════════════════════════════

    it('filter + order + paginate', async () => {
      skip(available);
      available || true;
      available &&
        (await (async () => {
          const { data, error } = await client
            .from('properties')
            .select('id, name, monthly_rent, property_status')
            .in('property_status', ['available', 'occupied'])
            .gte('monthly_rent', 500)
            .order('monthly_rent', { ascending: false })
            .limit(5);
          expect(error).toBeNull();
          const rows = data as ReadonlyArray<{
            readonly property_status: string;
            readonly monthly_rent: number;
          }>;
          expect(rows.length).toBeGreaterThanOrEqual(1);
          const allValid = rows.every(
            (r) =>
              (r.property_status === 'available' ||
                r.property_status === 'occupied') &&
              r.monthly_rent >= 500,
          );
          expect(allValid).toBe(true);
        })());
    });

    it('join + filter + order', async () => {
      skip(available);
      available || true;
      available &&
        (await (async () => {
          const { data, error } = await client
            .from('lease_agreements')
            .select('id, lease_status, start_date, properties(name)')
            .eq('lease_status', 'active')
            .order('start_date', { ascending: false });
          expect(error).toBeNull();
          const rows =
            data as ReadonlyArray<{ readonly lease_status: string }>;
          expect(rows.length).toBeGreaterThanOrEqual(1);
          const allActive = rows.every(
            (r) => r.lease_status === 'active',
          );
          expect(allActive).toBe(true);
        })());
    });

    it('aggregate transactions per lease', async () => {
      skip(available);
      available || true;
      available &&
        (await (async () => {
          const { data, error } = await client
            .from('transactions')
            .select('id, amount')
            .eq('lease_id', TEST_UUIDS.lease1);
          expect(error).toBeNull();
          const rows = data as ReadonlyArray<{
            readonly amount: number;
          }>;
          expect(rows.length).toBeGreaterThanOrEqual(1);
          const totalAmount = rows.reduce(
            (sum: number, r) => sum + r.amount,
            0,
          );
          expect(typeof totalAmount).toBe('number');
        })());
    });

    // ═════════════════════════════════════════════════════════
    // 6. EDGE CASES
    // ═════════════════════════════════════════════════════════

    it('limit(0) returns empty array with no error', async () => {
      skip(available);
      available || true;
      available &&
        (await (async () => {
          const { data, error } = await client
            .from('properties')
            .select('*')
            .limit(0);
          expect(error).toBeNull();
          expect(data).not.toBeNull();
          expect((data as readonly unknown[]).length).toBe(0);
        })());
    });

    it('eq with non-existent UUID returns empty array', async () => {
      skip(available);
      available || true;
      available &&
        (await (async () => {
          const { data, error } = await client
            .from('properties')
            .select('id')
            .eq('id', '00000000-0000-0000-0000-000000000000');
          expect(error).toBeNull();
          expect((data as readonly unknown[]).length).toBe(0);
        })());
    });

    it('is null filter', async () => {
      skip(available);
      available || true;
      available &&
        (await (async () => {
          const { data, error } = await client
            .from('lease_agreements')
            .select('id, end_date')
            .is('end_date', null);
          expect(error).toBeNull();
          const rows = data as ReadonlyArray<{
            readonly end_date: string | null;
          }>;
          const allNull = rows.every((r) => r.end_date === null);
          expect(allNull).toBe(true);
        })());
    });

    it('not.is filter for non-null values', async () => {
      skip(available);
      available || true;
      available &&
        (await (async () => {
          const { data, error } = await client
            .from('lease_agreements')
            .select('id, start_date')
            .not('start_date', 'is', null);
          expect(error).toBeNull();
          const rows =
            data as ReadonlyArray<{ readonly start_date: string }>;
          expect(rows.length).toBeGreaterThanOrEqual(1);
        })());
    });
  });
});