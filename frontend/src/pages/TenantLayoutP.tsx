import { Outlet, NavLink, useLocation } from 'react-router-dom';
import type { LinkComponent } from '@/generic';
import { AuthorisationGuard } from '@/masterComponents/RoleGuardM';
import { AppLayout } from '@/masterComponents/AppLayoutM';
import { AppLayoutShell } from '@/slaveComponents/AppLayouS';
import { AccessGateS } from '@/slaveComponents/AccessGateS';

const links = {
  dashboard: '/tenant',
  contracts: '/tenant/contracts',
  payments: '/tenant/payments',
};

export const TenantLayoutPage = (): JSX.Element => {
  const location = useLocation();

  return (
    <AuthorisationGuard
      authoriseRequirement={{
        isAuthenticated: true,
        roles: ['tenant'],
      }}
      Slave={AccessGateS}
    >
      <AppLayout
        SlaveComponent={AppLayoutShell}
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
