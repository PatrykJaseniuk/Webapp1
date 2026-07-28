import { AuthorisationGuard } from '@/masterComponents/RoleGuardM';
import { PropertiesM } from '@/masterComponents/PropertiesM';
import { PropertiesS } from '@/slaveComponents/PropertiesS';
import { AccessGateS } from '@/slaveComponents/AccessGateS';

export const PropertiesListPage = (): JSX.Element => (
  <AuthorisationGuard
    authoriseRequirement={{ isAuthenticated: true, roles: ['admin', 'landlord'] }}
    Slave={AccessGateS}
  >
    <PropertiesM Slave={PropertiesS} />
  </AuthorisationGuard>
);