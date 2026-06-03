import { generatePath } from 'react-router-dom';

// ── Route param types ──
type RouteParams = {
  readonly login: Record<string, never>;
  readonly signup: Record<string, never>;
  readonly dashboard: Record<string, never>;
  readonly properties: Record<string, never>;
  readonly tenants: Record<string, never>;
  readonly tenantDetail: { readonly tenantId: string };
};

// ── Route definitions ──
export const ROUTES = {
  login:        { path: '/login' },
  signup:       { path: '/signup' },
  dashboard:    { path: '/' },
  properties:   { path: '/properties' },
  tenants:      { path: '/tenants' },
  tenantDetail: { path: '/tenants/:tenantId' },
} as const satisfies Record<keyof RouteParams, { readonly path: string }>;

export type RouteKey = keyof typeof ROUTES;

// ── Type-safe path builder ──
export const buildRoute = <K extends RouteKey>(
  route: K,
  params: RouteParams[K],
): string => {
  const path: string = ROUTES[route].path;
  return generatePath(path, params as Record<string, string | null>);
};
