import { lazy } from 'react';
import {
  RouterProvider,
  createHashRouter,
  Navigate,
  useParams,
} from 'react-router-dom';
import { useAsync } from 'react-use';
import { backendConnector } from '@/backend/backendConnector';
import { ROUTES } from '@/routes';
import { Layout } from '@/layout/Layout';
import { DashboardPage } from '@/pages/DashboardPage';

// ── Lazy-loaded page components ──
const PropertiesPage = lazy(() =>
  import('@/pages/PropertiesPage').then((m) => ({ default: m.PropertiesPage })),
);
const TenantsPage = lazy(() =>
  import('@/pages/TenantsPage').then((m) => ({ default: m.TenantsPage })),
);
const TenantDetailPage = lazy(() =>
  import('@/pages/TenantDetailPage').then((m) => ({
    default: m.TenantDetailPage,
  })),
);
const LoginPage = lazy(() =>
  import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const SignupPage = lazy(() =>
  import('@/pages/SignupPage').then((m) => ({ default: m.SignupPage })),
);

// ── Param extraction wrappers ──
const TenantDetailElement = (): JSX.Element => {
  const { tenantId } = useParams<{ readonly tenantId: string }>();
  return tenantId !== undefined ? (
    <TenantDetailPage tenantId={tenantId} />
  ) : (
    <Navigate to={ROUTES.tenants.path} replace />
  );
};

// ── Auth guard ──
const AuthGuard = (): JSX.Element => {
  const sessionState = useAsync(
    async () => backendConnector.auth.getSession(),
    [],
  );

  return sessionState.loading
    ? (
      <div className="flex items-center justify-center py-16">
        <p className="text-gray-400">Ładowanie...</p>
      </div>
    )
    : sessionState.value?.data?.session?.user !== undefined
      ? <Layout />
      : <Navigate to={ROUTES.login.path} replace />;
};

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
    element: <AuthGuard />,
    children: [
      { path: ROUTES.dashboard.path, element: <DashboardPage /> },
      { path: ROUTES.properties.path, element: <PropertiesPage /> },
      { path: ROUTES.tenants.path, element: <TenantsPage /> },
      { path: ROUTES.tenantDetail.path, element: <TenantDetailElement /> },
      { path: '*', element: <Navigate to={ROUTES.dashboard.path} replace /> },
    ],
  },
]);

export const App = (): JSX.Element => <RouterProvider router={router} />;