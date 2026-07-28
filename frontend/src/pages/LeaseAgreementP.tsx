import { Link } from '@tanstack/react-router';
import { match } from 'ts-pattern';
import { leaseDetailRoute } from '@/main/routes';
import { useAuth } from '@/hooks/AuthContext';
import { LeaseAgreementDetailM } from '@/masterComponents/LeaseAgreementM';
import { LeaseAgreementDetailS } from '@/slaveComponents/LeaseAgreementS';
import { LoadingSpinner } from '@/slaveComponents/LoadingSpinnerS';
import { AccessDenied } from '@/slaveComponents/AccessDeniedS';

const loginLink = <Link to="/login" className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Go to login</Link>;

export const LeaseAgreementDetailPage = (): JSX.Element => {
  const { id } = leaseDetailRoute.useParams();
  const authState = useAuth();

  return match(authState)
    .with({ tag: 'loading' }, () => <LoadingSpinner />)
    .with({ tag: 'unauthenticated' }, () => <AccessDenied loginLink={loginLink} />)
    .with({ tag: 'authenticated', role: 'admin' }, () => <LeaseAgreementDetailM Slave={LeaseAgreementDetailS} id={id} role="admin" />)
    .with({ tag: 'authenticated', role: 'landlord' }, () => <LeaseAgreementDetailM Slave={LeaseAgreementDetailS} id={id} role="landlord" />)
    .with({ tag: 'authenticated', role: 'tenant' }, () => <LeaseAgreementDetailM Slave={LeaseAgreementDetailS} id={id} role="tenant" />)
    .exhaustive();
};