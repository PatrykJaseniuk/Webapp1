import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSort } from './sort';

// ──────────────────────────────────────────────────────────────
// useSort — React hook
// ──────────────────────────────────────────────────────────────

type TestColumn = 'name' | 'email' | 'date';

describe('useSort', () => {
  it('returns the default sort config on mount', () => {
    const { result } = renderHook(() => useSort<TestColumn>('name', 'asc'));

    expect(result.current[0]).toEqual({ column: 'name', direction: 'asc' });
  });

  it('flips direction when toggling the active column', () => {
    const { result } = renderHook(() => useSort<TestColumn>('email', 'asc'));

    act(() => {
      result.current[1]('email');
    });
    expect(result.current[0]).toEqual({ column: 'email', direction: 'desc' });

    act(() => {
      result.current[1]('email');
    });
    expect(result.current[0]).toEqual({ column: 'email', direction: 'asc' });
  });

  it('sets a new column with asc direction', () => {
    const { result } = renderHook(() => useSort<TestColumn>('name', 'asc'));

    act(() => {
      result.current[1]('email');
    });

    expect(result.current[0]).toEqual({ column: 'email', direction: 'asc' });
  });

  it('sets a new column with asc even when previous direction was desc', () => {
    const { result } = renderHook(() => useSort<TestColumn>('date', 'desc'));

    act(() => {
      result.current[1]('name');
    });

    expect(result.current[0]).toEqual({ column: 'name', direction: 'asc' });
  });
});