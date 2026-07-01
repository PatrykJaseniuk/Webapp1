import { describe, it, expect } from 'vitest';
import { STATUS_LABEL, TYPE_LABEL } from './PropertiesTable';

// ──────────────────────────────────────────────────────────────
// STATUS_LABEL
// ──────────────────────────────────────────────────────────────

describe('STATUS_LABEL', () => {
  it('maps available to Dostępna', () => {
    expect(STATUS_LABEL.available).toBe('Dostępna');
  });

  it('maps occupied to Zajęta', () => {
    expect(STATUS_LABEL.occupied).toBe('Zajęta');
  });

  it('maps inactive to Nieaktywna', () => {
    expect(STATUS_LABEL.inactive).toBe('Nieaktywna');
  });

  it('has exactly 3 entries', () => {
    expect(Object.keys(STATUS_LABEL)).toHaveLength(3);
  });

  it('is frozen', () => {
    expect(Object.isFrozen(STATUS_LABEL)).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────
// TYPE_LABEL
// ──────────────────────────────────────────────────────────────

describe('TYPE_LABEL', () => {
  it('maps apartment to Mieszkanie', () => {
    expect(TYPE_LABEL.apartment).toBe('Mieszkanie');
  });

  it('maps house to Dom', () => {
    expect(TYPE_LABEL.house).toBe('Dom');
  });

  it('maps commercial to Lokal', () => {
    expect(TYPE_LABEL.commercial).toBe('Lokal');
  });

  it('maps room to Pokój', () => {
    expect(TYPE_LABEL.room).toBe('Pokój');
  });

  it('has exactly 4 entries', () => {
    expect(Object.keys(TYPE_LABEL)).toHaveLength(4);
  });

  it('is frozen', () => {
    expect(Object.isFrozen(TYPE_LABEL)).toBe(true);
  });
});