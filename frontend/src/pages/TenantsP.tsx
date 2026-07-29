import { match } from 'ts-pattern';
import { useAuth } from '@/hooks/AuthContext';
import { TenantsM } from '@/masterComponents/TenantsM';
import { AccessDeniedM } from '@/masterComponents/AccessDeniedM';
import { TenantsS } from '@/slaveComponents/TenantsS';
import { AccessDeniedS } from '@/slaveComponents/AccessDeniedS';
import { LoadingSpinner } from '@/slaveComponents/LoadingSpinnerS';

export const TenantsListPage = (): JSX.Element => {
  const authState = useAuth();

  return match(authState)
    .with({ tag: 'loading' }, () => <LoadingSpinner />)
    .with({ tag: 'unauthenticated' }, () => <AccessDeniedM Slave={AccessDeniedS} />)
    .with({ tag: 'authenticated', role: 'admin' }, () => <TenantsM Slave={TenantsS} />)
    .with({ tag: 'authenticated', role: 'landlord' }, () => <TenantsM Slave={TenantsS} />)
    .with({ tag: 'authenticated', role: 'tenant' }, () => <AccessDeniedM Slave={AccessDeniedS} />)
    .exhaustive();
};
