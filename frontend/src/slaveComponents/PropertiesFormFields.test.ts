import { describe, it, expect } from 'vitest';
import { toInput, emptyInput, TYPE_OPTIONS, STATUS_OPTIONS } from './PropertiesFormFields';
import type { Database } from '@/backendConnector';

type PropertyRow = Database['public']['Tables']['properties']['Row'];

// ──────────────────────────────────────────────────────────────
// Test helpers — construct a minimal PropertyRow
// ──────────────────────────────────────────────────────────────

const makeRow = (overrides?: Partial<PropertyRow>): PropertyRow => ({
  id: 'prop-1',
  name: 'Test Property',
  address: 'ul. Testowa 1',
  property_type: 'apartment',
  property_status: 'available',
  monthly_rent: 2000,
  deposit_amount: 4000,
  size_sqm: 50.5,
  bedrooms: 2,
  notes: null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  created_by: 'user-1',
  ...overrides,
});

// ──────────────────────────────────────────────────────────────
// emptyInput
// ──────────────────────────────────────────────────────────────

describe('emptyInput', () => {
  it('has name as empty string', () => {
    expect(emptyInput.name).toBe('');
  });

  it('has address as empty string', () => {
    expect(emptyInput.address).toBe('');
  });

  it('has property_type as apartment', () => {
    expect(emptyInput.property_type).toBe('apartment');
  });

  it('has property_status as available', () => {
    expect(emptyInput.property_status).toBe('available');
  });

  it('has monthly_rent as 0', () => {
    expect(emptyInput.monthly_rent).toBe(0);
  });

  it('has deposit_amount as 0', () => {
    expect(emptyInput.deposit_amount).toBe(0);
  });

  it('has size_sqm as null', () => {
    expect(emptyInput.size_sqm).toBeNull();
  });

  it('has bedrooms as null', () => {
    expect(emptyInput.bedrooms).toBeNull();
  });

  it('has notes as null', () => {
    expect(emptyInput.notes).toBeNull();
  });

  it('is frozen (immutable)', () => {
    expect(Object.isFrozen(emptyInput)).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────
// toInput
// ──────────────────────────────────────────────────────────────

describe('toInput', () => {
  it('maps name from row', () => {
    const row = makeRow({ name: 'Mieszkanie Centrum' });
    expect(toInput(row).name).toBe('Mieszkanie Centrum');
  });

  it('maps address from row', () => {
    const row = makeRow({ address: 'Rynek 5' });
    expect(toInput(row).address).toBe('Rynek 5');
  });

  it('maps property_type from row', () => {
    const row = makeRow({ property_type: 'house' });
    expect(toInput(row).property_type).toBe('house');
  });

  it('maps property_status from row', () => {
    const row = makeRow({ property_status: 'occupied' });
    expect(toInput(row).property_status).toBe('occupied');
  });

  it('maps monthly_rent from row', () => {
    const row = makeRow({ monthly_rent: 3500 });
    expect(toInput(row).monthly_rent).toBe(3500);
  });

  it('maps deposit_amount from row', () => {
    const row = makeRow({ deposit_amount: 7000 });
    expect(toInput(row).deposit_amount).toBe(7000);
  });

  it('maps size_sqm from row (non-null)', () => {
    const row = makeRow({ size_sqm: 75.25 });
    expect(toInput(row).size_sqm).toBe(75.25);
  });

  it('maps size_sqm as null when row has null', () => {
    const row = makeRow({ size_sqm: null });
    expect(toInput(row).size_sqm).toBeNull();
  });

  it('maps bedrooms from row (non-null)', () => {
    const row = makeRow({ bedrooms: 3 });
    expect(toInput(row).bedrooms).toBe(3);
  });

  it('maps bedrooms as null when row has null', () => {
    const row = makeRow({ bedrooms: null });
    expect(toInput(row).bedrooms).toBeNull();
  });

  it('maps notes from row', () => {
    const row = makeRow({ notes: 'close to metro' });
    expect(toInput(row).notes).toBe('close to metro');
  });

  it('maps notes as null when row has null', () => {
    const row = makeRow({ notes: null });
    expect(toInput(row).notes).toBeNull();
  });

  it('does not include created_at, updated_at, created_by, id', () => {
    const row = makeRow();
    const input = toInput(row);
    expect('created_at' in input).toBe(false);
    expect('updated_at' in input).toBe(false);
    expect('created_by' in input).toBe(false);
    expect('id' in input).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────
// TYPE_OPTIONS
// ──────────────────────────────────────────────────────────────

describe('TYPE_OPTIONS', () => {
  it('maps apartment to Mieszkanie', () => {
    expect(TYPE_OPTIONS.apartment).toBe('Mieszkanie');
  });

  it('maps house to Dom', () => {
    expect(TYPE_OPTIONS.house).toBe('Dom');
  });

  it('maps commercial to Lokal', () => {
    expect(TYPE_OPTIONS.commercial).toBe('Lokal');
  });

  it('maps room to Pokój', () => {
    expect(TYPE_OPTIONS.room).toBe('Pokój');
  });

  it('has exactly 4 entries', () => {
    expect(Object.keys(TYPE_OPTIONS)).toHaveLength(4);
  });

  it('is frozen', () => {
    expect(Object.isFrozen(TYPE_OPTIONS)).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────
// STATUS_OPTIONS
// ──────────────────────────────────────────────────────────────

describe('STATUS_OPTIONS', () => {
  it('maps available to Dostępna', () => {
    expect(STATUS_OPTIONS.available).toBe('Dostępna');
  });

  it('maps occupied to Zajęta', () => {
    expect(STATUS_OPTIONS.occupied).toBe('Zajęta');
  });

  it('maps inactive to Nieaktywna', () => {
    expect(STATUS_OPTIONS.inactive).toBe('Nieaktywna');
  });

  it('has exactly 3 entries', () => {
    expect(Object.keys(STATUS_OPTIONS)).toHaveLength(3);
  });

  it('is frozen', () => {
    expect(Object.isFrozen(STATUS_OPTIONS)).toBe(true);
  });
});