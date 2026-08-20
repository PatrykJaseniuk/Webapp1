import { describe, it, expect, vi } from 'vitest';
import { match } from 'ts-pattern';
import { transactionInsertSchema, type TransactionInsertInput } from '@/masterComponents/TransactionM';

// Prevent the real backendConnector (createClient) from running at import time —
// this test only exercises the pure zod schema.
vi.mock('@/backendConnector/backendConnector', () => ({ backendConnector: {} }));

const validInput: TransactionInsertInput = {
  type: 'rent',
  description: 'Czynsz za styczeń',
  amount: -2500,
  due_date: '2026-01-15',
  transaction_status: 'pending',
  lease_id: 'c0000000-0000-0000-0000-000000000001',
  property_id: 'a0000000-0000-0000-0000-000000000001',
};

const parsed = (input: TransactionInsertInput) => transactionInsertSchema.safeParse(input);

const failureMessages = (input: TransactionInsertInput): ReadonlyArray<string> =>
  match(parsed(input))
    .with({ success: false }, ({ error }) => error.issues.map((issue) => issue.message))
    .with({ success: true }, () => [])
    .exhaustive();

describe('transactionInsertSchema', () => {
  it('accepts a valid expense payload (negative amount)', () => {
    expect(parsed(validInput).success).toBe(true);
  });

  it('accepts a valid income payload (positive amount)', () => {
    expect(parsed({ ...validInput, type: 'payment', amount: 2500 }).success).toBe(true);
  });

  it('accepts a null lease_id when property_id is set', () => {
    expect(parsed({ ...validInput, lease_id: null }).success).toBe(true);
  });

  it('rejects when both lease_id and property_id are null', () => {
    expect(failureMessages({ ...validInput, lease_id: null, property_id: null })).toContain(
      'Wybierz umowę lub nieruchomość',
    );
  });

  it('rejects a positive amount for an expense type', () => {
    expect(failureMessages({ ...validInput, amount: 2500 })).toContain('Typ kosztowy wymaga kwoty ujemnej');
  });

  it('rejects a negative amount for an income type', () => {
    expect(failureMessages({ ...validInput, type: 'payment', amount: -100 })).toContain(
      'Typ przychodowy wymaga kwoty dodatniej',
    );
  });

  it('rejects an empty description', () => {
    expect(failureMessages({ ...validInput, description: '   ' })).toContain('Opis jest wymagany');
  });

  it('rejects an empty due_date', () => {
    expect(failureMessages({ ...validInput, due_date: '' })).toContain('Termin płatności jest wymagany');
  });

  it('rejects a due_date earlier than 2020-01-01', () => {
    expect(failureMessages({ ...validInput, due_date: '2019-12-31' })).toContain(
      'Termin płatności nie może być wcześniejszy niż 2020-01-01',
    );
  });

  it('rejects an invalid type', () => {
    expect(failureMessages({ ...validInput, type: 'bogus' } as unknown as TransactionInsertInput)).toContain(
      'Nieprawidłowy typ transakcji',
    );
  });

  it('rejects a NaN amount', () => {
    expect(failureMessages({ ...validInput, amount: Number.NaN })).toContain('Kwota musi być liczbą');
  });
});
