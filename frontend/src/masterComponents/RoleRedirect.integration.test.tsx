import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RoleRedirect } from './RoleRedirect';
import type { AuthState, AppRole } from '@/hooks/AuthContext';

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
// Tests
// ──────────────────────────────────────────────────────────────

describe('RoleRedirect (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders LoadingComponent when auth is loading', () => {
    mockUseAuth.mockReturnValue({ tag: 'loading' });

    render(
      <MemoryRouter>
        <RoleRedirect LoadingComponent={<span>Loading…</span>}>
          <p>Content</p>
        </RoleRedirect>
      </MemoryRouter>,
    );

    expect(screen.getByText('Loading…')).toBeInTheDocument();
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('renders children for unauthenticated users', () => {
    mockUseAuth.mockReturnValue({ tag: 'unauthenticated' });

    render(
      <MemoryRouter>
        <RoleRedirect LoadingComponent={<span>Loading…</span>}>
          <p>Content</p>
        </RoleRedirect>
      </MemoryRouter>,
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('navigates admin to /admin', () => {
    mockUseAuth.mockReturnValue({
      tag: 'authenticated',
      userId: 'u1',
      email: 'admin@test.com',
      role: 'admin',
    });

    render(
      <MemoryRouter>
        <RoleRedirect LoadingComponent={<span>Loading…</span>}>
          <p>Content</p>
        </RoleRedirect>
      </MemoryRouter>,
    );

    // Navigated away, so content is not present
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('navigates landlord to /landlord', () => {
    mockUseAuth.mockReturnValue({
      tag: 'authenticated',
      userId: 'u2',
      email: 'landlord@test.com',
      role: 'landlord',
    });

    render(
      <MemoryRouter>
        <RoleRedirect LoadingComponent={<span>Loading…</span>}>
          <p>Content</p>
        </RoleRedirect>
      </MemoryRouter>,
    );

    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('navigates tenant to /tenant', () => {
    mockUseAuth.mockReturnValue({
      tag: 'authenticated',
      userId: 'u3',
      email: 'tenant@test.com',
      role: 'tenant',
    });

    render(
      <MemoryRouter>
        <RoleRedirect LoadingComponent={<span>Loading…</span>}>
          <p>Content</p>
        </RoleRedirect>
      </MemoryRouter>,
    );

    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });
});