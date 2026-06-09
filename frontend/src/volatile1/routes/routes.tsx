import { type ReactNode, createElement } from 'react';
import {
  createHashRouter,
  Navigate,
  Outlet,
  useParams,
  type RouteObject,
} from 'react-router-dom';
import { match } from 'ts-pattern';
import { useAuth, RoleGuard } from '@/volatile1/auth';
import type { AppRole } from '@/volatile1/domain';
import { TenantDetailPage } from '@/volatile2/pages/TenantDetailPage';
import { PropertiesPage } from '@/volatile2/pages/PropertiesPage';
import { LoginPage } from '@/volatile2/pages/LoginPage';
import { AdminDashboardPage } from '@/volatile2/pages/AdminDashboardPage';
import { LandlordDashboardPage } from '@/volatile2/pages/LandlordDashboardPage';
import { SignupPage } from '@/volatile2/pages/SignupPage';
import { TenantDashboardPage } from '@/volatile2/pages/TenantDashboardPage';
import { TenantsPage } from '@/volatile2/pages/TenantsPage';
import { Layout } from '@/volatile2/layout/Layout';
import {
  INHERIT,
  buildPath,
  resolveRoles,
  route,
  routeStatic,
  type RouteNode,
} from './helpers';

// ══════════════════════════════════════════════════════════════
// ROUTE_TREE — single source of truth
// ══════════════════════════════════════════════════════════════

const AUTHED = INHERIT;

const TENANTS_CHILDREN: Readonly<Record<string, RouteNode<AppRole>>> = {
  ':tenantId': route({
    allowedRoles: AUTHED,
    element: TenantDetailPage,
    args: ['tenantId'],
  }),
};

const PROPERTIES_AND_TENANTS: Readonly<Record<string, RouteNode<AppRole>>> = {
  properties: routeStatic({
    allowedRoles: AUTHED,
    navLabel: 'Nieruchomości',
    element: PropertiesPage,
  }),
  tenants: routeStatic({
    allowedRoles: AUTHED,
    navLabel: 'Najemcy',
    element: TenantsPage,
    children: TENANTS_CHILDREN,
  }),
};

const ROUTE_TREE: RouteNode<AppRole> = routeStatic({
  allowedRoles: AUTHED,
  children: {
    login: routeStatic({
      allowedRoles: [],
      element: LoginPage,
    }),
    signup: routeStatic({
      allowedRoles: [],
      element: SignupPage,
    }),
    landlord: routeStatic({
      allowedRoles: ['landlord', 'admin'],
      navLabel: 'Dashboard',
      element: LandlordDashboardPage,
      children: PROPERTIES_AND_TENANTS,
    }),
    admin: routeStatic({
      allowedRoles: ['admin'],
      navLabel: 'Dashboard',
      element: AdminDashboardPage,
      children: PROPERTIES_AND_TENANTS,
    }),
    tenant: routeStatic({
      allowedRoles: ['tenant'],
      navLabel: 'Dashboard',
      element: TenantDashboardPage,
    }),
  },
});

// ══════════════════════════════════════════════════════════════
// Link tree — generateLinksGenerator
// ══════════════════════════════════════════════════════════════

type LinkNode = Record<string, any> & {
  readonly gen: (params?: Record<string, string | number>) => string;
};

const buildLinkGen = (
  node: RouteNode<any>,
  parentPath: string,
): LinkNode => {
  const ownPath = parentPath !== '' ? parentPath : '/';
  const args = node.args;
  const hasArgs = args !== undefined && args.length > 0;

  const genFn: (params?: Record<string, string | number>) => string = hasArgs
    ? (params?: Record<string, string | number>): string => {
        const p = params ?? {};
        const pathWithSegments = args.reduce<string>(
          (acc, arg) => `${acc}/:${arg}`,
          parentPath,
        );
        return pathWithSegments.replace(/:(\w+)/g, (_, key: string) =>
          String(p[key] ?? `:${key}`),
        );
      }
    : (): string => ownPath;

  const nodeChildren = node.children;
  const childEntries =
    nodeChildren !== undefined ? Object.entries(nodeChildren) : [];

  const childrenObj = childEntries.reduce<Record<string, LinkNode>>(
    (acc, [key, child]): Record<string, LinkNode> => {
      const childPath = buildPath(parentPath, key);
      const childLink = buildLinkGen(child, childPath);
      return { ...acc, [key]: childLink };
    },
    {},
  );

  return Object.assign(
    (params?: Record<string, string | number>): string => genFn(params),
    childrenObj,
  ) as unknown as LinkNode;
};

