// ══════════════════════════════════════════════════════════════
// RLS: transactions
// ══════════════════════════════════════════════════════════════
// Landlords: full CRUD
// Tenants: see only transactions from their leases
//          + property-level expenses on their leased properties

import { describe, it, expect } from 'vitest';
import { signInAs, signOut, TEST_UUIDS, type SupabaseClient } from './setup';

// ── Landlord tests ──────────────────────────────
describe('transactions — landlord', () => {
  let client: SupabaseClient;

  it('landlord can read all transactions', async () => {
    client = await signInAs('landlord');
    const { data, error } = await client.from('transactions').select('*');
    expect(error).toBeNull();
    expect((data as readonly unknown[]).length).toBeGreaterThanOrEqual(30);
  });

  it('landlord can insert a transaction', async () => {
    const { data, error } = await client
      .from('transactions')
      .insert({
        property_id: TEST_UUIDS.property1,
        type: 'expense',
        description: 'RLS test expense',
        amount: -100,
        due_date: '2026-06-01',
      })
      .select('id')
      .single();
    expect(error).toBeNull();
    expect(data).not.toBeNull();
  });

  it('landlord can update a transaction', async () => {
    const { error } = await client
      .from('transactions')
      .update({ description: 'RLS updated' })
      .eq('id', TEST_UUIDS.transaction1);
    expect(error).toBeNull();
  });

  it('cleanup', async () => {
    // Clean up test transaction
    await client
      .from('transactions')
      .delete()
      .eq('description', 'RLS test expense');
    await signOut(client);
  });
});

// ── Tenant tests ────────────────────────────────
describe('transactions — tenant', () => {
  let client: SupabaseClient;

  it('tenant sees only own lease transactions', async () => {
    client = await signInAs('tenant1');
    const { data, error } = await client
      .from('transactions')
      .select('*')
      .not('lease_id', 'is', null);
    expect(error).toBeNull();
    const rows = data as ReadonlyArray<{ readonly lease_id: string }>;
    // All lease transactions should belong to tenant's leases
    const othersLeaseTx = rows.filter(
      (r) => r.lease_id !== TEST_UUIDS.lease1
    );
    expect(othersLeaseTx.length).toBe(0);
  });

  it('tenant sees property-level expenses for their visible properties', async () => {
    const { data, error } = await client
      .from('transactions')
      .select('*')
      .is('lease_id', null);
    expect(error).toBeNull();
    const rows = data as ReadonlyArray<{ readonly property_id: string }>;
    // Property-level transactions should only be for the tenant's leased properties
    const otherProps = rows.filter(
      (r) => r.property_id !== TEST_UUIDS.property1
    );
    expect(otherProps.length).toBe(0);
  });

  it('tenant cannot insert transactions', async () => {
    const { error } = await client.from('transactions').insert({
      property_id: TEST_UUIDS.property1,
      type: 'expense',
      description: 'Unauthorized',
      amount: -50,
      due_date: '2026-06-01',
    });
    expect(error).not.toBeNull();
  });

  it('cleanup', async () => {
    await signOut(client);
  });
});
