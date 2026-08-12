import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePaginatedQuery } from './paginatedQuery';
import type { ReactNode } from 'react';

// ──────────────────────────────────────────────────────────────
// usePaginatedQuery — React hook with TanStack Query
// ──────────────────────────────────────────────────────────────

type TestRow = { readonly id: string; readonly name: string };
type TestColumn = 'name' | 'date';

const makeWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { readonly children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return Wrapper;
};

describe('usePaginatedQuery', () => {
  it('calls queryFn with correct sort, from, and to on initial render', async () => {
    const queryFn = vi.fn().mockResolvedValue({ rows: [], totalCount: 0 });
    const Wrapper = makeWrapper();

    renderHook(
      () =>
        usePaginatedQuery<TestRow, TestColumn>({
          queryKeyBase: 'test-entity',
          defaultSortColumn: 'name',
          defaultSortDirection: 'asc',
          pageSize: 10,
          queryFn,
        }),
      { wrapper: Wrapper },
    );

    await waitFor(() => {
      expect(queryFn).toHaveBeenCalledTimes(1);
    });

    expect(queryFn).toHaveBeenCalledWith(
      { column: 'name', direction: 'asc' },
      0,
      9,
    );
  });

  it('returns fulfilled asyncData on successful query', async () => {
    const rows: readonly TestRow[] = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
    ];
    const queryFn = vi.fn().mockResolvedValue({ rows, totalCount: 2 });
    const Wrapper = makeWrapper();

    const { result } = renderHook(
      () =>
        usePaginatedQuery<TestRow, TestColumn>({
          queryKeyBase: 'test-entity',
          defaultSortColumn: 'name',
          defaultSortDirection: 'asc',
          pageSize: 10,
          queryFn,
        }),
      { wrapper: Wrapper },
    );

    await waitFor(() => {
      expect(result.current.asyncData.tag).toBe('fulfilled');
    });

    const fulfilled = result.current.asyncData;
    expect(fulfilled.tag === 'fulfilled' && fulfilled.data.rows).toEqual(rows);
    expect(fulfilled.tag === 'fulfilled' && fulfilled.data.totalCount).toBe(2);
  });

  it('returns rejected asyncData when queryFn throws', async () => {
    const error = new Error('Network failure');
    const queryFn = vi.fn().mockRejectedValue(error);
    const Wrapper = makeWrapper();

    const { result } = renderHook(
      () =>
        usePaginatedQuery<TestRow, TestColumn>({
          queryKeyBase: 'test-entity',
          defaultSortColumn: 'name',
          defaultSortDirection: 'asc',
          pageSize: 10,
          queryFn,
        }),
      { wrapper: Wrapper },
    );

    await waitFor(() => {
      expect(result.current.asyncData.tag).toBe('rejected');
    });

    const rejected = result.current.asyncData;
    expect(rejected.tag === 'rejected' && rejected.message).toBe(
      'Network failure',
    );
  });
});