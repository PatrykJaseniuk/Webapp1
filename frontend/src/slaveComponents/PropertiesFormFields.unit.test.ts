import { describe, it, expect } from 'vitest';
import { TYPE_OPTIONS, STATUS_OPTIONS, extractPropertyInput } from './PropertiesFormFields';
import { emptyInput } from '@/masterComponents/PropertiesSingle';

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

// ──────────────────────────────────────────────────────────────
// extractPropertyInput
// ──────────────────────────────────────────────────────────────

describe('extractPropertyInput', () => {
  it('extracts name from FormData', () => {
    const fd = new FormData();
    fd.set('name', 'Test');
    expect(extractPropertyInput(fd).name).toBe('Test');
  });

  it('extracts address from FormData', () => {
    const fd = new FormData();
    fd.set('address', 'ul. Nowa 1');
    expect(extractPropertyInput(fd).address).toBe('ul. Nowa 1');
  });

  it('defaults name to empty string when missing', () => {
    expect(extractPropertyInput(new FormData()).name).toBe('');
  });

  it('defaults property_type to apartment when missing', () => {
    expect(extractPropertyInput(new FormData()).property_type).toBe('apartment');
  });

  it('defaults property_status to available when missing', () => {
    expect(extractPropertyInput(new FormData()).property_status).toBe('available');
  });

  it('parses monthly_rent as float', () => {
    const fd = new FormData();
    fd.set('monthly_rent', '1234.56');
    expect(extractPropertyInput(fd).monthly_rent).toBe(1234.56);
  });

  it('defaults monthly_rent to 0 when missing', () => {
    expect(extractPropertyInput(new FormData()).monthly_rent).toBe(0);
  });

  it('defaults monthly_rent to 0 for invalid input', () => {
    const fd = new FormData();
    fd.set('monthly_rent', 'abc');
    expect(extractPropertyInput(fd).monthly_rent).toBe(0);
  });

  it('returns null for size_sqm when empty', () => {
    expect(extractPropertyInput(new FormData()).size_sqm).toBeNull();
  });

  it('returns null for bedrooms when empty', () => {
    expect(extractPropertyInput(new FormData()).bedrooms).toBeNull();
  });

  it('returns null for notes when empty', () => {
    expect(extractPropertyInput(new FormData()).notes).toBeNull();
  });

  it('parses size_sqm as float', () => {
    const fd = new FormData();
    fd.set('size_sqm', '42.5');
    expect(extractPropertyInput(fd).size_sqm).toBe(42.5);
  });

  it('parses bedrooms as int', () => {
    const fd = new FormData();
    fd.set('bedrooms', '3');
    expect(extractPropertyInput(fd).bedrooms).toBe(3);
  });

  it('extracts notes from FormData', () => {
    const fd = new FormData();
    fd.set('notes', 'some note');
    expect(extractPropertyInput(fd).notes).toBe('some note');
  });
});