export const link = buildLinkGen(ROUTE_TREE, '');

// ══════════════════════════════════════════════════════════════
// Router — generateRouter
// ══════════════════════════════════════════════════════════════

const ParamsWrapper = ({
  component: Component,
  argNames,
}: {
  readonly component: React.ComponentType<Record<string, string>>;
  readonly argNames: ReadonlyArray<string>;
}): JSX.Element => {
  const raw = useParams<Record<string, string>>();
  const props = argNames.reduce<Record<string, string>>(
    (acc, key) => {
      const value = raw[key];
      return value !== undefined ? { ...acc, [key]: value } : acc;
    },
    {},
  );
  return createElement(Component, props as Record<string, string>);
};

const buildRoutes = (
  node: RouteNode<AppRole>,
  key: string,
  parentRoles: readonly AppRole[],
): RouteObject[] => {
  const resolvedRoles = resolveRoles(node, parentRoles);
  const args = node.args;
  const hasArgs = args !== undefined && args.length > 0;

  const segment = hasArgs ? args.map((a) => `:${a}`).join('/') : key;

  const childEntries =
    node.children !== undefined ? Object.entries(node.children) : [];

  const childRoutes: RouteObject[] = childEntries.flatMap(([childKey, child]) =>
    buildRoutes(child, childKey, resolvedRoles),
  );

  const Element = node.element;
  const wrappedElement: ReactNode =
    Element !== undefined
      ? hasArgs
        ? <ParamsWrapper component={Element} argNames={args} />
        : <Element />
      : null;

  const guardedElement: ReactNode =
    resolvedRoles.length === 0
      ? wrappedElement
      : <RoleGuard allowedRoles={resolvedRoles}>{wrappedElement}</RoleGuard>;

  const routeObj: RouteObject = {
    path: segment,
    element: guardedElement,
    children:
      childRoutes.length > 0
        ? (childRoutes as RouteObject['children'])
        : undefined,
  };

  return [routeObj];
};

const AuthGuard = (): JSX.Element => {
  const authState = useAuth();

  return match(authState)
    .with({ tag: 'loading' }, () => (
      <div className="flex items-center justify-center py-16">
        <p className="text-gray-400">Ładowanie...</p>
      </div>
    ))
    .with({ tag: 'unauthenticated' }, () => <Navigate to="/login" replace />)
    .with({ tag: 'authenticated' }, ({ role }) => (
      <Navigate to={`/${role}`} replace />
    ))
    .exhaustive();
};

const generateRouter = (
  root: RouteNode<AppRole>,
): ReturnType<typeof createHashRouter> => {
  const rootChildren = root.children ?? {};
  const rootEntries = Object.entries(rootChildren);

  const publicRoutes: RouteObject[] = rootEntries
    .filter(([k]) => k === 'login' || k === 'signup')
    .map(([k, child]) => ({
      path: `/${k}`,
      element: child.element !== undefined ? <child.element /> : null,
    }));

  const authedChildRoutes: RouteObject[] = rootEntries
    .filter(([k]) => k !== 'login' && k !== 'signup')
    .flatMap(([k, child]) => {
      const roles = resolveRoles(child, []);

      const nestedChildren =
        child.children !== undefined
          ? Object.entries(child.children).flatMap(([ck, gc]) =>
              buildRoutes(gc, ck, roles),
            )
          : [];

      const Dashboard = child.element;
      const indexRoute: RouteObject = {
        index: true,
        element:
          Dashboard !== undefined
            ? <RoleGuard allowedRoles={roles}><Dashboard /></RoleGuard>
            : null,
      };

      return [
        {
          path: k,
          element: <Outlet />,
          children: [indexRoute, ...nestedChildren],
        },
      ];
    });

  return createHashRouter([
    ...publicRoutes,
    { path: '/', element: <AuthGuard /> },
    {
      element: <Layout />,
      children: authedChildRoutes,
    },
  ]);
};

export const router = generateRouter(ROUTE_TREE);