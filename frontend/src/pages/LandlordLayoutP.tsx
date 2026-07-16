import { Outlet, useLocation } from 'react-router-dom';
import { AuthorisationGuard } from '@/masterComponents/RoleGuardM';
import { AppLayoutM } from '@/masterComponents/AppLayoutM';
import { AppLayoutShell } from '@/slaveComponents/AppLayouS';
import { AccessGateS } from '@/slaveComponents/AccessGateS';

const links = {
  dashboard: '/landlord',
  properties: '/landlord/properties',
  tenants: '/landlord/tenants',
  leases: '/landlord/leases',
  transactions: '/landlord/transactions',
};

export const LandlordLayoutPage = (): JSX.Element => {
  const location = useLocation();

  return (
    <AuthorisationGuard
      authoriseRequirement={{
        isAuthenticated: true,
        roles: ['landlord'],
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
