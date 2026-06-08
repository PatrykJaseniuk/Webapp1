import { lazy } from 'react';
import {
  RouterProvider,
  createHashRouter,
  Navigate,
  useParams,
  type RouteObject,
} from 'react-router-dom';
import { match } from 'ts-pattern';
import { AuthProvider, useAuth, RoleGuard } from '@/volatile1/auth';
import { ROUTES, buildRoute } from '@/volatile1/routes';
import { Layout } from '@/volatile2/layout/Layout';
import type { AppRole } from '@/volatile1/domain';
import type { FlatRouteEntry } from '@/volatile1/routes';

// ── Lazy-loaded page components ──
const PropertiesPage = lazy(() =>
  import('@/volatile2/pages/PropertiesPage').then((m) => ({ default: m.PropertiesPage })),
);
const TenantsPage = lazy(() =>
  import('@/volatile2/pages/TenantsPage').then((m) => ({ default: m.TenantsPage })),
);
const TenantDetailPage = lazy(() =>
  import('@/volatile2/pages/TenantDetailPage').then((m) => ({
    default: m.TenantDetailPage,
  })),
);
const LoginPage = lazy(() =>
  import('@/volatile2/pages/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const SignupPage = lazy(() =>
  import('@/volatile2/pages/SignupPage').then((m) => ({ default: m.SignupPage })),
);
const LandlordDashboardPage = lazy(() =>
  import('@/volatile2/pages/LandlordDashboardPage').then((m) => ({
    default: m.LandlordDashboardPage,
  })),
);
const TenantDashboardPage = lazy(() =>
  import('@/volatile2/pages/TenantDashboardPage').then((m) => ({
    default: m.TenantDashboardPage,
  })),
);
const AdminDashboardPage = lazy(() =>
  import('@/volatile2/pages/AdminDashboardPage').then((m) => ({
    default: m.AdminDashboardPage,
  })),
);

// ── Route key → page component mapping ──
const PAGE_COMPONENTS: Record<string, () => JSX.Element> = {
  'landlord.dashboard':    () => <LandlordDashboardPage />,
  'landlord.properties':   () => <PropertiesPage />,
  'landlord.tenants':      () => <TenantsPage />,
  'landlord.tenantDetail': () => <TenantDetailElement />,
  'admin.dashboard':       () => <AdminDashboardPage />,
  'admin.properties':      () => <PropertiesPage />,
  'admin.tenants':         () => <TenantsPage />,
  'admin.tenantDetail':    () => <TenantDetailElement />,
  'tenant.dashboard':      () => <TenantDashboardPage />,
};

// ── Param extraction wrappers ──
const TenantDetailElement = (): JSX.Element => {
  const { tenantId } = useParams<{ readonly tenantId: string }>();
  return tenantId !== undefined ?
    (
      <TenantDetailPage tenantId={tenantId} />
    ) :
    (
      <Navigate to={buildRoute('landlord.tenants', {})} replace />
    );
};

// ── Auth guard — role-based redirect from root ──
const AuthGuard = (): JSX.Element => {
  const authState = useAuth();

  return match(authState)
    .with({ tag: 'loading' }, () => (
      <div className="flex items-center justify-center py-16">
        <p className="text-gray-400">Ładowanie...</p>
      </div>
    ))
    .with({ tag: 'unauthenticated' }, () => (
      <Navigate to={ROUTES.login.path} replace />
    ))
    .with({ tag: 'authenticated' }, ({ role }) => (
      <Navigate
        to={
          role === 'admin' ?
            ROUTES['admin.dashboard'].path :
            role === 'landlord' ?
              ROUTES['landlord.dashboard'].path :
              ROUTES['tenant.dashboard'].path
        }
        replace
      />
    ))
    .exhaustive();
};

// ── Generate protected children from ROUTES ──
const buildProtectedChildren = (): readonly RouteObject[] =>
  Object.entries(ROUTES)
    .filter(
      ([key, _entry]: readonly [string, FlatRouteEntry<AppRole>]): boolean =>
        key !== 'login' && key !== 'signup' && key !== 'dashboard',
    )
    .map(([key, entry]: readonly [string, FlatRouteEntry<AppRole>]): RouteObject => {
      const Component = PAGE_COMPONENTS[key];

      return {
        path: entry.path,
        element:
          Component !== undefined ?
            (
              <RoleGuard allowedRoles={entry.allowedRoles}>
                <Component />
              </RoleGuard>
            ) :
            null,
      };
    })
    .filter(
      (route: RouteObject): boolean =>
        route.element !== null,
    );

// ── Router ──
const router = createHashRouter([
  {
    path: ROUTES.login.path,
    element: <LoginPage />,
  },
  {
    path: ROUTES.signup.path,
    element: <SignupPage />,
  },
  {
    path: '/',
    element: <AuthGuard />,
  },
  {
    element: <Layout />,
    children: [...buildProtectedChildren()],
  },
]);

export const App = (): JSX.Element => (
  <AuthProvider>
    <RouterProvider router={router} />
  </AuthProvider>
);