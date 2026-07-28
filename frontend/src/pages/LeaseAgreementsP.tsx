import { AuthorisationGuard } from '@/masterComponents/RoleGuardM';
import { LeaseAgreementsM } from '@/masterComponents/LeaseAgreementsM';
import { LeaseAgreementsS } from '@/slaveComponents/LeaseAgreementsS';
import { AccessGateS } from '@/slaveComponents/AccessGateS';

export const LeaseAgreementsListPage = (): JSX.Element => (
  <AuthorisationGuard
    authoriseRequirement={{ isAuthenticated: true, roles: ['admin', 'landlord', 'tenant'] }}
    Slave={AccessGateS}
  >
    <LeaseAgreementsM Slave={LeaseAgreementsS} />
  </AuthorisationGuard>
);