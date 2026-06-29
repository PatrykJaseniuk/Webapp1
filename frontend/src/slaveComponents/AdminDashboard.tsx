import { NavLink } from 'react-router-dom';

const dashboardCardClass =
  'rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm hover:shadow-md transition-shadow';

export const AdminDashboard = (): JSX.Element => (
  <div className="flex flex-col items-center justify-center py-16">
    <h1 className="mb-2 text-3xl font-bold text-gray-900">Panel Administratora</h1>
    <p className="text-gray-500">System zarządzania najmem</p>
    <div className="mt-8 grid gap-4 sm:grid-cols-2">
      <NavLink
        to="/admin/properties"
        className={dashboardCardClass}
      >
        <p className="text-lg font-semibold text-gray-800">Nieruchomości</p>
        <p className="mt-1 text-sm text-gray-500">
          Zarządzaj nieruchomościami
        </p>
      </NavLink>
      <NavLink
        to="/admin/tenants"
        className={dashboardCardClass}
      >
        <p className="text-lg font-semibold text-gray-800">Najemcy</p>
        <p className="mt-1 text-sm text-gray-500">Zarządzaj najemcami</p>
      </NavLink>
    </div>
  </div>
);