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
import { PropertyPage } from '@/pages/PropertyP';
import { TenantsListPage } from '@/pages/TenantsP';
import { TenantDetailPage } from '@/pages/TenantP';
import { LeaseAgreementsListPage } from '@/pages/LeaseAgreementsP';
import { LeaseAgreementDetailPage } from '@/pages/LeaseAgreementP';
import { FinancialEntryDetailPage } from '@/pages/FinancialEntryP';
import { FinancialEntriesListPage } from '@/pages/FinancialEntriesP';
import { TreasuryDetailPage } from '@/pages/TreasuryP';
import { TreasuriesListPage } from '@/pages/TreasuriesP';

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
  component: PropertyPage,
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

const financialEntriesListRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/financial-entries',
  component: FinancialEntriesListPage,
});

export const financialEntryDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/financial-entries/$id',
  component: FinancialEntryDetailPage,
});

const treasuriesListRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/treasuries',
  component: TreasuriesListPage,
});

export const treasuryDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/treasuries/$id',
  component: TreasuryDetailPage,
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
    financialEntriesListRoute,
    financialEntryDetailRoute,
    treasuriesListRoute,
    treasuryDetailRoute,
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
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- module augmentation requires interface merging (FUNCTIONAL_TS §2: interface allowed for declaration merging)
  interface Register {
    readonly router: typeof router;
  }
}