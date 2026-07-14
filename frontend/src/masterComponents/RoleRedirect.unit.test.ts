import { describe, it, expect } from 'vitest';
import { DEFAULT_REDIRECT_MAP } from './RoleRedirectM';

// ──────────────────────────────────────────────────────────────
// DEFAULT_REDIRECT_MAP
// ──────────────────────────────────────────────────────────────

describe('DEFAULT_REDIRECT_MAP', () => {
  it('maps admin to /admin', () => {
    expect(DEFAULT_REDIRECT_MAP.admin).toBe('/admin');
  });

  it('maps landlord to /landlord', () => {
    expect(DEFAULT_REDIRECT_MAP.landlord).toBe('/landlord');
  });

  it('maps tenant to /tenant', () => {
    expect(DEFAULT_REDIRECT_MAP.tenant).toBe('/tenant');
  });

  it('has exactly 3 entries', () => {
    expect(Object.keys(DEFAULT_REDIRECT_MAP)).toHaveLength(3);
  });

  it('is frozen', () => {
    expect(Object.isFrozen(DEFAULT_REDIRECT_MAP)).toBe(true);
  });
});