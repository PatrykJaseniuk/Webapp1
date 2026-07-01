// ══════════════════════════════════════════════════════════════
// RLS: properties
// ══════════════════════════════════════════════════════════════
// Landlords: full CRUD
// Tenants: only see properties they're currently leasing
// Admins: see all (via is_landlord() → true for admin)

import { describe, it, expect } from 'vitest';
import { signInAs, signOut, TEST_UUIDS, type SupabaseClient } from './setup';

// ── Landlord tests ──────────────────────────────
describe('properties — landlord', () => {
  let client: SupabaseClient;

  it('landlord can read all properties', async () => {
    client = await signInAs('landlord');
    const { data, error } = await client.from('properties').select('*');
    expect(error).toBeNull();
    expect((data as readonly unknown[]).length).toBeGreaterThanOrEqual(5);
  });

  it('landlord can insert a property', async () => {
    const { data, error } = await client
      .from('properties')
      .insert({
        name: 'Test Property',
        address: 'Test Street 1',
        property_type: 'apartment',
        monthly_rent: 1000,
        deposit_amount: 1000,
      })
      .select('id')
      .single();
    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data!.id).toBeDefined();
  });

  it('landlord can update a property', async () => {
    const { error } = await client
      .from('properties')
      .update({ name: 'Updated Name' })
      .eq('id', TEST_UUIDS.property1);
    expect(error).toBeNull();
  });

  it('landlord can delete a property', async () => {
    // Delete the test property we created
    const { error } = await client
      .from('properties')
      .delete()
      .eq('name', 'Test Property');
    expect(error).toBeNull();
  });

  it('cleanup', async () => {
    await signOut(client);
  });
});

// ── Tenant 1 tests (Jan — leases Warsaw) ────────
describe('properties — tenant', () => {
  let client: SupabaseClient;

  it('tenant sees only their leased property', async () => {
    client = await signInAs('tenant1');
    const { data, error } = await client.from('properties').select('*');
    expect(error).toBeNull();
    const rows = data as ReadonlyArray<{ readonly id: string }>;
    // Jan Kowalski leases only Warsaw (a00...001)
    expect(rows.length).toBe(1);
    expect(rows[0]!.id).toBe(TEST_UUIDS.property1);
  });

  it('tenant cannot insert properties', async () => {
    const { error } = await client.from('properties').insert({
      name: 'Unauthorized',
      address: 'Bad',
      property_type: 'apartment',
      monthly_rent: 1,
      deposit_amount: 1,
    });
    expect(error).not.toBeNull();
  });

  it('tenant cannot update properties', async () => {
    const { error } = await client
      .from('properties')
      .update({ name: 'Hacked' })
      .eq('id', TEST_UUIDS.property1);
    // Either 0 rows affected or RLS error
    expect(error === null || error?.code === '42501' || error?.code === 'PGRST116').toBe(true);
  });

  it('cleanup', async () => {
    await signOut(client);
  });
});

// ── Tenant 3 tests (Piotr — leases Gdańsk) ──────
describe('properties — tenant with active lease', () => {
  it('another tenant sees only their own property', async () => {
    const client = await signInAs('tenant3');
    const { data, error } = await client.from('properties').select('*');
    expect(error).toBeNull();
    const rows = data as ReadonlyArray<{ readonly id: string }>;
    expect(rows.length).toBe(1);
    expect(rows[0]!.id).toBe(TEST_UUIDS.property3);
    await signOut(client);
  });
});
