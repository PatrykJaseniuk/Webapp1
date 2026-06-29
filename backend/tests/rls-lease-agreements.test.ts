// ══════════════════════════════════════════════════════════════
// RLS: lease_agreements
// ══════════════════════════════════════════════════════════════
// Landlords: full CRUD
// Tenants: see only their own leases

import { describe, it, expect } from 'vitest';
import { signInAs, signOut, TEST_UUIDS, type SupabaseClient } from './setup';

// ── Landlord tests ──────────────────────────────
describe('lease_agreements — landlord', () => {
  let client: SupabaseClient;

  it('landlord can read all leases', async () => {
    client = await signInAs('landlord');
    const { data, error } = await client.from('lease_agreements').select('*');
    expect(error).toBeNull();
    expect((data as readonly unknown[]).length).toBeGreaterThanOrEqual(4);
  });

  it('landlord can insert a lease', async () => {
    const { data, error } = await client
      .from('lease_agreements')
      .insert({
        tenant_id: TEST_UUIDS.tenant3Profile,
        property_id: TEST_UUIDS.property4,
        start_date: '2026-06-01',
        end_date: '2027-05-31',
        monthly_rent: 2000,
        deposit_amount: 2000,
        lease_status: 'active',
      })
      .select('id')
      .single();
    expect(error).toBeNull();
    expect(data).not.toBeNull();
  });

  it('landlord can update a lease', async () => {
    const { error } = await client
      .from('lease_agreements')
      .update({ notes: 'RLS test' })
      .eq('id', TEST_UUIDS.lease1);
    expect(error).toBeNull();
  });

  it('cleanup', async () => {
    // Revert the test lease
    await client
      .from('lease_agreements')
      .delete()
      .eq('tenant_id', TEST_UUIDS.tenant3Profile)
      .eq('property_id', TEST_UUIDS.property4);
    await signOut(client);
  });
});

// ── Tenant tests ────────────────────────────────
describe('lease_agreements — tenant', () => {
  let client: SupabaseClient;

  it('tenant sees only own leases', async () => {
    client = await signInAs('tenant1');
    const { data, error } = await client.from('lease_agreements').select('*');
    expect(error).toBeNull();
    const rows = data as ReadonlyArray<{ readonly id: string; readonly tenant_id: string }>;
    expect(rows.length).toBe(1);
    expect(rows[0]!.id).toBe(TEST_UUIDS.lease1);
    expect(rows[0]!.tenant_id).toBe(TEST_UUIDS.tenant1Profile);
  });

  it('tenant cannot insert leases', async () => {
    const { error } = await client.from('lease_agreements').insert({
      tenant_id: TEST_UUIDS.tenant1Profile,
      property_id: TEST_UUIDS.property2,
      start_date: '2026-06-01',
      end_date: '2027-05-31',
      monthly_rent: 1000,
      deposit_amount: 1000,
    });
    expect(error).not.toBeNull();
  });

  it('tenant cannot delete leases', async () => {
    // Attempt delete — RLS silently filters the row (no error, just 0 affected)
    await client
      .from('lease_agreements')
      .delete()
      .eq('id', TEST_UUIDS.lease1);

    // Verify the lease still exists (delete was blocked by RLS)
    const { data: checkData, error: checkError } = await client
      .from('lease_agreements')
      .select('id')
      .eq('id', TEST_UUIDS.lease1)
      .single();
    expect(checkError).toBeNull();
    expect(checkData).not.toBeNull();
  });

  it('cleanup', async () => {
    await signOut(client);
  });
});
