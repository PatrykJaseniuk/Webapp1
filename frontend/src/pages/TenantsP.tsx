import { AuthorisationGuard } from '@/masterComponents/RoleGuardM';
import { TenantsM } from '@/masterComponents/TenantsM';
import { TenantsS } from '@/slaveComponents/TenantsS';
import { AccessGateS } from '@/slaveComponents/AccessGateS';

export const TenantsListPage = (): JSX.Element => (
  <AuthorisationGuard
    authoriseRequirement={{ isAuthenticated: true, roles: ['admin', 'landlord'] }}
    Slave={AccessGateS}
  >
    <TenantsM Slave={TenantsS} />
  </AuthorisationGuard>
);