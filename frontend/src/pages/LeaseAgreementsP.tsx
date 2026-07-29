import { match } from 'ts-pattern';
import { useAuth } from '@/hooks/AuthContext';
import { LeaseAgreementsM } from '@/masterComponents/LeaseAgreementsM';
import { AccessDeniedM } from '@/masterComponents/AccessDeniedM';
import { LeaseAgreementsS } from '@/slaveComponents/LeaseAgreementsS';
import { AccessDeniedS } from '@/slaveComponents/AccessDeniedS';
import { LoadingSpinner } from '@/slaveComponents/LoadingSpinnerS';

export const LeaseAgreementsListPage = (): JSX.Element => {
  const authState = useAuth();

  return match(authState)
    .with({ tag: 'loading' }, () => <LoadingSpinner />)
    .with({ tag: 'unauthenticated' }, () => <AccessDeniedM Slave={AccessDeniedS} />)
    .with({ tag: 'authenticated', role: 'admin' }, () => <LeaseAgreementsM Slave={LeaseAgreementsS} role="admin" />)
    .with({ tag: 'authenticated', role: 'landlord' }, () => <LeaseAgreementsM Slave={LeaseAgreementsS} role="landlord" />)
    .with({ tag: 'authenticated', role: 'tenant' }, () => <LeaseAgreementsM Slave={LeaseAgreementsS} role="tenant" />)
    .exhaustive();
};
