// ══════════════════════════════════════════════════════════════
// RLS: attachments
// ══════════════════════════════════════════════════════════════
// Landlords: full CRUD
// Tenants: see attachments for their own leases
//          + property attachments for their leased properties

import { describe, it, expect } from 'vitest';
import { signInAs, signOut, TEST_UUIDS, type SupabaseClient } from './setup';

// ── Landlord tests ──────────────────────────────
describe('attachments — landlord', () => {
  let client: SupabaseClient;

  it('landlord can read all attachments', async () => {
    client = await signInAs('landlord');
    const { data, error } = await client.from('attachments').select('*');
    expect(error).toBeNull();
    expect((data as readonly unknown[]).length).toBeGreaterThanOrEqual(12);
  });

  it('landlord can insert an attachment', async () => {
    const { data, error } = await client
      .from('attachments')
      .insert({
        related_to_type: 'property',
        related_to_id: TEST_UUIDS.property1,
        file_name: 'test.pdf',
        file_url: '/uploads/test/test.pdf',
        file_type: 'pdf',
        file_size: 1000,
        description: 'RLS test attachment',
      })
      .select('id')
      .single();
    expect(error).toBeNull();
    expect(data).not.toBeNull();
  });

  it('landlord can delete an attachment', async () => {
    const { error } = await client
      .from('attachments')
      .delete()
      .eq('description', 'RLS test attachment');
    expect(error).toBeNull();
  });

  it('cleanup', async () => {
    await signOut(client);
  });
});

// ── Tenant tests ────────────────────────────────
describe('attachments — tenant', () => {
  let client: SupabaseClient;

  it('tenant can see their lease attachments', async () => {
    client = await signInAs('tenant1');
    const { data, error } = await client
      .from('attachments')
      .select('*')
      .eq('related_to_type', 'lease');
    expect(error).toBeNull();
    const rows = data as ReadonlyArray<{ readonly related_to_id: string }>;
    // Should only see lease attachments for leases the tenant has
    const foreignLeaseAttachments = rows.filter(
      (r) => r.related_to_id !== TEST_UUIDS.lease1
    );
    expect(foreignLeaseAttachments.length).toBe(0);
  });

  it('tenant can see their property attachments via get_tenant_visible_property_ids', async () => {
    const { data, error } = await client
      .from('attachments')
      .select('*')
      .eq('related_to_type', 'property');
    expect(error).toBeNull();
    const rows = data as ReadonlyArray<{ readonly related_to_id: string }>;
    // Tenant 1 leases Warsaw (a00...001) — should only see Warsaw property attachments
    const otherProps = rows.filter(
      (r) => r.related_to_id !== TEST_UUIDS.property1
    );
    expect(otherProps.length).toBe(0);
  });

  it('tenant cannot insert attachments', async () => {
    const { error } = await client.from('attachments').insert({
      related_to_type: 'property',
      related_to_id: TEST_UUIDS.property1,
      file_name: 'hack.pdf',
      file_url: '/uploads/hack/hack.pdf',
    });
    expect(error).not.toBeNull();
  });

  it('cleanup', async () => {
    await signOut(client);
  });
});
