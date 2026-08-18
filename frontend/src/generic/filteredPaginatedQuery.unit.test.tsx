import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFilteredPaginatedQuery } from './dataQuery';
import type { ReactNode } from 'react';

// ──────────────────────────────────────────────────────────────
// useFilteredPaginatedQuery — sort + pagination + filter + query
// ──────────────────────────────────────────────────────────────

type TestRow = { readonly id: string; readonly name: string };
type TestColumn = 'name' | 'date';
type TestFilter = { readonly text: string; readonly status: string };
type TestSort = { readonly column: TestColumn; readonly direction: 'asc' | 'desc' };

const INITIAL_FILTER: TestFilter = { text: '', status: '' };

type TestQueryFn = (
  sort: TestSort,
  from: number,
  to: number,
  filter: TestFilter,
) => Promise<{ readonly rows: readonly TestRow[]; readonly totalCount: number }>;

type PlainQueryFn = (
  sort: TestSort,
  from: number,
  to: number,
  filter: Record<string, string>,
) => Promise<{ readonly rows: readonly TestRow[]; readonly totalCount: number }>;

const makeQueryFn = (): Mock<TestQueryFn> => vi.fn<TestQueryFn>().mockResolvedValue({ rows: [], totalCount: 0 });

const makeWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { readonly children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return Wrapper;
};

const renderFilteredQuery = (queryFn: Mock<TestQueryFn>, overrides?: Record<string, unknown>) =>
  renderHook(
    () =>
      useFilteredPaginatedQuery<TestRow, TestColumn, TestFilter>({
        queryKeyBase: 'test-entity',
        defaultSortColumn: 'name',
        initialFilter: INITIAL_FILTER,
        textFilterKey: 'text',
        queryFn,
        ...overrides,
      }),
    { wrapper: makeWrapper() },
  );

afterEach(() => {
  vi.useRealTimers();
});

describe('useFilteredPaginatedQuery', () => {
  it('calls queryFn with default sort, first page range, and initial filter', async () => {
    const queryFn = makeQueryFn();

    renderFilteredQuery(queryFn);

    await waitFor(() => {
      expect(queryFn).toHaveBeenCalledTimes(1);
    });

    expect(queryFn).toHaveBeenCalledWith(
      { column: 'name', direction: 'asc' },
      0,
      19,
      INITIAL_FILTER,
    );
  });

  it('returns fulfilled asyncData on successful query', async () => {
    const rows: readonly TestRow[] = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
    ];
    const queryFn = vi.fn<TestQueryFn>().mockResolvedValue({ rows, totalCount: 2 });

    const { result } = renderFilteredQuery(queryFn);

    await waitFor(() => {
      expect(result.current.asyncData.tag).toBe('fulfilled');
    });

    const fulfilled = result.current.asyncData;
    expect(fulfilled.tag === 'fulfilled' && fulfilled.data.rows).toEqual(rows);
    expect(fulfilled.tag === 'fulfilled' && fulfilled.data.totalCount).toBe(2);
  });

  it('returns rejected asyncData when queryFn fails', async () => {
    const queryFn = vi.fn<TestQueryFn>().mockRejectedValue(new Error('Network failure'));

    const { result } = renderFilteredQuery(queryFn);

    await waitFor(() => {
      expect(result.current.asyncData.tag).toBe('rejected');
    });

    const rejected = result.current.asyncData;
    expect(rejected.tag === 'rejected' && rejected.message).toBe('Network failure');
  });

  it('derives filter values and setters from initialFilter', async () => {
    const queryFn = makeQueryFn();

    const { result } = renderFilteredQuery(queryFn);

    expect(result.current.filter.text).toBe('');
    expect(result.current.filter.status).toBe('');
    expect(result.current.filter.isFilterActive).toBe(false);
    expect(result.current.filter.activeFilterCount).toBe(0);

    act(() => {
      result.current.filter.setStatus('active');
    });

    expect(result.current.filter.status).toBe('active');
    expect(result.current.filter.isFilterActive).toBe(true);
    expect(result.current.filter.activeFilterCount).toBe(1);
  });


  it('applies non-text filter changes immediately and resets page to 1 with a single fetch', async () => {
    const queryFn = makeQueryFn();

    const { result } = renderFilteredQuery(queryFn);

    await waitFor(() => {
      expect(queryFn).toHaveBeenCalledTimes(1);
    });

    act(() => {
      result.current.pagination.nextPage();
    });

    await waitFor(() => {
      expect(queryFn).toHaveBeenCalledWith({ column: 'name', direction: 'asc' }, 20, 39, INITIAL_FILTER);
    });

    const callsBefore = queryFn.mock.calls.length;

    act(() => {
      result.current.filter.setStatus('active');
    });

    await waitFor(() => {
      expect(queryFn).toHaveBeenCalledWith(
        { column: 'name', direction: 'asc' },
        0,
        19,
        { text: '', status: 'active' },
      );
    });

    const filterCalls = queryFn.mock.calls.filter(
      (call) => (call[3] as TestFilter).status === 'active',
    );
    expect(filterCalls).toHaveLength(1);
    expect(queryFn.mock.calls.length).toBe(callsBefore + 1);
    expect(result.current.pagination.page).toBe(1);
  });

  it('debounces the text filter before hitting the query', async () => {
    const queryFn = makeQueryFn();

    const { result } = renderFilteredQuery(queryFn);

    await waitFor(() => {
      expect(queryFn).toHaveBeenCalledTimes(1);
    });

    vi.useFakeTimers();

    act(() => {
      result.current.filter.setText('abc');
    });

    expect(result.current.filter.text).toBe('abc');
    expect(queryFn).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(queryFn).toHaveBeenCalledWith(
      { column: 'name', direction: 'asc' },
      0,
      19,
      { text: 'abc', status: '' },
    );
  });

  it('clearFilter cancels a pending debounced update', async () => {
    const queryFn = makeQueryFn();

    const { result } = renderFilteredQuery(queryFn);

    await waitFor(() => {
      expect(queryFn).toHaveBeenCalledTimes(1);
    });

    vi.useFakeTimers();

    act(() => {
      result.current.filter.setText('abc');
    });

    act(() => {
      result.current.filter.clearFilter();
    });

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    const staleCalls = queryFn.mock.calls.filter(
      (call) => (call[3] as TestFilter).text === 'abc',
    );
    expect(staleCalls).toHaveLength(0);
    expect(result.current.filter.text).toBe('');
    expect(result.current.filter.isFilterActive).toBe(false);
  });

  it('returns trivial filter controls when initialFilter is omitted', async () => {
    const queryFn = vi.fn<PlainQueryFn>().mockResolvedValue({ rows: [], totalCount: 0 });

    const { result } = renderHook(
      () =>
        useFilteredPaginatedQuery<TestRow, TestColumn>({
          queryKeyBase: 'test-entity-plain',
          defaultSortColumn: 'name',
          queryFn,
        }),
      { wrapper: makeWrapper() },
    );

    await waitFor(() => {
      expect(queryFn).toHaveBeenCalledTimes(1);
    });

    expect(queryFn).toHaveBeenCalledWith({ column: 'name', direction: 'asc' }, 0, 19, {});
    expect(result.current.filter.isFilterActive).toBe(false);
    expect(result.current.filter.activeFilterCount).toBe(0);
  });
});
