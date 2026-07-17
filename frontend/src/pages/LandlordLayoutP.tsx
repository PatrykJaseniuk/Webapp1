import { Outlet } from 'react-router-dom';
import { AuthorisationGuard } from '@/masterComponents/RoleGuardM';
import { AppLayoutM } from '@/masterComponents/AppLayoutM';
import { AppLayoutShell } from '@/slaveComponents/AppLayouS';
import { AccessGateS } from '@/slaveComponents/AccessGateS';

export const LandlordLayoutPage = (): JSX.Element => (
  <AuthorisationGuard
    authoriseRequirement={{
      isAuthenticated: true,
      roles: ['landlord'],
    }}
    Slave={AccessGateS}
  >
    <AppLayoutM Slave={AppLayoutShell}>
      <Outlet />
    </AppLayoutM>
  </AuthorisationGuard>
);