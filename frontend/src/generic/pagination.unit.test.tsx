import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePagination } from './pagination';

// ──────────────────────────────────────────────────────────────
// usePagination — React hook
// ──────────────────────────────────────────────────────────────

describe('usePagination', () => {
  it('returns the initial page and pageSize on mount', () => {
    const { result } = renderHook(() => usePagination(1, 20));

    const [state] = result.current;
    expect(state).toEqual({ page: 1, pageSize: 20 });
  });

  it('increments the page with nextPage', () => {
    const { result } = renderHook(() => usePagination(1, 10));

    act(() => {
      result.current[1].nextPage();
    });

    expect(result.current[0].page).toBe(2);
  });

  it('decrements the page with prevPage', () => {
    const { result } = renderHook(() => usePagination(3, 10));

    act(() => {
      result.current[1].prevPage();
    });

    expect(result.current[0].page).toBe(2);
  });

  it('clamps prevPage to a minimum of 1', () => {
    const { result } = renderHook(() => usePagination(1, 10));

    act(() => {
      result.current[1].prevPage();
    });

    expect(result.current[0].page).toBe(1);
  });

  it('jumps to an absolute page with goToPage', () => {
    const { result } = renderHook(() => usePagination(1, 10));

    act(() => {
      result.current[1].goToPage(5);
    });

    expect(result.current[0].page).toBe(5);
  });

  it('clamps goToPage to a minimum of 1', () => {
    const { result } = renderHook(() => usePagination(3, 10));

    act(() => {
      result.current[1].goToPage(0);
    });

    expect(result.current[0].page).toBe(1);
  });

  it('accepts a custom initialPage', () => {
    const { result } = renderHook(() => usePagination(7, 50));

    expect(result.current[0]).toEqual({ page: 7, pageSize: 50 });
  });
});