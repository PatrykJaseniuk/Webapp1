// ══════════════════════════════════════════════════════════════
// RLS: tenants
// ══════════════════════════════════════════════════════════════
// Landlords: full CRUD
// Tenants: read own tenant record, cannot modify others

import { describe, it, expect } from 'vitest';
import { signInAs, signOut, TEST_UUIDS, type SupabaseClient } from './setup';

// ── Landlord tests ──────────────────────────────
describe('tenants — landlord', () => {
  let client: SupabaseClient;

  it('landlord can read all tenants', async () => {
    client = await signInAs('landlord');
    const { data, error } = await client.from('tenants').select('*');
    expect(error).toBeNull();
    expect((data as readonly unknown[]).length).toBeGreaterThanOrEqual(5);
  });

  it('landlord can insert a tenant', async () => {
    const { data, error } = await client
      .from('tenants')
      .insert({
        first_name: 'Test',
        last_name: 'Tenant',
        email: 'test.tenant.rls@test.local',
        phone: '+48 000 000 000',
        tenant_status: 'applicant',
      })
      .select('id')
      .single();
    expect(error).toBeNull();
    expect(data).not.toBeNull();
  });

  it('landlord can update a tenant', async () => {
    const { error } = await client
      .from('tenants')
      .update({ notes: 'RLS test update' })
      .eq('id', TEST_UUIDS.tenant1Profile);
    expect(error).toBeNull();
  });

  it('cleanup', async () => {
    // Clean up test tenant
    await client
      .from('tenants')
      .delete()
      .eq('email', 'test.tenant.rls@test.local');
    await signOut(client);
  });
});

// ── Tenant tests ────────────────────────────────
describe('tenants — tenant', () => {
  let client: SupabaseClient;

  it('tenant can read own record', async () => {
    client = await signInAs('tenant1');
    const { data, error } = await client
      .from('tenants')
      .select('*')
      .eq('user_id', TEST_UUIDS.tenant1);
    expect(error).toBeNull();
    expect((data as readonly unknown[]).length).toBeGreaterThanOrEqual(1);
  });

  it('tenant cannot insert tenants', async () => {
    const { error } = await client.from('tenants').insert({
      first_name: 'Bad',
      last_name: 'Actor',
      email: 'bad@test.local',
      phone: '+48 999 999 999',
      tenant_status: 'active',
    });
    expect(error).not.toBeNull();
  });

  it('cleanup', async () => {
    await signOut(client);
  });
});
