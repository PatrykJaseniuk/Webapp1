import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { AuthState } from '@/hooks/AuthContext';

// ──────────────────────────────────────────────────────────────
// Mock backendConnector — controls the login I/O boundary
// ──────────────────────────────────────────────────────────────

const mockSignInWithPassword = vi.fn();

vi.mock('@/backendConnector/backendConnector', () => ({
  backendConnector: {
    auth: {
      signInWithPassword: (...args: readonly unknown[]) =>
        mockSignInWithPassword(...args),
    },
  },
}));

// ──────────────────────────────────────────────────────────────
// Mock useAuth — controls the authentication state
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
// Lazy import after mocks are set up
// ──────────────────────────────────────────────────────────────

const { LoginPage } = await import('./LoginP');

// ──────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────

describe('LoginPage (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ tag: 'unauthenticated' });
  });

  it('renders the login form for unauthenticated users', () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <LoginPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Zaloguj się')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Hasło')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zaloguj' })).toBeInTheDocument();
  });

  it('renders the signup link', () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <LoginPage />
      </MemoryRouter>,
    );

    const signupLink = screen.getByText('Zarejestruj się');
    expect(signupLink).toBeInTheDocument();
    expect(signupLink.closest('a')).toHaveAttribute('href', '/signup');
  });

  it('calls signInWithPassword on form submit', async () => {
    mockSignInWithPassword.mockResolvedValue({ data: {}, error: null });

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <LoginPage />
      </MemoryRouter>,
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Hasło'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Zaloguj' }));

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('displays an error message when login fails with a Supabase error', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: {},
      error: { message: 'Invalid login credentials' },
    });

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <LoginPage />
      </MemoryRouter>,
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Email'), 'bad@example.com');
    await user.type(screen.getByLabelText('Hasło'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Zaloguj' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid login credentials')).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    // Delay the response so we can observe the loading state
    mockSignInWithPassword.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: {}, error: null }), 100)),
    );

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <LoginPage />
      </MemoryRouter>,
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Hasło'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Zaloguj' }));

    // Button should show loading text while request is in flight
    const button = screen.getByRole('button', { name: 'Przetwarzanie...' });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it('shows LoadingSpinner when auth state is loading', () => {
    mockUseAuth.mockReturnValue({ tag: 'loading' });

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <LoginPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });
});