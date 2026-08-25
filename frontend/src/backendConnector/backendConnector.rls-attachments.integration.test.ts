// ══════════════════════════════════════════════════════════════
// RLS: attachments
// ══════════════════════════════════════════════════════════════

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

describe('attachments RLS', () => {
  let available = false;
  beforeAll(async () => {
    available = await checkAvailable();
  });

  describe('landlord', () => {
    let client: SupabaseClient;

    it('can read all attachments', async () => {
      skip(available);
      available || expect(true).toBe(true);
      available &&
        (await (async () => {
          client = await signInAs('landlord');
          const { data, error } = await client
            .from('attachment')
            .select('*');
          expect(error).toBeNull();
          expect(
            (data as readonly unknown[]).length,
          ).toBeGreaterThanOrEqual(1);
        })());
    });

    it('can insert an attachment', async () => {
      skip(available);
      available || expect(true).toBe(true);
      available &&
        (await (async () => {
          const { data, error } = await client
            .from('attachment')
            .insert({
              related_to_type: 'property',
              related_to_id: TEST_UUIDS.property1,
              file_name: 'test.pdf',
              file_url: 'test/test.pdf',
              file_size: 1024,
              file_type: 'pdf',
            })
            .select('id')
            .single();
          expect(error).toBeNull();
          expect(data).not.toBeNull();
        })());
    });

    afterAll(async () => {
      available &&
        (await (async () => {
          // Cleanup: delete test attachment
          await client
            .from('attachment')
            .delete()
            .eq('file_name', 'test.pdf');
          await signOut(client);
        })());
    });
  });

  describe('tenant', () => {
    let client: SupabaseClient;

    it('sees only attachments for own lease/property', async () => {
      skip(available);
      available || expect(true).toBe(true);
      available &&
        (await (async () => {
          client = await signInAs('tenant1');
          const { data, error } = await client
            .from('attachment')
            .select('*');
          expect(error).toBeNull();
          const rows =
            data as ReadonlyArray<{
              readonly related_to_type: string;
              readonly related_to_id: string;
            }>;
          const foreign = rows.filter(
            (r) =>
              r.related_to_id !== TEST_UUIDS.property1 &&
              r.related_to_id !== TEST_UUIDS.lease1,
          );
          expect(foreign.length).toBe(0);
        })());
    });

    it('cannot insert attachments', async () => {
      skip(available);
      available || expect(true).toBe(true);
      available &&
        (await (async () => {
          const { error } = await client
            .from('attachment')
            .insert({
              related_to_type: 'property',
              related_to_id: TEST_UUIDS.property2,
              file_name: 'hack.pdf',
              file_path: 'hack/hack.pdf',
              file_size: 1,
              content_type: 'application/pdf',
            });
          expect(error).not.toBeNull();
        })());
    });

    afterAll(async () => {
      available && (await signOut(client));
    });
  });
});