import { Outlet } from 'react-router-dom';
import { AuthorisationGuard } from '@/masterComponents/RoleGuardM';
import { AppLayoutM } from '@/masterComponents/AppLayoutM';
import { AppLayoutShell } from '@/slaveComponents/AppLayouS';
import { AccessGateS } from '@/slaveComponents/AccessGateS';

const links = {
  dashboard: '/admin',
  properties: '/admin/properties',
  tenants: '/admin/tenants',
  leases: '/admin/leases',
  transactions: '/admin/transactions',
}

export const AdminLayoutPage = (): JSX.Element => (
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
      loginTo="/login"
    >
      <Outlet />
    </AppLayoutM>
  </AuthorisationGuard>
);
