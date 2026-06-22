import { Suspense } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const sidebarLinkClass = ({
  isActive,
}: {
  readonly isActive: boolean;
}): string =>
  `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive
    ? 'bg-blue-100 text-blue-700'
    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
  }`;


export const LandlordLayout = (): JSX.Element => {



  return (
    <div className="flex min-h-screen">
      <nav className="flex w-56 shrink-0 flex-col border-r border-gray-200 bg-gray-50 p-4">
        <h2 className="mb-6 text-lg font-bold text-gray-800">WebApp1</h2>
        <ul className="flex-1 space-y-1">
          <li >
            <NavLink to="/" end className={sidebarLinkClass}>root</NavLink>
          </li>

        </ul>
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