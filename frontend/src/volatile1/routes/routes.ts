import { lazy } from 'react';
import { generatePath } from 'react-router-dom';
import type { AppRole } from '@/volatile1/domain';
import { INHERIT, flattenRoutes } from '@/volatile0/generic';
import type { FlatRouteEntry, InheritSentinel, RouteNode } from '@/volatile0/generic';
import { withRouteParams } from './withRouteParams';

export type { FlatRouteEntry };

// ── Lazy page components ──
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
const AdminDashboardPage = lazy(() =>
  import('@/volatile2/pages/AdminDashboardPage').then((m) => ({
    default: m.AdminDashboardPage,
  })),
);
const TenantDashboardPage = lazy(() =>
  import('@/volatile2/pages/TenantDashboardPage').then((m) => ({
    default: m.TenantDashboardPage,
  })),
);
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

// ── Route keys — flat list of all dot-joined keys, mirrors ROUTE_TREE structure ──
const ROUTE_KEYS = [
  'login',
  'signup',
  'landlord',
  'landlord.properties',
  'landlord.tenants',
  'landlord.tenants.:tenantId',
  'admin',
  'admin.properties',
  'admin.tenants',
  'admin.tenants.:tenantId',
  'tenant',
] as const;

export type RouteKey = (typeof ROUTE_KEYS)[number];

// ── Extract params from key, stripping leading colons ──
type StripColon<S extends string> = S extends `:${infer Rest}` ? Rest : S;

type ExtractParams<S extends string> =
  S extends `${string}:${infer Param}/${infer Rest}`
    ? Readonly<Record<StripColon<Param>, string>> & ExtractParams<Rest>
    : S extends `${string}:${infer Param}`
      ? Readonly<Record<StripColon<Param>, string>>
      : Record<string, never>;

type RouteParams = {
  [K in RouteKey]: ExtractParams<K>;
};

// ── Route tree — single source of truth ──
const AUTHED: InheritSentinel = INHERIT;

const SHARED_CHILDREN: Readonly<Record<string, RouteNode<AppRole>>> = {
  properties: {
    allowedRoles: AUTHED,
    navLabel: 'Nieruchomości',
    element: PropertiesPage,
  },
  tenants: {
    allowedRoles: AUTHED,
    navLabel: 'Najemcy',
    element: TenantsPage,
    children: {
      ':tenantId': {
        allowedRoles: AUTHED,
        element: withRouteParams(TenantDetailPage),
      },
    },
  },
};

const ROUTE_TREE: RouteNode<AppRole> = {
  allowedRoles: AUTHED,
  children: {
    login: {
      allowedRoles: [],
      element: LoginPage,
    },
    signup: {
      allowedRoles: [],
      element: SignupPage,
    },
    landlord: {
      allowedRoles: ['landlord', 'admin'],
      navLabel: 'Dashboard',
      element: LandlordDashboardPage,
      children: SHARED_CHILDREN,
    },
    admin: {
      allowedRoles: ['admin'],
      navLabel: 'Dashboard',
      element: AdminDashboardPage,
      children: SHARED_CHILDREN,
    },
    tenant: {
      allowedRoles: ['tenant'],
      navLabel: 'Dashboard',
      element: TenantDashboardPage,
      children: {},
    },
  },
};

export const ROUTES = flattenRoutes(ROUTE_TREE) as Record<RouteKey, FlatRouteEntry<AppRole>>;

// ── Type-safe path builder ──
export const buildRoute = <K extends RouteKey>(
  route: K,
  params: RouteParams[K],
): string => {
  const path = ROUTES[route]?.path ?? '/';
  return generatePath(path, params as Record<string, string | null>);
};