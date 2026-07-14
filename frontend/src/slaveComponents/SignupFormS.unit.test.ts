import { describe, it, expect } from 'vitest';
import { extractSignupInput } from './SignupFormS';
import type { SignupInput } from '@/masterComponents/SignupM';

// ──────────────────────────────────────────────────────────────
// extractSignupInput
// ──────────────────────────────────────────────────────────────

const makeFormData = (entries: Readonly<Record<string, string>>): FormData => {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    fd.append(key, value);
  }
  return fd;
};

describe('extractSignupInput', () => {
  it('extracts all four fields from valid FormData', () => {
    const formData = makeFormData({
      email: 'test@example.com',
      password: 'secret123',
      firstName: 'Jan',
      lastName: 'Kowalski',
    });
    const result: SignupInput = extractSignupInput(formData);

    expect(result.email).toBe('test@example.com');
    expect(result.password).toBe('secret123');
    expect(result.firstName).toBe('Jan');
    expect(result.lastName).toBe('Kowalski');
  });

  it('coerces missing email to empty string', () => {
    const formData = makeFormData({
      password: 'secret123',
      firstName: 'Jan',
      lastName: 'Kowalski',
    });
    const result: SignupInput = extractSignupInput(formData);

    expect(result.email).toBe('');
    expect(result.password).toBe('secret123');
    expect(result.firstName).toBe('Jan');
    expect(result.lastName).toBe('Kowalski');
  });

  it('coerces missing password to empty string', () => {
    const formData = makeFormData({
      email: 'test@example.com',
      firstName: 'Anna',
      lastName: 'Nowak',
    });
    const result: SignupInput = extractSignupInput(formData);

    expect(result.email).toBe('test@example.com');
    expect(result.password).toBe('');
    expect(result.firstName).toBe('Anna');
    expect(result.lastName).toBe('Nowak');
  });

  it('coerces missing firstName to empty string', () => {
    const formData = makeFormData({
      email: 'test@example.com',
      password: 'secret123',
      lastName: 'Kowalski',
    });
    const result: SignupInput = extractSignupInput(formData);

    expect(result.email).toBe('test@example.com');
    expect(result.password).toBe('secret123');
    expect(result.firstName).toBe('');
    expect(result.lastName).toBe('Kowalski');
  });

  it('coerces missing lastName to empty string', () => {
    const formData = makeFormData({
      email: 'test@example.com',
      password: 'secret123',
      firstName: 'Jan',
    });
    const result: SignupInput = extractSignupInput(formData);

    expect(result.email).toBe('test@example.com');
    expect(result.password).toBe('secret123');
    expect(result.firstName).toBe('Jan');
    expect(result.lastName).toBe('');
  });

  it('returns empty strings when FormData is empty', () => {
    const formData = new FormData();
    const result: SignupInput = extractSignupInput(formData);

    expect(result.email).toBe('');
    expect(result.password).toBe('');
    expect(result.firstName).toBe('');
    expect(result.lastName).toBe('');
  });

  it('does not include any extra fields', () => {
    const formData = makeFormData({
      email: 'a@b.com',
      password: 'pw',
      firstName: 'F',
      lastName: 'L',
      extra: 'should-not-appear',
    });
    const result: SignupInput = extractSignupInput(formData);

    const keys = Object.keys(result);
    expect(keys).toHaveLength(4);
    expect(keys).toContain('email');
    expect(keys).toContain('password');
    expect(keys).toContain('firstName');
    expect(keys).toContain('lastName');
  });
});