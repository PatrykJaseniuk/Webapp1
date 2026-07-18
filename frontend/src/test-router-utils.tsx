// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import type { ReactNode } from 'react';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { createMemoryHistory } from '@tanstack/history';

const EMPTY_ROUTE_TREE = {} as never;

type MemoryRouterProviderProps = {
  readonly children: ReactNode;
  readonly initialEntries?: readonly string[];
};

export const MemoryRouterProvider = ({
  children,
  initialEntries,
}: MemoryRouterProviderProps): JSX.Element => {
  const history = createMemoryHistory({
    initialEntries: [...(initialEntries ?? ['/'])],
  });

  const router = createRouter({
    routeTree: EMPTY_ROUTE_TREE,
    history,
    context: undefined as never,
  });

  return <RouterProvider router={router as never}>{children as never}</RouterProvider>;
};