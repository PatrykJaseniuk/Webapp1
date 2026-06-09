import { Suspense } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { match } from 'ts-pattern';
import { useAuth, UserMenu } from '@/volatile1/auth';
import { link } from '@/volatile1/routes';

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

type LinkGen = { readonly gen: () => string };

const NAV: Readonly<Record<string, ReadonlyArray<{ readonly to: string; readonly label: string }>>> = {
  landlord: [
    { to: (link.landlord as unknown as LinkGen).gen(), label: 'Dashboard' },
    { to: (link.landlord.properties as unknown as LinkGen).gen(), label: 'Nieruchomości' },
    { to: (link.landlord.tenants as unknown as LinkGen).gen(), label: 'Najemcy' },
  ],
  admin: [
    { to: (link.admin as unknown as LinkGen).gen(), label: 'Dashboard' },
    { to: (link.admin.properties as unknown as LinkGen).gen(), label: 'Nieruchomości' },
    { to: (link.admin.tenants as unknown as LinkGen).gen(), label: 'Najemcy' },
  ],
  tenant: [
    { to: (link.tenant as unknown as LinkGen).gen(), label: 'Dashboard' },
  ],
};

export const Layout = (): JSX.Element => {
  const authState = useAuth();

  const items = match(authState)
    .with({ tag: 'authenticated' }, ({ role }) => NAV[role] ?? [])
    .otherwise(() => []);

  return (
    <div className="flex min-h-screen">
      <nav className="flex w-56 shrink-0 flex-col border-r border-gray-200 bg-gray-50 p-4">
        <h2 className="mb-6 text-lg font-bold text-gray-800">WebApp1</h2>
        <ul className="flex-1 space-y-1">
          {items.map((item, i) => (
            <li key={i}>
              <NavLink to={item.to} end className={sidebarLinkClass}>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
        <UserMenu />
      </nav>

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