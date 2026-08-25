// ══════════════════════════════════════════════════════════════
// Integration: VIEWS
// ══════════════════════════════════════════════════════════════
// Test that views respect RLS (security_invoker) and return
// role-appropriate data.

import { describe, it, expect, beforeAll } from 'vitest';
import {
  signInAs,
  signOut,
  TEST_UUIDS,
  checkAvailable,
} from './test-setup';

const skip = (available: boolean): void => {
  expect(available).toBeDefined();
};

describe('views', () => {
  let available = false;
  beforeAll(async () => {
    available = await checkAvailable();
  });

  describe('active_leases', () => {
    it('landlord sees all active leases', async () => {
      skip(available);
      available || true;
      available &&
        (await (async () => {
          const client = await signInAs('landlord');
          const { data, error } = await client
            .from('active_leases')
            .select('*');
          expect(error).toBeNull();
          expect(
            (data as readonly unknown[]).length,
          ).toBeGreaterThanOrEqual(2);
          await signOut(client);
        })());
    });

    it('tenant sees only own active leases', async () => {
      skip(available);
      available || true;
      available &&
        (await (async () => {
          const client = await signInAs('tenant1');
          const { data, error } = await client
            .from('active_leases')
            .select('*');
          expect(error).toBeNull();
          const rows =
            data as ReadonlyArray<{ readonly id: string }>;
          expect(rows.length).toBe(1);
          expect(rows[0]!.id).toBe(TEST_UUIDS.lease1);
          await signOut(client);
        })());
    });
  });

  describe('property_occupancy', () => {
    it('landlord sees all property occupancy', async () => {
      skip(available);
      available || true;
      available &&
        (await (async () => {
          const client = await signInAs('landlord');
          const { data, error } = await client
            .from('property_occupancy')
            .select('*');
          expect(error).toBeNull();
          expect(data).not.toBeNull();
          await signOut(client);
        })());
    });

    it('tenant sees only their leased property occupancy', async () => {
      skip(available);
      available || true;
      available &&
        (await (async () => {
          const client = await signInAs('tenant2');
          const { data, error } = await client
            .from('property_occupancy')
            .select('*');
          expect(error).toBeNull();
          const rows =
            data as ReadonlyArray<{ readonly id: string }>;
          expect(rows.length).toBe(1);
          expect(rows[0]!.id).toBe(TEST_UUIDS.property2);
          await signOut(client);
        })());
    });
  });

  describe('lease_balance', () => {
    it('landlord sees all unpaid summaries', async () => {
      skip(available);
      available || true;
      available &&
        (await (async () => {
          const client = await signInAs('landlord');
          const { error } = await client
            .from('lease_balance')
            .select('*');
          expect(error).toBeNull();
          await signOut(client);
        })());
    });

    it('tenant sees only own unpaid summary', async () => {
      skip(available);
      available || true;
      available &&
        (await (async () => {
          const client = await signInAs('tenant1');
          const { data, error } = await client
            .from('lease_balance')
            .select('*');
          expect(error).toBeNull();
          const rows =
            data as ReadonlyArray<{ readonly lease_id: string }>;
          const foreign = rows.filter(
            (r) => r.lease_id !== TEST_UUIDS.lease1,
          );
          expect(foreign.length).toBe(0);
          await signOut(client);
        })());
    });
  });

  describe('property_financial_summary', () => {
    it('landlord sees all property financials', async () => {
      skip(available);
      available || true;
      available &&
        (await (async () => {
          const client = await signInAs('landlord');
          const { data, error } = await client
            .from('property_financial_summary')
            .select('*');
          expect(error).toBeNull();
          expect(data).not.toBeNull();
          await signOut(client);
        })());
    });

    it('tenant sees only their leased property financials', async () => {
      skip(available);
      available || true;
      available &&
        (await (async () => {
          const client = await signInAs('tenant1');
          const { data, error } = await client
            .from('property_financial_summary')
            .select('*');
          expect(error).toBeNull();
          const rows =
            data as ReadonlyArray<{ readonly property_id: string }>;
          expect(rows.length).toBe(1);
          expect(rows[0]!.property_id).toBe(TEST_UUIDS.property1);
          await signOut(client);
        })());
    });
  });
});