import { useState } from 'react';

/**
 * Manages server-side pagination state for table components.
 * Returns a tuple of [state, controls].
 *
 * @param initialPage  First page (1-based).
 * @param pageSize     Number of rows per page.
 *
 * Controls:
 *   - goToPage(n) — jump to absolute page
 *   - nextPage()  — advance one page
 *   - prevPage()  — go back one page (no-op when page === 1)
 */
export const usePagination = (
  initialPage: number,
  pageSize: number,
): readonly [
  { readonly page: number; readonly pageSize: number },
  {
    readonly goToPage: (n: number) => void;
    readonly nextPage: () => void;
    readonly prevPage: () => void;
  },
] => {
  const [page, setPage] = useState(initialPage);
  return [
    { page, pageSize },
    {
      goToPage: (n: number): void => {
        setPage(Math.max(1, n));
      },
      nextPage: (): void => {
        setPage((p) => p + 1);
      },
      prevPage: (): void => {
        setPage((p) => Math.max(1, p - 1));
      },
    },
  ];
};