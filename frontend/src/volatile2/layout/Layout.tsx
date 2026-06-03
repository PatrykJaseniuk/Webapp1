import { Suspense } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAsync, useAsyncFn } from 'react-use';
import { backendConnector } from '@/backend/backendConnector';
import { buildRoute } from '@/routes';
import { UserMenu } from '@/auth';

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

export const Layout = (): JSX.Element => {
  const navigate = useNavigate();

  const sessionState = useAsync(
    async () => backendConnector.auth.getSession(),
    [],
  );

  const user =
    !sessionState.loading &&
    sessionState.value !== undefined &&
    sessionState.value.data?.session?.user !== undefined
      ? sessionState.value.data.session.user
      : null;

  const userId: string | null = user?.id ?? null;

  const roleState = useAsync(
    async () =>
      userId !== null
        ? backendConnector
            .from('user_roles')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle()
        : { data: null, error: null },
    [userId],
  );

  const [, signOut] = useAsyncFn(
    async () => backendConnector.auth.signOut(),
  );

  const handleLogout = (): void => {
    signOut().then(() => navigate(buildRoute('login', {})));
  };

  const roleData =
    !roleState.loading && roleState.value !== undefined
      ? roleState.value.data
      : null;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <nav className="flex w-56 shrink-0 flex-col border-r border-gray-200 bg-gray-50 p-4">
        <h2 className="mb-6 text-lg font-bold text-gray-800">WebApp1</h2>
        <ul className="flex-1 space-y-1">
          <li>
            <NavLink
              to={buildRoute('dashboard', {})}
              end
              className={sidebarLinkClass}
            >
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink
              to={buildRoute('properties', {})}
              className={sidebarLinkClass}
            >
              Nieruchomości
            </NavLink>
          </li>
          <li>
            <NavLink
              to={buildRoute('tenants', {})}
              className={sidebarLinkClass}
            >
              Najemcy
            </NavLink>
          </li>
        </ul>

        {/* User info + logout */}
        {user !== null && !roleState.loading && (
          <UserMenu
            user={user}
            role={roleData}
            onLogout={handleLogout}
          />
        )}
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