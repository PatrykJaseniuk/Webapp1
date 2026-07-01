import { describe, it, expect } from 'vitest';
import { extractLoginInput } from './LoginForm';
import type { LoginInput } from '@/masterComponents/Login';

// ──────────────────────────────────────────────────────────────
// extractLoginInput
// ──────────────────────────────────────────────────────────────

const makeFormData = (entries: Readonly<Record<string, string>>): FormData => {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    fd.append(key, value);
  }
  return fd;
};

describe('extractLoginInput', () => {
  it('extracts email and password from valid FormData', () => {
    const formData = makeFormData({ email: 'test@example.com', password: 'secret123' });
    const result: LoginInput = extractLoginInput(formData);

    expect(result.email).toBe('test@example.com');
    expect(result.password).toBe('secret123');
  });

  it('coerces missing email to empty string', () => {
    const formData = makeFormData({ password: 'secret123' });
    const result: LoginInput = extractLoginInput(formData);

    expect(result.email).toBe('');
    expect(result.password).toBe('secret123');
  });

  it('coerces missing password to empty string', () => {
    const formData = makeFormData({ email: 'test@example.com' });
    const result: LoginInput = extractLoginInput(formData);

    expect(result.email).toBe('test@example.com');
    expect(result.password).toBe('');
  });

  it('returns empty strings when FormData is empty', () => {
    const formData = new FormData();
    const result: LoginInput = extractLoginInput(formData);

    expect(result.email).toBe('');
    expect(result.password).toBe('');
  });

  it('does not include any extra fields', () => {
    const formData = makeFormData({ email: 'a@b.com', password: 'pw', extra: 'should-not-appear' });
    const result: LoginInput = extractLoginInput(formData);

    const keys = Object.keys(result);
    expect(keys).toHaveLength(2);
    expect(keys).toContain('email');
    expect(keys).toContain('password');
  });
});