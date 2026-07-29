import { match } from 'ts-pattern';
import { leaseDetailRoute } from '@/main/routes';
import { useAuth } from '@/hooks/AuthContext';
import { LeaseAgreementDetailM } from '@/masterComponents/LeaseAgreementM';
import { AccessDeniedM } from '@/masterComponents/AccessDeniedM';
import { LeaseAgreementDetailS } from '@/slaveComponents/LeaseAgreementS';
import { AccessDeniedS } from '@/slaveComponents/AccessDeniedS';
import { LoadingSpinner } from '@/slaveComponents/LoadingSpinnerS';

export const LeaseAgreementDetailPage = (): JSX.Element => {
  const { id } = leaseDetailRoute.useParams();
  const authState = useAuth();

  return match(authState)
    .with({ tag: 'loading' }, () => <LoadingSpinner />)
    .with({ tag: 'unauthenticated' }, () => <AccessDeniedM Slave={AccessDeniedS} />)
    .with({ tag: 'authenticated', role: 'admin' }, () => <LeaseAgreementDetailM Slave={LeaseAgreementDetailS} id={id} role="admin" />)
    .with({ tag: 'authenticated', role: 'landlord' }, () => <LeaseAgreementDetailM Slave={LeaseAgreementDetailS} id={id} role="landlord" />)
    .with({ tag: 'authenticated', role: 'tenant' }, () => <LeaseAgreementDetailM Slave={LeaseAgreementDetailS} id={id} role="tenant" />)
    .exhaustive();
};
