import { match } from 'ts-pattern';
import { useAuth } from '@/hooks/AuthContext';
import { PropertiesM } from '@/masterComponents/PropertiesM';
import { AccessDeniedM } from '@/masterComponents/AccessDeniedM';
import { PropertiesS } from '@/slaveComponents/PropertiesS';
import { AccessDeniedS } from '@/slaveComponents/AccessDeniedS';
import { LoadingSpinner } from '@/slaveComponents/LoadingSpinnerS';

export const PropertiesListPage = (): JSX.Element => {
  const authState = useAuth();

  return match(authState)
    .with({ tag: 'loading' }, () => <LoadingSpinner />)
    .with({ tag: 'unauthenticated' }, () => <AccessDeniedM Slave={AccessDeniedS} />)
    .with({ tag: 'authenticated', role: 'admin' }, () => <PropertiesM Slave={PropertiesS} />)
    .with({ tag: 'authenticated', role: 'landlord' }, () => <PropertiesM Slave={PropertiesS} />)
    .with({ tag: 'authenticated', role: 'tenant' }, () => <AccessDeniedM Slave={AccessDeniedS} />)
    .exhaustive();
};
