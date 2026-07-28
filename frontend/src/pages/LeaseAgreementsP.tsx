import { Link } from '@tanstack/react-router';
import { match } from 'ts-pattern';
import { useAuth } from '@/hooks/AuthContext';
import { LeaseAgreementsM } from '@/masterComponents/LeaseAgreementsM';
import { LeaseAgreementsS } from '@/slaveComponents/LeaseAgreementsS';
import { LoadingSpinner } from '@/slaveComponents/LoadingSpinnerS';
import { AccessDenied } from '@/slaveComponents/AccessDeniedS';

const loginLink = <Link to="/login" className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Go to login</Link>;

export const LeaseAgreementsListPage = (): JSX.Element => {
  const authState = useAuth();

  return match(authState)
    .with({ tag: 'loading' }, () => <LoadingSpinner />)
    .with({ tag: 'unauthenticated' }, () => <AccessDenied loginLink={loginLink} />)
    .with({ tag: 'authenticated', role: 'admin' }, () => <LeaseAgreementsM Slave={LeaseAgreementsS} role="admin" />)
    .with({ tag: 'authenticated', role: 'landlord' }, () => <LeaseAgreementsM Slave={LeaseAgreementsS} role="landlord" />)
    .with({ tag: 'authenticated', role: 'tenant' }, () => <LeaseAgreementsM Slave={LeaseAgreementsS} role="tenant" />)
    .exhaustive();
};