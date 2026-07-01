import { describe, it, expect } from 'vitest';
import { parseSession } from './AuthContext';
import type { SessionLike } from './AuthContext';

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

const makeSession = (overrides?: Partial<SessionLike>): SessionLike => ({
  user: { id: 'user-1', email: 'test@example.com' },
  access_token: makeToken({ user_role: 'tenant' }),
  ...overrides,
});

// ═══════════════════════════════════════════════════════════════
// parseSession — pure function, zero mocking
// ═══════════════════════════════════════════════════════════════

describe('parseSession', () => {
  it('returns unauthenticated when session is null', () => {
    const result = parseSession(null);

    expect(result).toEqual({ tag: 'unauthenticated' });
  });

  it('parses admin role from JWT user_role claim', () => {
    const token = makeToken({ user_role: 'admin' });
    const session = makeSession({ access_token: token });

    const result = parseSession(session);

    expect(result).toEqual({
      tag: 'authenticated',
      userId: 'user-1',
      email: 'test@example.com',
      role: 'admin',
    });
  });

  it('parses landlord role from JWT user_role claim', () => {
    const token = makeToken({ user_role: 'landlord' });
    const session = makeSession({ access_token: token });

    const result = parseSession(session);

    expect(result).toEqual({
      tag: 'authenticated',
      userId: 'user-1',
      email: 'test@example.com',
      role: 'landlord',
    });
  });

  it('falls back to tenant for any other user_role value', () => {
    const token = makeToken({ user_role: 'some_unknown_role' });
    const session = makeSession({ access_token: token });

    const result = parseSession(session);

    expect(result).toEqual({
      tag: 'authenticated',
      userId: 'user-1',
      email: 'test@example.com',
      role: 'tenant',
    });
  });

  it('defaults to tenant when user_role is missing from JWT', () => {
    const token = makeToken({ sub: 'abc' });
    const session = makeSession({ access_token: token });

    const result = parseSession(session);

    expect(result).toEqual({
      tag: 'authenticated',
      userId: 'user-1',
      email: 'test@example.com',
      role: 'tenant',
    });
  });

  it('coerces null email to empty string', () => {
    const session = makeSession({ user: { id: 'user-1', email: null } });

    const result = parseSession(session);

    expect(result).toEqual({
      tag: 'authenticated',
      userId: 'user-1',
      email: '',
      role: 'tenant',
    });
  });

  it('preserves a present email', () => {
    const session = makeSession({ user: { id: 'user-1', email: 'alice@example.com' } });

    const result = parseSession(session);

    expect(result).toEqual({
      tag: 'authenticated',
      userId: 'user-1',
      email: 'alice@example.com',
      role: 'tenant',
    });
  });

  it('reads userId from session.user.id', () => {
    const session = makeSession({ user: { id: 'abc-123', email: 'x@y.com' } });

    const result = parseSession(session);

    expect(result.tag === 'authenticated' && result.userId).toBe('abc-123');
  });
});