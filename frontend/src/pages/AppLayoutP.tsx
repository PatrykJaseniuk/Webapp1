import { Outlet } from '@tanstack/react-router';
import { AuthorisationGuard } from '@/masterComponents/RoleGuardM';
import { AppLayoutM } from '@/masterComponents/AppLayoutM';
import { AppLayoutShell } from '@/slaveComponents/AppLayouS';
import { AccessGateS } from '@/slaveComponents/AccessGateS';

export const AppLayoutPage = (): JSX.Element => (
  <AuthorisationGuard
    authoriseRequirement={{
      isAuthenticated: true,
      roles: ['admin', 'landlord', 'tenant'],
    }}
    Slave={AccessGateS}
  >
    <AppLayoutM Slave={AppLayoutShell}>
      <Outlet />
    </AppLayoutM>
  </AuthorisationGuard>
);