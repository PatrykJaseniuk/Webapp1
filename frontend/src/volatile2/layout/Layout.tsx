import { Suspense } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { match } from 'ts-pattern';
import { useAuth, UserMenu } from '@/volatile1/auth';
import { ROUTES, buildRoute } from '@/volatile1/routes';
import type { RouteKey } from '@/volatile1/routes';
import type { AppRole } from '@/volatile1/domain';
import type { FlatRouteEntry } from '@/volatile1/routes';

// ── Sidebar link className helper ──
const sidebarLinkClass = ({
  isActive,
}: {
  readonly isActive: boolean;
}): string =>
  `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-blue-100 text-blue-700'
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
  }`;

// ── Derive nav items from ROUTES for a given role ──
const deriveNavItems = (
  role: AppRole,
): ReadonlyArray<{ readonly routeKey: RouteKey; readonly label: string }> =>
  (Object.entries(ROUTES) as ReadonlyArray<[RouteKey, FlatRouteEntry<AppRole>]>)
    .filter(
      ([_key, entry]) =>
        entry.navLabel !== undefined &&
        entry.allowedRoles.includes(role),
    )
    .map(([key, entry]) => ({
      routeKey: key,
      label: entry.navLabel as string,
    }));

export const Layout = (): JSX.Element => {
  const authState = useAuth();

  const navItems = match(authState)
    .with({ tag: 'authenticated' }, ({ role }) => deriveNavItems(role))
    .otherwise(() => []);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <nav className="flex w-56 shrink-0 flex-col border-r border-gray-200 bg-gray-50 p-4">
        <h2 className="mb-6 text-lg font-bold text-gray-800">WebApp1</h2>
        <ul className="flex-1 space-y-1">
          {navItems.map((item) => (
            <li key={item.routeKey}>
              <NavLink
                to={buildRoute(item.routeKey, {})}
                end
                className={sidebarLinkClass}
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* User info + logout */}
        <UserMenu />
      </nav>

      {/* Main content area */}
      <main className="flex-1 overflow-auto bg-gray-50 p-6">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-16">
              <p className="text-gray-400">Ładowanie...</p>
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
};