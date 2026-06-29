import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { setField, formIdle, formEditing, formSubmitting, formSuccess, formError } from './form';
import type { FormState } from './form';
import { ok, err } from './utils';
import type { Result, AppError } from './utils';

// ──────────────────────────────────────────────────────────────
// Arbitrary generators
// ──────────────────────────────────────────────────────────────

type TestData = Readonly<{ name: string; age: number }>;

const arbitraryTestData = fc.record<TestData>({
  name: fc.string(),
  age: fc.integer(),
});

const arbitraryAppError: fc.Arbitrary<AppError> = fc.oneof(
  fc.record<Extract<AppError, { readonly tag: 'NetworkError' }>>({
    tag: fc.constant('NetworkError' as const),
    message: fc.string(),
  }),
  fc.record<Extract<AppError, { readonly tag: 'NotFound' }>>({
    tag: fc.constant('NotFound' as const),
    resource: fc.string(),
  }),
  fc.constant<Extract<AppError, { readonly tag: 'Unauthorized' }>>({
    tag: 'Unauthorized',
  }),
  fc.constant<Extract<AppError, { readonly tag: 'Forbidden' }>>({
    tag: 'Forbidden',
  }),
  fc.record<Extract<AppError, { readonly tag: 'ValidationError' }>>({
    tag: fc.constant('ValidationError' as const),
    message: fc.string(),
  }),
);

// ──────────────────────────────────────────────────────────────
// setField — immutable update
// ──────────────────────────────────────────────────────────────

describe('setField (property-based)', () => {
  it('is idempotent — applying twice gives same result', () => {
    fc.assert(
      fc.property(arbitraryTestData, fc.integer(), (data: TestData, newAge: number) => {
        const once = setField(data, 'age', newAge);
        const twice = setField(once, 'age', newAge);
        expect(twice).toEqual(once);
      }),
    );
  });

  it('never mutates the original object', () => {
    fc.assert(
      fc.property(
        arbitraryTestData,
        fc.string(),
        (data: TestData, newName: string) => {
          const before = { ...data };
          setField(data, 'name', newName);
          expect(data).toEqual(before);
        },
      ),
    );
  });

  it('returns an object where the updated field equals the value', () => {
    fc.assert(
      fc.property(arbitraryTestData, fc.integer(), (data: TestData, newAge: number) => {
        const updated = setField(data, 'age', newAge);
        expect(updated.age).toBe(newAge);
      }),
    );
  });

  it('returns an object where unchanged fields are preserved', () => {
    fc.assert(
      fc.property(arbitraryTestData, fc.integer(), (data: TestData, newAge: number) => {
        const updated = setField(data, 'age', newAge);
        expect(updated.name).toBe(data.name);
      }),
    );
  });
});

// ──────────────────────────────────────────────────────────────
// FormState smart constructors
// ──────────────────────────────────────────────────────────────

describe('FormState constructors (property-based)', () => {
  it('formIdle always has tag idle', () => {
    fc.assert(
      fc.property(fc.integer(), () => {
        const state: FormState<TestData> = formIdle();
        expect(state.tag).toBe('idle');
      }),
      { numRuns: 10 },
    );
  });

  it('formEditing always has tag editing with the given data', () => {
    fc.assert(
      fc.property(arbitraryTestData, (data: TestData) => {
        const state: FormState<TestData> = formEditing(data);
        expect(state.tag).toBe('editing');
        expect(state.tag === 'editing' ? state.data : { name: 'x', age: 0 }).toEqual(data);
      }),
    );
  });

  it('formSubmitting always has tag submitting with the given data', () => {
    fc.assert(
      fc.property(arbitraryTestData, (data: TestData) => {
        const state: FormState<TestData> = formSubmitting(data);
        expect(state.tag).toBe('submitting');
        expect(state.tag === 'submitting' ? state.data : { name: 'x', age: 0 }).toEqual(data);
      }),
    );
  });

  it('formSuccess always has tag success with the given data', () => {
    fc.assert(
      fc.property(arbitraryTestData, (data: TestData) => {
        const state: FormState<TestData> = formSuccess(data);
        expect(state.tag).toBe('success');
        expect(state.tag === 'success' ? state.data : { name: 'x', age: 0 }).toEqual(data);
      }),
    );
  });

  it('formError always has tag error with the given data and message', () => {
    fc.assert(
      fc.property(
        arbitraryTestData,
        fc.string(),
        (data: TestData, message: string) => {
          const state: FormState<TestData> = formError(data, message);
          expect(state.tag).toBe('error');
          expect(state.tag === 'error' ? state.data : { name: 'x', age: 0 }).toEqual(data);
          expect(state.tag === 'error' ? state.message : '').toBe(message);
        },
      ),
    );
  });
});

// ──────────────────────────────────────────────────────────────
// Result — ok / err
// ──────────────────────────────────────────────────────────────

describe('Result (property-based)', () => {
  it('ok always has tag ok with the given value', () => {
    fc.assert(
      fc.property(fc.string(), (value: string) => {
        const result: Result<string, AppError> = ok(value);
        expect(result.tag).toBe('ok');
        expect(result.tag === 'ok' ? result.value : '').toBe(value);
      }),
    );
  });

  it('err always has tag err with the given error', () => {
    fc.assert(
      fc.property(arbitraryAppError, (error: AppError) => {
        const result: Result<string, AppError> = err(error);
        expect(result.tag).toBe('err');
        expect(result.tag === 'err' ? result.error : { tag: 'Unauthorized' }).toEqual(error);
      }),
    );
  });
});