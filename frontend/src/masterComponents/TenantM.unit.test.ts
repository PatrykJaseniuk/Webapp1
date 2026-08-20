import { describe, it, expect, vi } from 'vitest';
import { match } from 'ts-pattern';
import { tenantInsertSchema, type TenantInsertInput } from '@/masterComponents/TenantM';

// Prevent the real backendConnector (createClient) from running at import time —
// this test only exercises the pure zod schema.
vi.mock('@/backendConnector/backendConnector', () => ({ backendConnector: {} }));

const validInput: TenantInsertInput = {
  first_name: 'Jan',
  last_name: 'Kowalski',
  email: 'jan@example.com',
  phone: '123456789',
  id_document_number: 'ABC123456',
  emergency_contact_name: 'Anna Kowalska',
  emergency_contact_phone: '987654321',
  notes: 'Notatka',
  tenant_status: 'active',
};

const parsed = (input: TenantInsertInput) => tenantInsertSchema.safeParse(input);

const parsedData = (input: TenantInsertInput) =>
  match(parsed(input))
    .with({ success: true }, ({ data }) => data)
    .with({ success: false }, () => null)
    .exhaustive();

const failureMessages = (input: TenantInsertInput): ReadonlyArray<string> =>
  match(parsed(input))
    .with({ success: false }, ({ error }) => error.issues.map((issue) => issue.message))
    .with({ success: true }, () => [])
    .exhaustive();

describe('tenantInsertSchema', () => {
  it('accepts a valid payload', () => {
    expect(parsed(validInput).success).toBe(true);
  });

  it('trims whitespace on first_name and last_name', () => {
    const data = parsedData({ ...validInput, first_name: '  Jan  ', last_name: '  Kowalski  ' });
    expect(data?.first_name).toBe('Jan');
    expect(data?.last_name).toBe('Kowalski');
  });

  it('allows null optional fields', () => {
    expect(
      parsed({
        ...validInput,
        id_document_number: null,
        emergency_contact_name: null,
        emergency_contact_phone: null,
        notes: null,
      }).success,
    ).toBe(true);
  });

  it('rejects an empty (whitespace-only) first_name', () => {
    expect(failureMessages({ ...validInput, first_name: '   ' })).toContain('Imię jest wymagane');
  });

  it('rejects an empty last_name', () => {
    expect(failureMessages({ ...validInput, last_name: '' })).toContain('Nazwisko jest wymagane');
  });

  it('rejects an invalid email', () => {
    expect(failureMessages({ ...validInput, email: 'not-an-email' })).toContain('Nieprawidłowy adres email');
  });

  it('rejects an empty phone', () => {
    expect(failureMessages({ ...validInput, phone: '' })).toContain('Telefon jest wymagany');
  });

  it('rejects an invalid tenant_status', () => {
    expect(failureMessages({ ...validInput, tenant_status: 'unknown' } as unknown as TenantInsertInput)).toContain(
      'Nieprawidłowy status najemcy',
    );
  });
});
