import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouterProvider } from '@/test-router-utils';
import { AuthorisationGuard } from './RoleGuardM';
import type { AuthoriseRequirement, AccessGateSlaveProps } from './RoleGuardM';
import type { AuthState } from '@/hooks/AuthContext';
import type { ComponentType } from 'react';
import { match } from 'ts-pattern';

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

const Content = <p>Authorised Content</p>;

const MockAccessGate: ComponentType<AccessGateSlaveProps> = ({
  asyncData,
  children,
}: AccessGateSlaveProps): JSX.Element => (
  <div>
    {match(asyncData)
      .with({ tag: 'pending' }, () => <span>Loading…</span>)
      .with({ tag: 'fulfilled' }, ({ data }) =>
        data.isAuthorised ?
          <>{children}</> :
          <span>Access Denied</span>)
      .with({ tag: 'rejected' }, ({ message }) => <span>{message}</span>)
      .exhaustive()}
  </div>
);

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

    it('renders loading via Slave', () => {
      const req: AuthoriseRequirement = { isAuthenticated: true, roles: ['admin'] };

      render(
        <MemoryRouterProvider>
          <AuthorisationGuard
            authoriseRequirement={req}
            Slave={MockAccessGate}
          >
            {Content}
          </AuthorisationGuard>
        </MemoryRouterProvider>,
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
        <MemoryRouterProvider>
          <AuthorisationGuard
            authoriseRequirement={req}
            Slave={MockAccessGate}
          >
            {Content}
          </AuthorisationGuard>
        </MemoryRouterProvider>,
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
        <MemoryRouterProvider>
          <AuthorisationGuard
            authoriseRequirement={req}
            Slave={MockAccessGate}
          >
            {Content}
          </AuthorisationGuard>
        </MemoryRouterProvider>,
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
        <MemoryRouterProvider>
          <AuthorisationGuard
            authoriseRequirement={req}
            Slave={MockAccessGate}
          >
            {Content}
          </AuthorisationGuard>
        </MemoryRouterProvider>,
      );

      expect(screen.getByText('Authorised Content')).toBeInTheDocument();
    });

    it('renders AccessDenied when user lacks required role', () => {
      mockUseAuth.mockReturnValue({
        tag: 'authenticated',
        userId: 'u2',
        email: 'tenant@test.com',
        role: 'tenant',
      });

      render(
        <MemoryRouterProvider>
          <AuthorisationGuard
            authoriseRequirement={req}
            Slave={MockAccessGate}
          >
            {Content}
          </AuthorisationGuard>
        </MemoryRouterProvider>,
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.queryByText('Authorised Content')).not.toBeInTheDocument();
    });

    it('renders AccessDenied when user is unauthenticated', () => {
      mockUseAuth.mockReturnValue({ tag: 'unauthenticated' });

      render(
        <MemoryRouterProvider>
          <AuthorisationGuard
            authoriseRequirement={req}
            Slave={MockAccessGate}
          >
            {Content}
          </AuthorisationGuard>
        </MemoryRouterProvider>,
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });
  });
});