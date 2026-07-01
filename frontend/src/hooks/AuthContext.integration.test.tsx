import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

const b64url = (payload: string): string =>
  btoa(payload).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const makeToken = (payload: Record<string, unknown>): string => {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify(payload));
  return `${header}.${body}.signature`;
};

// ═══════════════════════════════════════════════════════════════
// Mock backendConnector
// ═══════════════════════════════════════════════════════════════

const mockUnsubscribe = vi.fn();
const mockOnAuthStateChange = vi.fn();

const mockGetSession = vi.fn();

vi.mock('@/backendConnector/backendConnector', () => ({
  backendConnector: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: (cb: () => void) => {
        mockOnAuthStateChange(cb);
        return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
      },
    },
  },
}));

// ═══════════════════════════════════════════════════════════════
// Test helpers
// ═══════════════════════════════════════════════════════════════

const Child = () => {
  const auth = useAuth();
  const text =
    auth.tag === 'loading' ?
      'loading' :
    auth.tag === 'authenticated' ?
      `${auth.tag}|${auth.role}|${auth.email}` :
      'unauthenticated';
  return <span role="status">{text}</span>;
};

const renderProvider = () =>
  render(
    <AuthProvider>
      <Child />
    </AuthProvider>,
  );

// ═══════════════════════════════════════════════════════════════
// AuthProvider — integration tests
// ═══════════════════════════════════════════════════════════════

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockReset();
    mockOnAuthStateChange.mockReset();
    mockUnsubscribe.mockReset();
  });

  it('renders loading state initially', async () => {
    // Never resolve getSession so we stay in loading
    mockGetSession.mockReturnValue(new Promise(() => {}));

    renderProvider();

    await screen.findByText('loading');
  });

  it('renders authenticated state when session exists', async () => {
    const token = makeToken({ user_role: 'admin' });
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: { id: 'user-1', email: 'admin@test.com' },
          access_token: token,
        },
      },
    });

    renderProvider();

    await screen.findByText(/authenticated\|admin\|admin@test\.com/);
  });

  it('renders unauthenticated state when session is null', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    renderProvider();

    await screen.findByText('unauthenticated');
  });

  it('renders unauthenticated state when session is missing entirely', async () => {
    mockGetSession.mockResolvedValue({ data: {} });

    renderProvider();

    await screen.findByText('unauthenticated');
  });

  it('updates state when onAuthStateChange fires', async () => {
    // Start unauthenticated
    mockGetSession.mockResolvedValue({ data: { session: null } });

    renderProvider();

    await screen.findByText('unauthenticated');

    // Simulate auth change — next getSession returns a session
    const token = makeToken({ user_role: 'landlord' });
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: { id: 'user-2', email: 'landlord@test.com' },
          access_token: token,
        },
      },
    });

    // The onAuthStateChange callback should have been registered
    const changeCallback = mockOnAuthStateChange.mock.calls[0]?.[0] as
      | (() => void)
      | undefined;

    expect(changeCallback).toBeDefined();

    // Trigger it and wait for re-render — wrap in act to batch state updates
    act(() => {
      changeCallback!();
    });
    // getSession is called again inside fetchAuth — it's async, so we wait
    await screen.findByText(/authenticated\|landlord\|landlord@test\.com/);
  });

  it('unsubscribes on unmount', () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    const { unmount } = renderProvider();
    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledOnce();
  });
});

// ═══════════════════════════════════════════════════════════════
// useAuth — edge cases
// ═══════════════════════════════════════════════════════════════

describe('useAuth', () => {
  it('returns loading when used outside AuthProvider', () => {
    const Outside = () => {
      const auth = useAuth();
      return <span role="status">{auth.tag}</span>;
    };

    render(<Outside />);

    expect(screen.getByRole('status').textContent).toBe('loading');
  });

  it('returns authenticated state when inside auth provider with session', async () => {
    vi.clearAllMocks();
    const token = makeToken({ user_role: 'tenant' });
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: { id: 'u3', email: 'tenant@test.com' },
          access_token: token,
        },
      },
    });

    const Inside = () => {
      const auth = useAuth();
      return (
        <span role="status">
          {auth.tag === 'authenticated' ? `ok|${auth.role}` : 'not-ok'}
        </span>
      );
    };

    render(
      <AuthProvider>
        <Inside />
      </AuthProvider>,
    );

    await screen.findByText('ok|tenant');
  });
});