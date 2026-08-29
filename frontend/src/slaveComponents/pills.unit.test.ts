import { describe, it, expect } from 'vitest';
import { amountClass, balanceGlyph, balanceToneClass } from './pills';

// A movement (amount) and a state (balance) are presented differently on
// purpose: the amount is colour-graded per row, the balance is only sign-marked.
// Both must remain readable without colour.

describe('amountClass', () => {
  it('marks an inflow green', () => {
    expect(amountClass(2500)).toContain('text-green-700');
  });

  it('marks an outflow red', () => {
    expect(amountClass(-2500)).toContain('text-red-700');
  });

  it('treats zero as non-negative', () => {
    expect(amountClass(0)).toContain('text-green-700');
  });
});

describe('balanceGlyph', () => {
  it('marks a negative balance with a down glyph', () => {
    expect(balanceGlyph(-1200)).toBe('▼');
  });

  it('marks a positive balance with an up glyph', () => {
    expect(balanceGlyph(1200)).toBe('▲');
  });

  it('marks a zero balance with a neutral glyph', () => {
    expect(balanceGlyph(0)).toBe('–');
  });

  it('gives every sign a DISTINCT glyph, so colour is never the only signal', () => {
    const glyphs = [balanceGlyph(-1), balanceGlyph(0), balanceGlyph(1)];
    expect(new Set(glyphs).size).toBe(3);
  });
});

describe('balanceToneClass', () => {
  it('tones a negative balance red', () => {
    expect(balanceToneClass(-1)).toBe('text-red-700');
  });

  it('tones a positive balance neutral-dark', () => {
    expect(balanceToneClass(1)).toBe('text-gray-900');
  });

  it('tones a zero balance muted', () => {
    expect(balanceToneClass(0)).toBe('text-gray-500');
  });
});
