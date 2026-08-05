// ══════════════════════════════════════════════════════════════
// ROUTE_TREE — TanStack Router code-based route tree
// ══════════════════════════════════════════════════════════════

import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router';
import { createHashHistory } from '@tanstack/history';
import { DashboardPage } from '@/pages/DashboardP';
import { LoginPage } from '@/pages/LoginP';
import { SignupPage } from '@/pages/SignupP';
import { NotFoundPage } from '@/pages/NotFoundP';
import { ErrorPage } from '@/pages/ErrorP';
import { AppLayoutPage } from '@/pages/AppLayoutP';
import { PropertiesListPage } from '@/pages/PropertiesP';
import { PropertyDetailPage } from '@/pages/PropertyP';
import { TenantsListPage } from '@/pages/TenantsP';
import { TenantDetailPage } from '@/pages/TenantP';
import { LeaseAgreementsListPage } from '@/pages/LeaseAgreementsP';
import { LeaseAgreementDetailPage } from '@/pages/LeaseAgreementP';
import { TransactionDetailPage } from '@/pages/TransactionPage';
import { TransactionsListPage } from '@/pages/TransactionsP';

// ── Root route ──

const rootRoute = createRootRoute({
  component: () => <Outlet />,
  errorComponent: ErrorPage,
});

// ── Index redirect to /login ──

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LoginPage,
});

// ── Auth pages (public) ──

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/signup',
  component: SignupPage,
});

// ══════════════════════════════════════════════════════════════
// APP LAYOUT + CHILDREN (role-agnostic)
// ══════════════════════════════════════════════════════════════

const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/app',
  component: AppLayoutPage,
});

const dashboardRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/',
  component: DashboardPage,
});

const propertiesListRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/properties',
  component: PropertiesListPage,
});

export const propertyDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/properties/$id',
  component: PropertyDetailPage,
});

const tenantsListRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/tenants',
  component: TenantsListPage,
});

export const tenantDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/tenants/$id',
  component: TenantDetailPage,
});

const leasesListRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/leases',
  component: LeaseAgreementsListPage,
});

export const leaseDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/leases/$id',
  component: LeaseAgreementDetailPage,
});

const transactionsListRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/transactions',
  component: TransactionsListPage,
});

export const transactionDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/transactions/$id',
  component: TransactionDetailPage,
});

// ══════════════════════════════════════════════════════════════
// CATCH-ALL (404)
// ══════════════════════════════════════════════════════════════

const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '$',
  component: NotFoundPage,
});

// ══════════════════════════════════════════════════════════════
// ROUTE TREE ASSEMBLY
// ══════════════════════════════════════════════════════════════

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  signupRoute,
  appLayoutRoute.addChildren([
    dashboardRoute,
    propertiesListRoute,
    propertyDetailRoute,
    tenantsListRoute,
    tenantDetailRoute,
    leasesListRoute,
    leaseDetailRoute,
    transactionsListRoute,
    transactionDetailRoute,
  ]),
  notFoundRoute,
]);

// ══════════════════════════════════════════════════════════════
// ROUTER CREATION
// ══════════════════════════════════════════════════════════════

const hashHistory = createHashHistory();

export const router = createRouter({
  routeTree,
  history: hashHistory,
});

// ══════════════════════════════════════════════════════════════
// TYPE AUGMENTATION for type-safe router usage
// ══════════════════════════════════════════════════════════════

declare module '@tanstack/react-router' {
  interface Register {
    readonly router: typeof router;
  }
}