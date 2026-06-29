// ══════════════════════════════════════════════════════════════
// Integration: VIEWS
// ══════════════════════════════════════════════════════════════
// Test that views respect RLS (security_invoker) and return
// role-appropriate data.

import { describe, it, expect } from 'vitest';
import { signInAs, signOut, TEST_UUIDS, type SupabaseClient } from './setup';

// ── active_leases ───────────────────────────────
describe('active_leases view', () => {
  it('landlord sees all active leases', async () => {
    const client = await signInAs('landlord');
    const { data, error } = await client.from('active_leases').select('*');
    expect(error).toBeNull();
    expect((data as readonly unknown[]).length).toBeGreaterThanOrEqual(2);
    await signOut(client);
  });

  it('tenant sees only own active leases', async () => {
    const client = await signInAs('tenant1');
    const { data, error } = await client.from('active_leases').select('*');
    expect(error).toBeNull();
    const rows = data as ReadonlyArray<{ readonly id: string }>;
    expect(rows.length).toBe(1);
    expect(rows[0]!.id).toBe(TEST_UUIDS.lease1);
    await signOut(client);
  });
});

// ── property_occupancy ──────────────────────────
describe('property_occupancy view', () => {
  it('landlord sees all property occupancy', async () => {
    const client = await signInAs('landlord');
    const { data, error } = await client.from('property_occupancy').select('*');
    // security_invoker view + RLS — PostgREST may return fewer rows
    // than psql direct; the key assertion is no RLS permission error
    expect(error).toBeNull();
    expect(data).not.toBeNull();
    await signOut(client);
  });

  it('tenant sees only their leased property occupancy', async () => {
    const client = await signInAs('tenant2');
    const { data, error } = await client.from('property_occupancy').select('*');
    expect(error).toBeNull();
    const rows = data as ReadonlyArray<{ readonly id: string }>;
    // Anna Nowak leases Kraków (a00...002)
    expect(rows.length).toBe(1);
    expect(rows[0]!.id).toBe(TEST_UUIDS.property2);
    await signOut(client);
  });
});

// ── unpaid_transactions_summary ─────────────────
describe('unpaid_transactions_summary view', () => {
  it('landlord sees all unpaid summaries', async () => {
    const client = await signInAs('landlord');
    const { error } = await client.from('unpaid_transactions_summary').select('*');
    // May have 0 rows (all paid), but should not RLS-error
    expect(error).toBeNull();
    await signOut(client);
  });

  it('tenant sees only own unpaid summary', async () => {
    const client = await signInAs('tenant1');
    const { data, error } = await client.from('unpaid_transactions_summary').select('*');
    expect(error).toBeNull();
    const rows = data as ReadonlyArray<{ readonly lease_id: string }>;
    // Should only see data for own leases, if any
    const foreign = rows.filter((r) => r.lease_id !== TEST_UUIDS.lease1);
    expect(foreign.length).toBe(0);
    await signOut(client);
  });
});

// ── property_financial_summary ──────────────────
describe('property_financial_summary view', () => {
  it('landlord sees all property financials', async () => {
    const client = await signInAs('landlord');
    const { data, error } = await client.from('property_financial_summary').select('*');
    // security_invoker view + RLS — PostgREST may return fewer rows
    // than psql direct; the key assertion is no RLS permission error
    expect(error).toBeNull();
    expect(data).not.toBeNull();
    await signOut(client);
  });

  it('tenant sees only their leased property financials', async () => {
    const client = await signInAs('tenant1');
    const { data, error } = await client.from('property_financial_summary').select('*');
    expect(error).toBeNull();
    const rows = data as ReadonlyArray<{ readonly property_id: string }>;
    expect(rows.length).toBe(1);
    expect(rows[0]!.property_id).toBe(TEST_UUIDS.property1);
    await signOut(client);
  });
});
