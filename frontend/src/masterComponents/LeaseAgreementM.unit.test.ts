import { describe, it, expect, vi } from 'vitest';
import { match } from 'ts-pattern';
import { leaseAgreementInsertSchema, type LeaseAgreementInsertInput } from '@/masterComponents/LeaseAgreementM';

// Prevent the real backendConnector (createClient) from running at import time —
// this test only exercises the pure zod schema.
vi.mock('@/backendConnector/backendConnector', () => ({ backendConnector: {} }));

const validInput: LeaseAgreementInsertInput = {
  tenant_id: 'c0000000-0000-0000-0000-000000000002',
  property_id: 'a0000000-0000-0000-0000-000000000001',
  start_date: '2026-01-01',
  end_date: '2026-12-31',
  monthly_rent: 2500,
  deposit_amount: 5000,
  lease_status: 'active',
  notes: 'Notatka',
};

const parsed = (input: LeaseAgreementInsertInput) => leaseAgreementInsertSchema.safeParse(input);

const failureMessages = (input: LeaseAgreementInsertInput): ReadonlyArray<string> =>
  match(parsed(input))
    .with({ success: false }, ({ error }) => error.issues.map((issue) => issue.message))
    .with({ success: true }, () => [])
    .exhaustive();

describe('leaseAgreementInsertSchema', () => {
  it('accepts a valid payload', () => {
    expect(parsed(validInput).success).toBe(true);
  });

  it('allows a null end_date (open-ended lease) and null notes', () => {
    expect(parsed({ ...validInput, end_date: null, notes: null }).success).toBe(true);
  });

  it('rejects an empty tenant_id', () => {
    expect(failureMessages({ ...validInput, tenant_id: '' })).toContain('Wybierz najemcę');
  });

  it('rejects a non-uuid tenant_id', () => {
    expect(failureMessages({ ...validInput, tenant_id: 'abc' })).toContain('Wybierz najemcę');
  });

  it('rejects an empty property_id', () => {
    expect(failureMessages({ ...validInput, property_id: '' })).toContain('Wybierz nieruchomość');
  });

  it('rejects an empty start_date', () => {
    expect(failureMessages({ ...validInput, start_date: '' })).toContain('Data rozpoczęcia jest wymagana');
  });

  it('rejects an end_date earlier than start_date', () => {
    expect(failureMessages({ ...validInput, start_date: '2026-06-01', end_date: '2026-01-01' })).toContain(
      'Data zakończenia nie może być wcześniejsza niż data rozpoczęcia',
    );
  });

  it('rejects a negative monthly_rent', () => {
    expect(failureMessages({ ...validInput, monthly_rent: -1 })).toContain('Czynsz musi być większy od zera');
  });

  it('rejects a zero monthly_rent', () => {
    expect(failureMessages({ ...validInput, monthly_rent: 0 })).toContain('Czynsz musi być większy od zera');
  });

  it('rejects a NaN monthly_rent (from a failed Number() coercion)', () => {
    expect(failureMessages({ ...validInput, monthly_rent: Number.NaN })).toContain('Czynsz musi być liczbą');
  });

  it('rejects a negative deposit_amount', () => {
    expect(failureMessages({ ...validInput, deposit_amount: -1 })).toContain('Kaucja nie może być ujemna');
  });

  it('rejects an invalid lease_status', () => {
    expect(failureMessages({ ...validInput, lease_status: 'unknown' } as unknown as LeaseAgreementInsertInput)).toContain(
      'Nieprawidłowy status umowy',
    );
  });
});
