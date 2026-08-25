import { describe, it, expect, vi } from 'vitest';
import { match } from 'ts-pattern';
import { financialEntryInsertSchema, type FinancialEntryInsertInput } from '@/masterComponents/FinancialEntryM';

// Prevent the real backendConnector (createClient) from running at import time —
// this test only exercises the pure zod schema.
vi.mock('@/backendConnector/backendConnector', () => ({ backendConnector: {} }));

const validInput: FinancialEntryInsertInput = {
  description: 'Czynsz za styczeń',
  amount: -2500,
  value_date: '2026-01-15',
  lease_id: 'c0000000-0000-0000-0000-000000000001',
  property_id: 'a0000000-0000-0000-0000-000000000001',
  treasury_id: 'f0000000-0000-0000-0000-000000000001',
};

const parsed = (input: FinancialEntryInsertInput) => financialEntryInsertSchema.safeParse(input);

const failureMessages = (input: FinancialEntryInsertInput): ReadonlyArray<string> =>
  match(parsed(input))
    .with({ success: false }, ({ error }) => error.issues.map((issue) => issue.message))
    .with({ success: true }, () => [])
    .exhaustive();

describe('financialEntryInsertSchema', () => {
  it('accepts a valid charge payload (negative amount, lease + property)', () => {
    expect(parsed(validInput).success).toBe(true);
  });

  it('accepts a valid payment payload (positive amount)', () => {
    expect(parsed({ ...validInput, amount: 2500 }).success).toBe(true);
  });

  it('accepts a null lease_id when property_id is set', () => {
    expect(parsed({ ...validInput, lease_id: null }).success).toBe(true);
  });

  it('accepts a null property_id when lease_id is set', () => {
    expect(parsed({ ...validInput, property_id: null }).success).toBe(true);
  });

  it('accepts a treasury-only payload (bank fee: no lease, no property)', () => {
    expect(parsed({ ...validInput, lease_id: null, property_id: null }).success).toBe(true);
  });

  it('accepts a lease-only accrual charge (no treasury: no money moved yet)', () => {
    expect(parsed({ ...validInput, property_id: null, treasury_id: null }).success).toBe(true);
  });

  it('accepts a property-only reclassification (retained deposit granted to property)', () => {
    expect(parsed({ ...validInput, lease_id: null, treasury_id: null }).success).toBe(true);
  });

  it('rejects when all three references are null', () => {
    expect(
      failureMessages({ ...validInput, lease_id: null, property_id: null, treasury_id: null }),
    ).toContain('Wybierz umowę, nieruchomość lub skarbiec');
  });

  it('rejects a zero amount', () => {
    expect(failureMessages({ ...validInput, amount: 0 })).toContain('Kwota nie może być zerowa');
  });

  it('rejects an empty description', () => {
    expect(failureMessages({ ...validInput, description: '   ' })).toContain('Opis jest wymagany');
  });

  it('rejects an empty value_date', () => {
    expect(failureMessages({ ...validInput, value_date: '' })).toContain('Data jest wymagana');
  });

  it('rejects a value_date earlier than 2020-01-01', () => {
    expect(failureMessages({ ...validInput, value_date: '2019-12-31' })).toContain(
      'Data nie może być wcześniejsza niż 2020-01-01',
    );
  });

  it('rejects a value_date in the year 2100 or later', () => {
    expect(failureMessages({ ...validInput, value_date: '2100-01-01' })).toContain(
      'Data nie może być późniejsza niż 2099-12-31',
    );
  });

  it('rejects a NaN amount', () => {
    expect(failureMessages({ ...validInput, amount: Number.NaN })).toContain('Kwota musi być liczbą');
  });
});
