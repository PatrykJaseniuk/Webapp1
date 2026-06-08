import { generatePath } from 'react-router-dom';
import type { AppRole } from '@/volatile1/domain';
import { INHERIT, flattenRoutes } from '@/volatile0/generic';
import type { FlatRouteEntry, InheritSentinel, RouteNode } from '@/volatile0/generic';

export type { FlatRouteEntry };

// ── Route tree — single source of truth ──
const AUTHED: InheritSentinel = INHERIT;

const ROUTE_TREE: Record<string, RouteNode<AppRole>> = {
  login: {
    path: '/login',
    allowedRoles: [],
  },
  signup: {
    path: '/signup',
    allowedRoles: [],
  },
  dashboard: {
    path: '/',
    allowedRoles: ['admin', 'landlord', 'tenant'],
  },
  landlord: {
    path: '/landlord',
    allowedRoles: ['landlord', 'admin'],
    children: {
      dashboard: {
        path: '',
        allowedRoles: AUTHED,
        navLabel: 'Dashboard',
      },
      properties: {
        path: 'properties',
        allowedRoles: AUTHED,
        navLabel: 'Nieruchomości',
      },
      tenants: {
        path: 'tenants',
        allowedRoles: AUTHED,
        navLabel: 'Najemcy',
      },
      tenantDetail: {
        path: 'tenants/:tenantId',
        allowedRoles: AUTHED,
      },
    },
  },
  admin: {
    path: '/admin',
    allowedRoles: ['admin'],
    children: {
      dashboard: {
        path: '',
        allowedRoles: AUTHED,
        navLabel: 'Dashboard',
      },
      properties: {
        path: 'properties',
        allowedRoles: AUTHED,
        navLabel: 'Nieruchomości',
      },
      tenants: {
        path: 'tenants',
        allowedRoles: AUTHED,
        navLabel: 'Najemcy',
      },
      tenantDetail: {
        path: 'tenants/:tenantId',
        allowedRoles: AUTHED,
      },
    },
  },
  tenant: {
    path: '/tenant',
    allowedRoles: ['tenant'],
    children: {
      dashboard: {
        path: '',
        allowedRoles: AUTHED,
        navLabel: 'Dashboard',
      },
    },
  },
};

export const ROUTES = flattenRoutes(ROUTE_TREE) as Record<RouteKey, FlatRouteEntry<AppRole>>;

// ── Param types for buildRoute type-safety ──
type RouteParams = {
  readonly login: Record<string, never>;
  readonly signup: Record<string, never>;
  readonly dashboard: Record<string, never>;
  readonly 'landlord.dashboard': Record<string, never>;
  readonly 'landlord.properties': Record<string, never>;
  readonly 'landlord.tenants': Record<string, never>;
  readonly 'landlord.tenantDetail': { readonly tenantId: string };
  readonly 'admin.dashboard': Record<string, never>;
  readonly 'admin.properties': Record<string, never>;
  readonly 'admin.tenants': Record<string, never>;
  readonly 'admin.tenantDetail': { readonly tenantId: string };
  readonly 'tenant.dashboard': Record<string, never>;
};

export type RouteKey = keyof RouteParams;

// ── Type-safe path builder ──
export const buildRoute = <K extends RouteKey>(
  route: K,
  params: RouteParams[K],
): string => {
  const path = ROUTES[route]?.path ?? '/';
  return generatePath(path, params as Record<string, string | null>);
};