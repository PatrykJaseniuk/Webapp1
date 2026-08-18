import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFilteredPaginatedQuery } from './dataQuery';
import type { FilterConfig } from './dataQuery';
import type { ReactNode } from 'react';

type TestRow = { readonly id: string; readonly name: string };
type TestColumn = 'name' | 'date';
type TestFilterKey = 'text' | 'status';
type TestSort = { readonly column: TestColumn; readonly direction: 'asc' | 'desc' };

type TestFetchPage = (args: {
  readonly sort: TestSort;
  readonly from: number;
  readonly to: number;
  readonly filter: FilterConfig<TestFilterKey>;
}) => Promise<{ readonly rows: readonly TestRow[]; readonly totalCount: number }>;

const makeFetchPage = (): Mock<TestFetchPage> => vi.fn<TestFetchPage>().mockResolvedValue({ rows: [], totalCount: 0 });

const makeWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { readonly children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return Wrapper;
};

const renderFilteredQuery = (fetchPage: Mock<TestFetchPage>, overrides?: Record<string, unknown>) =>
  renderHook(
    () =>
      useFilteredPaginatedQuery<TestRow, TestColumn, TestFilterKey>({
        queryKey: ['test-entity'],
        defaultSort: { column: 'name', direction: 'asc' },
        fetchPage,
        ...overrides,
      }),
    { wrapper: makeWrapper() },
  );

afterEach(() => {
  vi.useRealTimers();
});

describe('useFilteredPaginatedQuery', () => {
  it('calls fetchPage with default sort, first page range, and empty filter', async () => {
    const fetchPage = makeFetchPage();

    renderFilteredQuery(fetchPage);

    await waitFor(() => {
      expect(fetchPage).toHaveBeenCalledTimes(1);
    });

    expect(fetchPage).toHaveBeenCalledWith(
      { sort: { column: 'name', direction: 'asc' }, from: 0, to: 19, filter: {} },
    );
  });

  it('returns fulfilled asyncData on successful query', async () => {
    const rows: readonly TestRow[] = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
    ];
    const fetchPage = vi.fn<TestFetchPage>().mockResolvedValue({ rows, totalCount: 2 });

    const { result } = renderFilteredQuery(fetchPage);

    await waitFor(() => {
      expect(result.current.asyncData.tag).toBe('fulfilled');
    });

    const fulfilled = result.current.asyncData;
    expect(fulfilled.tag === 'fulfilled' && fulfilled.data.rows).toEqual(rows);
    expect(fulfilled.tag === 'fulfilled' && fulfilled.data.totalCount).toBe(2);
  });

  it('returns rejected asyncData when fetchPage fails', async () => {
    const fetchPage = vi.fn<TestFetchPage>().mockRejectedValue(new Error('Network failure'));

    const { result } = renderFilteredQuery(fetchPage);

    await waitFor(() => {
      expect(result.current.asyncData.tag).toBe('rejected');
    });

    const rejected = result.current.asyncData;
    expect(rejected.tag === 'rejected' && rejected.message).toBe('Network failure');
  });

  it('starts with an empty filter config', async () => {
    const fetchPage = makeFetchPage();

    const { result } = renderFilteredQuery(fetchPage);

    expect(result.current.filter.config).toEqual({});
  });

  it('applies a filter change and resets page to 1', async () => {
    const fetchPage = makeFetchPage();

    const { result } = renderFilteredQuery(fetchPage);

    await waitFor(() => {
      expect(fetchPage).toHaveBeenCalledTimes(1);
    });

    act(() => {
      result.current.pagination.nextPage();
    });

    await waitFor(() => {
      expect(fetchPage).toHaveBeenCalledWith(
        { sort: { column: 'name', direction: 'asc' }, from: 20, to: 39, filter: {} },
      );
    });

    act(() => {
      result.current.filter.doFilter({ status: 'active' });
    });

    await waitFor(() => {
      expect(result.current.filter.config).toEqual({ status: 'active' });
      expect(result.current.pagination.page).toBe(1);
    });
  });

  it('debounces filter changes before hitting the query', async () => {
    const fetchPage = makeFetchPage();

    const { result } = renderFilteredQuery(fetchPage);

    await waitFor(() => {
      expect(fetchPage).toHaveBeenCalledTimes(1);
    });

    vi.useFakeTimers();

    act(() => {
      result.current.filter.doFilter({ text: 'abc' });
    });

    expect(result.current.filter.config).toEqual({ text: 'abc' });
    expect(fetchPage).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(fetchPage).toHaveBeenCalledWith(
      { sort: { column: 'name', direction: 'asc' }, from: 0, to: 19, filter: { text: 'abc' } },
    );
  });

  it('clearing the filter cancels a pending debounced update', async () => {
    const fetchPage = makeFetchPage();

    const { result } = renderFilteredQuery(fetchPage);

    await waitFor(() => {
      expect(fetchPage).toHaveBeenCalledTimes(1);
    });

    vi.useFakeTimers();

    act(() => {
      result.current.filter.doFilter({ text: 'abc' });
    });

    act(() => {
      result.current.filter.doFilter({});
    });

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    const staleCalls = fetchPage.mock.calls.filter(
      (call) => call[0].filter.text === 'abc',
    );
    expect(staleCalls).toHaveLength(0);
    expect(result.current.filter.config).toEqual({});
  });
});