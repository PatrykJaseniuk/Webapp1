import { describe, it, expect, vi } from 'vitest';
import { toAsyncData } from './asyncData';

// ──────────────────────────────────────────────────────────────
// toAsyncData — pure function
// ──────────────────────────────────────────────────────────────

const onRetry = vi.fn();

describe('toAsyncData', () => {
  it('returns pending when status is pending', () => {
    const result = toAsyncData(
      { status: 'pending', error: null, data: undefined },
      onRetry,
    );

    expect(result).toEqual({ tag: 'pending' });
  });

  it('returns rejected with error message when status is error', () => {
    const error = new Error('Something went wrong');
    const result = toAsyncData(
      { status: 'error', error, data: undefined },
      onRetry,
    );

    expect(result).toEqual({
      tag: 'rejected',
      message: 'Something went wrong',
      onRetry,
    });
  });

  it('returns rejected with fallback message when error is null', () => {
    const result = toAsyncData(
      { status: 'error', error: null, data: undefined },
      onRetry,
    );

    expect(result).toEqual({
      tag: 'rejected',
      message: 'Unknown error',
      onRetry,
    });
  });

  it('returns fulfilled with data when status is success', () => {
    const data = { rows: [{ id: '1' }], totalCount: 1 };
    const result = toAsyncData(
      { status: 'success', error: null, data },
      onRetry,
    );

    expect(result).toEqual({
      tag: 'fulfilled',
      data,
    });
  });

  it('includes isFetching when status is success and isFetching is true', () => {
    const data = { rows: [{ id: '1' }], totalCount: 1 };
    const result = toAsyncData(
      { status: 'success', error: null, data },
      onRetry,
      true,
    );

    expect(result).toEqual({
      tag: 'fulfilled',
      data,
      isFetching: true,
    });
  });

  it('omits isFetching when isFetching is false', () => {
    const data = { rows: [{ id: '1' }], totalCount: 1 };
    const result = toAsyncData(
      { status: 'success', error: null, data },
      onRetry,
      false,
    );

    expect(result).toEqual({
      tag: 'fulfilled',
      data,
    });
    expect('isFetching' in result).toBe(false);
  });
});