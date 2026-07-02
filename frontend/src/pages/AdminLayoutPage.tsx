import { Outlet, NavLink, useLocation } from 'react-router-dom';
import type { LinkComponent } from '@/generic';
import { AuthorisationGuard } from '@/masterComponents/RoleGuard';
import { AppLayout } from '@/masterComponents/AppLayout';
import { AppLayoutShell } from '@/slaveComponents/AppLayoutShell';
import { LoadingSpinner } from '@/slaveComponents/LoadingSpinner';
import { AccessDenied } from '@/slaveComponents/AccessDenied';


const links = {
  dashboard: '/admin',
  properties: '/admin/properties',
  tenants: '/admin/tenants'
}

export const AdminLayoutPage = (): JSX.Element => {
  const location = useLocation();

  return (
    <AuthorisationGuard
      authoriseRequirement={{
        isAuthenticated: true,
        roles: ['admin'],
      }}
      LoadingComponent={<LoadingSpinner />}
      AccessDeniedComponent={<AccessDenied />}
    >
      <AppLayout
        Shell={AppLayoutShell}
        navItems={links}
        LinkComponent={NavLink as unknown as LinkComponent}
        activeTo={location.pathname}
        loginTo="/login"
      >
        <Outlet />
      </AppLayout>
    </AuthorisationGuard>
  );
};
