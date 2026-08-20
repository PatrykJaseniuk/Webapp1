import { describe, it, expect, vi } from 'vitest';
import { match } from 'ts-pattern';
import { propertyInsertSchema, type PropertyInsertInput } from '@/masterComponents/PropertyM';

// Prevent the real backendConnector (createClient) from running at import time —
// this test only exercises the pure zod schema.
vi.mock('@/backendConnector/backendConnector', () => ({ backendConnector: {} }));

const validInput: PropertyInsertInput = {
  name: 'Apartament Centrum',
  address: 'ul. Marszałkowska 10, Warszawa',
  property_type: 'apartment',
  property_status: 'available',
  size_sqm: 45,
  bedrooms: 2,
  monthly_rent: 2500,
  deposit_amount: 5000,
  notes: 'Notatka serwisowa',
};

const parsed = (input: PropertyInsertInput) => propertyInsertSchema.safeParse(input);

const parsedData = (input: PropertyInsertInput) =>
  match(parsed(input))
    .with({ success: true }, ({ data }) => data)
    .with({ success: false }, () => null)
    .exhaustive();

const failureMessages = (input: PropertyInsertInput): ReadonlyArray<string> =>
  match(parsed(input))
    .with({ success: false }, ({ error }) => error.issues.map((issue) => issue.message))
    .with({ success: true }, () => [])
    .exhaustive();

describe('propertyInsertSchema', () => {
  it('accepts a valid payload', () => {
    expect(parsed(validInput).success).toBe(true);
  });

  it('trims surrounding whitespace on name and address', () => {
    const input = { ...validInput, name: '  Apartament  ', address: '  Warszawa  ' };
    expect(parsedData(input)?.name).toBe('Apartament');
    expect(parsedData(input)?.address).toBe('Warszawa');
  });

  it('allows null size_sqm, bedrooms and notes (optional fields)', () => {
    expect(parsed({ ...validInput, size_sqm: null, bedrooms: null, notes: null }).success).toBe(true);
  });

  it('allows a zero deposit_amount (DB CHECK permits >= 0)', () => {
    expect(parsed({ ...validInput, deposit_amount: 0 }).success).toBe(true);
  });

  it('rejects an empty (whitespace-only) name', () => {
    expect(failureMessages({ ...validInput, name: '   ' })).toContain('Nazwa jest wymagana');
  });

  it('rejects an empty address', () => {
    expect(failureMessages({ ...validInput, address: '' })).toContain('Adres jest wymagany');
  });

  it('rejects an invalid property_type', () => {
    expect(failureMessages({ ...validInput, property_type: 'castle' } as unknown as PropertyInsertInput)).toContain(
      'Nieprawidłowy typ nieruchomości',
    );
  });

  it('rejects an invalid property_status', () => {
    expect(failureMessages({ ...validInput, property_status: 'unknown' } as unknown as PropertyInsertInput)).toContain(
      'Nieprawidłowy status nieruchomości',
    );
  });

  it('rejects a negative monthly_rent', () => {
    expect(failureMessages({ ...validInput, monthly_rent: -100 })).toContain('Czynsz musi być większy od zera');
  });

  it('rejects a zero monthly_rent', () => {
    expect(failureMessages({ ...validInput, monthly_rent: 0 })).toContain('Czynsz musi być większy od zera');
  });

  it('rejects a NaN monthly_rent (from a failed Number() coercion)', () => {
    expect(failureMessages({ ...validInput, monthly_rent: Number.NaN })).toContain('Czynsz musi być liczbą');
  });

  it('rejects a non-integer bedrooms value', () => {
    expect(failureMessages({ ...validInput, bedrooms: 2.5 })).toContain(
      'Liczba sypialni musi być liczbą całkowitą',
    );
  });

  it('rejects a negative bedrooms value', () => {
    expect(failureMessages({ ...validInput, bedrooms: -1 })).toContain('Liczba sypialni nie może być ujemna');
  });

  it('rejects a non-positive size_sqm', () => {
    expect(failureMessages({ ...validInput, size_sqm: 0 })).toContain('Powierzchnia musi być dodatnia');
  });
});