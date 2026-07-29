import { match } from 'ts-pattern';
import { tenantDetailRoute } from '@/main/routes';
import { useAuth } from '@/hooks/AuthContext';
import { TenantDetailM } from '@/masterComponents/TenantM';
import { AccessDeniedM } from '@/masterComponents/AccessDeniedM';
import { TenantDetailS } from '@/slaveComponents/TenantS';
import { AccessDeniedS } from '@/slaveComponents/AccessDeniedS';
import { LoadingSpinner } from '@/slaveComponents/LoadingSpinnerS';

export const TenantDetailPage = (): JSX.Element => {
  const { id } = tenantDetailRoute.useParams();
  const authState = useAuth();

  return match(authState)
    .with({ tag: 'loading' }, () => <LoadingSpinner />)
    .with({ tag: 'unauthenticated' }, () => <AccessDeniedM Slave={AccessDeniedS} />)
    .with({ tag: 'authenticated', role: 'admin' }, () => <TenantDetailM Slave={TenantDetailS} id={id} />)
    .with({ tag: 'authenticated', role: 'landlord' }, () => <TenantDetailM Slave={TenantDetailS} id={id} />)
    .with({ tag: 'authenticated', role: 'tenant' }, () => <AccessDeniedM Slave={AccessDeniedS} />)
    .exhaustive();
};
