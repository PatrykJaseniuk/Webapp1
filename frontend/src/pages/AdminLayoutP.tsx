import { Outlet, useLocation } from 'react-router-dom';
import { AuthorisationGuard } from '@/masterComponents/RoleGuardM';
import { AppLayoutM } from '@/masterComponents/AppLayoutM';
import { AppLayoutShell } from '@/slaveComponents/AppLayouS';
import { AccessGateS } from '@/slaveComponents/AccessGateS';

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
      Slave={AccessGateS}
    >
      <AppLayoutM
        Slave={AppLayoutShell}
        navItems={links}
        activeTo={location.pathname}
        loginTo="/login"
      >
        <Outlet />
      </AppLayoutM>
    </AuthorisationGuard>
  );
};
