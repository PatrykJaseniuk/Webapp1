import { describe, it, expect } from 'vitest';
import { computeAuthorisation } from './RoleGuard';
import type { AuthoriseRequirement } from './RoleGuard';
import type { AuthState, AppRole } from '@/hooks/AuthContext';

// ──────────────────────────────────────────────────────────────
// computeAuthorisation
// ──────────────────────────────────────────────────────────────

describe('computeAuthorisation', () => {
  const role: AppRole = 'tenant';

  describe('public page (isAuthenticated: false)', () => {
    const req: AuthoriseRequirement = { isAuthenticated: false };

    it('grants access when loading', () => {
      const authState: AuthState = { tag: 'loading' };
      expect(computeAuthorisation(authState, req)).toBe(true);
    });

    it('grants access when unauthenticated', () => {
      const authState: AuthState = { tag: 'unauthenticated' };
      expect(computeAuthorisation(authState, req)).toBe(true);
    });

    it('grants access when authenticated', () => {
      const authState: AuthState = {
        tag: 'authenticated',
        userId: 'user-1',
        email: 'a@b.com',
        role,
      };
      expect(computeAuthorisation(authState, req)).toBe(true);
    });
  });

  describe('protected page (isAuthenticated: true)', () => {
    const req: AuthoriseRequirement = {
      isAuthenticated: true,
      roles: [role],
    };

    it('denies access when loading', () => {
      const authState: AuthState = { tag: 'loading' };
      expect(computeAuthorisation(authState, req)).toBe(false);
    });

    it('denies access when unauthenticated', () => {
      const authState: AuthState = { tag: 'unauthenticated' };
      expect(computeAuthorisation(authState, req)).toBe(false);
    });

    it('denies access when authenticated but role not in list', () => {
      const authState: AuthState = {
        tag: 'authenticated',
        userId: 'user-1',
        email: 'a@b.com',
        role: 'admin',
      };
      expect(computeAuthorisation(authState, req)).toBe(false);
    });

    it('grants access when authenticated and role in list', () => {
      const authState: AuthState = {
        tag: 'authenticated',
        userId: 'user-1',
        email: 'a@b.com',
        role,
      };
      expect(computeAuthorisation(authState, req)).toBe(true);
    });

    it('grants access for multiple roles when user matches one', () => {
      const multiReq: AuthoriseRequirement = {
        isAuthenticated: true,
        roles: ['admin', 'landlord', role],
      };
      const authState: AuthState = {
        tag: 'authenticated',
        userId: 'user-1',
        email: 'a@b.com',
        role,
      };
      expect(computeAuthorisation(authState, multiReq)).toBe(true);
    });
  });
});