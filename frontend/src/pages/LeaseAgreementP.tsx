import { match } from 'ts-pattern';
import { leaseDetailRoute } from '@/main/routes';
import { useAuth } from '@/hooks/AuthContext';
import { LeaseAgreementDetailM, type LeaseAgreementDetailMode } from '@/masterComponents/LeaseAgreementM';
import { AccessDeniedM } from '@/masterComponents/AccessDeniedM';
import { LeaseAgreementDetailS } from '@/slaveComponents/LeaseAgreementS';
import { AccessDeniedS } from '@/slaveComponents/AccessDeniedS';
import { LoadingSpinner } from '@/slaveComponents/LoadingSpinnerS';

export const LeaseAgreementDetailPage = (): JSX.Element => {
  const { id } = leaseDetailRoute.useParams();
  const mode: LeaseAgreementDetailMode = id === 'new' ? { tag: 'create' } : { tag: 'edit', id };
  const authState = useAuth();

  return match(authState)
    .with({ tag: 'loading' }, () => <LoadingSpinner />)
    .with({ tag: 'unauthenticated' }, () => <AccessDeniedM Slave={AccessDeniedS} />)
    .with({ tag: 'authenticated', role: 'admin' }, () => <LeaseAgreementDetailM Slave={LeaseAgreementDetailS} mode={mode} />)
    .with({ tag: 'authenticated', role: 'landlord' }, () => <LeaseAgreementDetailM Slave={LeaseAgreementDetailS} mode={mode} />)
    .with({ tag: 'authenticated', role: 'tenant' }, () => <AccessDeniedM Slave={AccessDeniedS} />)
    .exhaustive();
};
