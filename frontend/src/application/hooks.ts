// ── Application hooks ──
// React hooks for data fetching and auth state.

import { useState, useEffect, useCallback, useRef } from 'react';
import type { AppError, AsyncState } from '@/domain';

// ──────────────────────────────────────────────
// R-006: useAsync — data fetched on mount/page load
// ──────────────────────────────────────────────

type UseAsyncResult<T> = {
  readonly state: AsyncState<T>;
  readonly refresh: () => void;
};

export const useAsync = <T>(
  fn: () => Promise<T>,
  deps: readonly unknown[] = [],
): UseAsyncResult<T> => {
  const [state, setState] = useState<AsyncState<T>>({ tag: 'idle' });
  const [refreshKey, setRefreshKey] = useState(0);
  const cancelledRef = useRef(false);

  useEffect(() => {
    // eslint-disable-next-line functional/immutable-data -- refs are mutable by design in React
    cancelledRef.current = false;
    setState({ tag: 'loading' });

    fn()
      .then((data: T) => {
        if (!cancelledRef.current) {
          setState({ tag: 'success', data });
        }
      })
      .catch((err: unknown) => {
        if (!cancelledRef.current) {
          const error: AppError = {
            tag: 'NetworkError',
            message: err instanceof Error ? err.message : 'Unknown error',
          };
          setState({ tag: 'error', error });
        }
      });

    return () => {
      // eslint-disable-next-line functional/immutable-data -- refs are mutable by design in React
      cancelledRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, refreshKey]);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return { state, refresh };
};

// ──────────────────────────────────────────────
// R-007: useAsyncFn — data fetched on user action
// ──────────────────────────────────────────────

type UseAsyncFnResult<T, Args extends readonly unknown[]> = {
  readonly state: AsyncState<T>;
  readonly execute: (...args: [...Args]) => Promise<T>;
};

export const useAsyncFn = <T, Args extends readonly unknown[] = []>(
  fn: (...args: [...Args]) => Promise<T>,
): UseAsyncFnResult<T, Args> => {
  const [state, setState] = useState<AsyncState<T>>({ tag: 'idle' });
  const mountedRef = useRef(true);

  useEffect(() => {
    // eslint-disable-next-line functional/immutable-data -- refs are mutable by design in React
    mountedRef.current = true;
    return () => {
      // eslint-disable-next-line functional/immutable-data -- refs are mutable by design in React
      mountedRef.current = false;
    };
  }, []);

  const execute = useCallback(
    async (...args: [...Args]): Promise<T> => {
      setState({ tag: 'loading' });

      try {
        const data = await fn(...args);
        if (mountedRef.current) {
          setState({ tag: 'success', data });
        }
        return data;
      } catch (err: unknown) {
        const error: AppError = {
          tag: 'NetworkError',
          message: err instanceof Error ? err.message : 'Unknown error',
        };
        if (mountedRef.current) {
          setState({ tag: 'error', error });
        }
        throw err;
      }
    },
    [fn],
  );

  return { state, execute };
};