import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthorisationGuard } from './RoleGuard';
import type { AuthoriseRequirement } from './RoleGuard';
import type { AuthState } from '@/hooks/AuthContext';

// ──────────────────────────────────────────────────────────────
// Mock useAuth
// ──────────────────────────────────────────────────────────────

const mockUseAuth = vi.fn<() => AuthState>();

vi.mock('@/hooks/AuthContext', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/AuthContext')>('@/hooks/AuthContext');
  return {
    ...actual,
    useAuth: () => mockUseAuth(),
  };
});

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

const Loading = <span>Loading…</span>;
const AccessDenied = <span>Access Denied</span>;
const Content = <p>Authorised Content</p>;

// ──────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────

describe('AuthorisationGuard (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when auth state is loading', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ tag: 'loading' });
    });

    it('renders LoadingComponent', () => {
      const req: AuthoriseRequirement = { isAuthenticated: true, roles: ['admin'] };

      render(
        <MemoryRouter>
          <AuthorisationGuard
            authoriseRequirement={req}
            LoadingComponent={Loading}
            AccessDeniedComponent={AccessDenied}
          >
            {Content}
          </AuthorisationGuard>
        </MemoryRouter>,
      );

      expect(screen.getByText('Loading…')).toBeInTheDocument();
      expect(screen.queryByText('Authorised Content')).not.toBeInTheDocument();
    });
  });

  describe('public page', () => {
    const req: AuthoriseRequirement = { isAuthenticated: false };

    it('renders children even when unauthenticated', () => {
      mockUseAuth.mockReturnValue({ tag: 'unauthenticated' });

      render(
        <MemoryRouter>
          <AuthorisationGuard
            authoriseRequirement={req}
            LoadingComponent={Loading}
            AccessDeniedComponent={AccessDenied}
          >
            {Content}
          </AuthorisationGuard>
        </MemoryRouter>,
      );

      expect(screen.getByText('Authorised Content')).toBeInTheDocument();
    });

    it('renders children when authenticated', () => {
      mockUseAuth.mockReturnValue({
        tag: 'authenticated',
        userId: 'u1',
        email: 'a@b.com',
        role: 'tenant',
      });

      render(
        <MemoryRouter>
          <AuthorisationGuard
            authoriseRequirement={req}
            LoadingComponent={Loading}
            AccessDeniedComponent={AccessDenied}
          >
            {Content}
          </AuthorisationGuard>
        </MemoryRouter>,
      );

      expect(screen.getByText('Authorised Content')).toBeInTheDocument();
    });
  });

  describe('protected page', () => {
    const req: AuthoriseRequirement = { isAuthenticated: true, roles: ['admin'] };

    it('renders children when user has required role', () => {
      mockUseAuth.mockReturnValue({
        tag: 'authenticated',
        userId: 'u1',
        email: 'admin@test.com',
        role: 'admin',
      });

      render(
        <MemoryRouter>
          <AuthorisationGuard
            authoriseRequirement={req}
            LoadingComponent={Loading}
            AccessDeniedComponent={AccessDenied}
          >
            {Content}
          </AuthorisationGuard>
        </MemoryRouter>,
      );

      expect(screen.getByText('Authorised Content')).toBeInTheDocument();
    });

    it('renders AccessDeniedComponent when user lacks required role', () => {
      mockUseAuth.mockReturnValue({
        tag: 'authenticated',
        userId: 'u2',
        email: 'tenant@test.com',
        role: 'tenant',
      });

      render(
        <MemoryRouter>
          <AuthorisationGuard
            authoriseRequirement={req}
            LoadingComponent={Loading}
            AccessDeniedComponent={AccessDenied}
          >
            {Content}
          </AuthorisationGuard>
        </MemoryRouter>,
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.queryByText('Authorised Content')).not.toBeInTheDocument();
    });

    it('renders AccessDeniedComponent when user is unauthenticated', () => {
      mockUseAuth.mockReturnValue({ tag: 'unauthenticated' });

      render(
        <MemoryRouter>
          <AuthorisationGuard
            authoriseRequirement={req}
            LoadingComponent={Loading}
            AccessDeniedComponent={AccessDenied}
          >
            {Content}
          </AuthorisationGuard>
        </MemoryRouter>,
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });
  });
});