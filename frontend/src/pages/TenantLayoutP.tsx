import { Outlet } from 'react-router-dom';
import { AuthorisationGuard } from '@/masterComponents/RoleGuardM';
import { AppLayoutM } from '@/masterComponents/AppLayoutM';
import { AppLayoutShell } from '@/slaveComponents/AppLayouS';
import { AccessGateS } from '@/slaveComponents/AccessGateS';

const links = {
  dashboard: '/tenant',
  contracts: '/tenant/contracts',
  payments: '/tenant/payments',
};

export const TenantLayoutPage = (): JSX.Element => (
  <AuthorisationGuard
    authoriseRequirement={{
      isAuthenticated: true,
      roles: ['tenant'],
    }}
    Slave={AccessGateS}
  >
    <AppLayoutM
      Slave={AppLayoutShell}
      navItems={links}
    >
      <Outlet />
    </AppLayoutM>
  </AuthorisationGuard>
);
