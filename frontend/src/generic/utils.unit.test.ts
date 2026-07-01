import { describe, it, expect } from 'vitest';
import { ok, err } from './utils';
import type { Result, AppError, AsyncState } from './utils';
import {
  formIdle,
  formEditing,
  formSubmitting,
  formSuccess,
  formError,
  setField,
} from './form';
import type { FormState } from './form';

// ──────────────────────────────────────────────────────────────
// Result
// ──────────────────────────────────────────────────────────────

describe('Result', () => {
  it('ok produces a success Result', () => {
    const result: Result<number, AppError> = ok(42);

    expect(result.tag).toBe('ok');
    expect(result.tag === 'ok' ? result.value : 0).toBe(42);
  });

  it('err produces an error Result', () => {
    const result: Result<number, AppError> = err({
      tag: 'NotFound',
      resource: 'user/1',
    });

    expect(result.tag).toBe('err');
    const error = result.tag === 'err' ? result.error : { tag: 'NotFound' as const, resource: '' };
    expect(error.tag).toBe('NotFound');
    const resource = error.tag === 'NotFound' ? error.resource : '';
    expect(resource).toBe('user/1');
  });
});

// ──────────────────────────────────────────────────────────────
// AppError discriminated union
// ──────────────────────────────────────────────────────────────

describe('AppError', () => {
  it('NetworkError carries a message', () => {
    const error: AppError = { tag: 'NetworkError', message: 'timeout' };

    expect(error.tag).toBe('NetworkError');
    expect(error.message).toBe('timeout');
  });

  it('NotFound carries the resource name', () => {
    const error: AppError = { tag: 'NotFound', resource: 'property/7' };

    expect(error.resource).toBe('property/7');
  });

  it('Unauthorized is tag-only', () => {
    const error: AppError = { tag: 'Unauthorized' };

    expect(error.tag).toBe('Unauthorized');
  });

  it('Forbidden is tag-only', () => {
    const error: AppError = { tag: 'Forbidden' };

    expect(error.tag).toBe('Forbidden');
  });

  it('ValidationError carries a message', () => {
    const error: AppError = { tag: 'ValidationError', message: 'email required' };

    expect(error.message).toBe('email required');
  });
});

// ──────────────────────────────────────────────────────────────
// AsyncState discriminated union
// ──────────────────────────────────────────────────────────────

describe('AsyncState', () => {
  it('idle state has no data', () => {
    const state: AsyncState<string> = { tag: 'idle' };

    expect(state.tag).toBe('idle');
  });

  it('loading state has no data', () => {
    const state: AsyncState<string> = { tag: 'loading' };

    expect(state.tag).toBe('loading');
  });

  it('success state carries data', () => {
    const state: AsyncState<string> = { tag: 'success', data: 'hello' };

    expect(state.tag).toBe('success');
    expect(state.tag === 'success' ? state.data : '').toBe('hello');
  });

  it('error state carries an AppError', () => {
    const state: AsyncState<string> = {
      tag: 'error',
      error: { tag: 'NetworkError', message: 'failed' },
    };

    expect(state.tag).toBe('error');
    expect(state.error.tag).toBe('NetworkError');
  });
});

// ──────────────────────────────────────────────────────────────
// FormState smart constructors
// ──────────────────────────────────────────────────────────────

type TestData = Readonly<{ name: string; age: number }>;

describe('FormState', () => {
  it('formIdle returns idle state', () => {
    const state: FormState<TestData> = formIdle();

    expect(state.tag).toBe('idle');
  });

  it('formEditing returns editing state with data', () => {
    const data: TestData = { name: 'Alice', age: 30 };
    const state: FormState<TestData> = formEditing(data);

    expect(state.tag).toBe('editing');
    expect(state.tag === 'editing' ? state.data : { name: '', age: 0 }).toEqual(data);
  });

  it('formSubmitting returns submitting state with data', () => {
    const data: TestData = { name: 'Bob', age: 25 };
    const state: FormState<TestData> = formSubmitting(data);

    expect(state.tag).toBe('submitting');
    expect(state.tag === 'submitting' ? state.data.name : '').toBe('Bob');
  });

  it('formSuccess returns success state with data', () => {
    const data: TestData = { name: 'Eve', age: 22 };
    const state: FormState<TestData> = formSuccess(data);

    expect(state.tag).toBe('success');
    expect(state.tag === 'success' ? state.data.age : 0).toBe(22);
  });

  it('formError returns error state with data and message', () => {
    const data: TestData = { name: 'Mallory', age: 40 };
    const state: FormState<TestData> = formError(data, 'invalid name');

    expect(state.tag).toBe('error');
    expect(state.tag === 'error' ? state.message : '').toBe('invalid name');
    expect(state.tag === 'error' ? state.data.name : '').toBe('Mallory');
  });
});

// ──────────────────────────────────────────────────────────────
// setField
// ──────────────────────────────────────────────────────────────

describe('setField', () => {
  it('returns a new object with the updated field', () => {
    const original: TestData = { name: 'Alice', age: 30 };
    const updated = setField(original, 'age', 31);

    // new object
    expect(updated).not.toBe(original);
    // age is updated
    expect(updated.age).toBe(31);
    // name is unchanged
    expect(updated.name).toBe('Alice');
  });

  it('does not mutate the original object', () => {
    const original: TestData = { name: 'Bob', age: 25 };
    const before = { ...original };
    setField(original, 'name', 'Charlie');

    expect(original).toEqual(before);
  });
});