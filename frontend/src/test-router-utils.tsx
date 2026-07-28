import type { ReactNode } from 'react';
import {
  RouterContextProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { createMemoryHistory } from '@tanstack/history';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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

  const rootRoute = createRootRoute();
  const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/' });
  const routeTree = rootRoute.addChildren([indexRoute]);

  const router = createRouter({ routeTree, history });

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <RouterContextProvider router={router}>{children}</RouterContextProvider>
    </QueryClientProvider>
  );
};