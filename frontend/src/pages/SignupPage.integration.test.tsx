import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouterProvider } from '@/test-router-utils';
import type { AuthState } from '@/hooks/AuthContext';

// ──────────────────────────────────────────────────────────────
// Mock backendConnector — controls the signup I/O boundary
// ──────────────────────────────────────────────────────────────

const mockSignUp = vi.fn();

vi.mock('@/backendConnector/backendConnector', () => ({
  backendConnector: {
    auth: {
      signUp: (...args: readonly unknown[]) =>
        mockSignUp(...args),
    },
  },
}));

// ──────────────────────────────────────────────────────────────
// Mock useAuth — controls the authentication state
// ──────────────────────────────────────────────────────────────

const mockUseAuth = vi.fn<() => AuthState>();

import type * as AuthContextModule from '@/hooks/AuthContext';

vi.mock('@/hooks/AuthContext', async () => {
  const actual = await vi.importActual<typeof AuthContextModule>('@/hooks/AuthContext');
  return {
    ...actual,
    useAuth: () => mockUseAuth(),
  };
});

// ──────────────────────────────────────────────────────────────
// Lazy import after mocks are set up
// ──────────────────────────────────────────────────────────────

const { SignupPage } = await import('./SignupP');

// ──────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────

describe('SignupPage (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ tag: 'unauthenticated' });
  });

  it('renders the signup form for unauthenticated users', () => {
    render(
      <MemoryRouterProvider>
        <SignupPage />
      </MemoryRouterProvider>,
    );

    expect(screen.getByText('Zarejestruj się')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Hasło')).toBeInTheDocument();
    expect(screen.getByLabelText('Imię')).toBeInTheDocument();
    expect(screen.getByLabelText('Nazwisko')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zarejestruj' })).toBeInTheDocument();
  });

  it('renders the login link', () => {
    render(
      <MemoryRouterProvider>
        <SignupPage />
      </MemoryRouterProvider>,
    );

    const loginLink = screen.getByText('Zaloguj się');
    expect(loginLink).toBeInTheDocument();
    expect(loginLink.closest('a')).toHaveAttribute('href', '/login');
  });

  it('calls signUp with correct payload on form submit', async () => {
    mockSignUp.mockResolvedValue({ data: {}, error: null });

    render(
      <MemoryRouterProvider>
        <SignupPage />
      </MemoryRouterProvider>,
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Email'), 'new@example.com');
    await user.type(screen.getByLabelText('Hasło'), 'secure123');
    await user.type(screen.getByLabelText('Imię'), 'Jan');
    await user.type(screen.getByLabelText('Nazwisko'), 'Kowalski');
    await user.click(screen.getByRole('button', { name: 'Zarejestruj' }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'secure123',
        options: {
          data: {
            first_name: 'Jan',
            last_name: 'Kowalski',
          },
        },
      });
    });
  });

  it('displays an error message when signup fails', async () => {
    mockSignUp.mockResolvedValue({
      data: {},
      error: { message: 'User already registered' },
    });

    render(
      <MemoryRouterProvider>
        <SignupPage />
      </MemoryRouterProvider>,
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Email'), 'exists@example.com');
    await user.type(screen.getByLabelText('Hasło'), 'password123');
    await user.type(screen.getByLabelText('Imię'), 'Anna');
    await user.type(screen.getByLabelText('Nazwisko'), 'Nowak');
    await user.click(screen.getByRole('button', { name: 'Zarejestruj' }));

    await waitFor(() => {
      expect(screen.getByText('User already registered')).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    mockSignUp.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: {}, error: null }), 100)),
    );

    render(
      <MemoryRouterProvider>
        <SignupPage />
      </MemoryRouterProvider>,
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Email'), 'new@example.com');
    await user.type(screen.getByLabelText('Hasło'), 'secure123');
    await user.type(screen.getByLabelText('Imię'), 'Jan');
    await user.type(screen.getByLabelText('Nazwisko'), 'Kowalski');
    await user.click(screen.getByRole('button', { name: 'Zarejestruj' }));

    const button = screen.getByRole('button', { name: 'Przetwarzanie...' });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it('shows LoadingSpinner when auth state is loading', () => {
    mockUseAuth.mockReturnValue({ tag: 'loading' });

    render(
      <MemoryRouterProvider>
        <SignupPage />
      </MemoryRouterProvider>,
    );

    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });
});