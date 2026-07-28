import { leaseDetailRoute } from '@/main/routes';
import { AuthorisationGuard } from '@/masterComponents/RoleGuardM';
import { LeaseAgreementDetailM } from '@/masterComponents/LeaseAgreementM';
import { LeaseAgreementDetailS } from '@/slaveComponents/LeaseAgreementS';
import { AccessGateS } from '@/slaveComponents/AccessGateS';

export const LeaseAgreementDetailPage = (): JSX.Element => {
  const { id } = leaseDetailRoute.useParams();

  return (
    <AuthorisationGuard
      authoriseRequirement={{ isAuthenticated: true, roles: ['admin', 'landlord', 'tenant'] }}
      Slave={AccessGateS}
    >
      <LeaseAgreementDetailM Slave={LeaseAgreementDetailS} id={id} />
    </AuthorisationGuard>
  );
};