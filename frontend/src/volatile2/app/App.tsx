import { RouterProvider, createHashRouter, Navigate, type RouteObject } from 'react-router-dom';
import { match } from 'ts-pattern';
import { AuthProvider, useAuth, RoleGuard } from '@/volatile1/auth';
import { ROUTES } from '@/volatile1/routes';
import { Layout } from '@/volatile2/layout/Layout';
import type { AppRole } from '@/volatile1/domain';
import type { FlatRouteEntry } from '@/volatile1/routes';

const AuthGuard = (): JSX.Element => {
  const authState = useAuth();

  return match(authState)
    .with({ tag: 'loading' }, () => (
      <div className="flex items-center justify-center py-16">
        <p className="text-gray-400">Ładowanie...</p>
      </div>
    ))
    .with({ tag: 'unauthenticated' }, () => <Navigate to={ROUTES.login.path} replace />)
    .with({ tag: 'authenticated' }, ({ role }) => (
      <Navigate
        to={
          role === 'admin' ? ROUTES.admin.path :
          role === 'landlord' ? ROUTES.landlord.path :
          ROUTES.tenant.path
        }
        replace
      />
    ))
    .exhaustive();
};

const buildProtectedChildren = (): readonly RouteObject[] =>
  (Object.entries(ROUTES) as ReadonlyArray<[string, FlatRouteEntry<AppRole>]>)
    .filter(([key]) => key !== 'login' && key !== 'signup')
    .map(([, entry]) => {
      const Element = entry.element;
      return {
        path: entry.path,
        element: Element !== undefined ? (
          <RoleGuard allowedRoles={entry.allowedRoles}>
            <Element />
          </RoleGuard>
        ) : null,
      };
    })
    .filter((route) => route.element !== null);

const router = createHashRouter([
  { path: ROUTES.login.path,
    element: ROUTES.login.element !== undefined ? <ROUTES.login.element /> : null,
  },
  { path: ROUTES.signup.path,
    element: ROUTES.signup.element !== undefined ? <ROUTES.signup.element /> : null,
  },
  { path: '/', element: <AuthGuard /> },
  { element: <Layout />, children: [...buildProtectedChildren()] },
]);

export const App = (): JSX.Element => (
  <AuthProvider>
    <RouterProvider router={router} />
  </AuthProvider>
);