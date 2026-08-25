import { match } from 'ts-pattern';
import { useAuth } from '@/hooks/AuthContext';
import { TreasuriesM } from '@/masterComponents/TreasuriesM';
import { AccessDeniedM } from '@/masterComponents/AccessDeniedM';
import { TreasuriesS } from '@/slaveComponents/TreasuriesS';
import { AccessDeniedS } from '@/slaveComponents/AccessDeniedS';
import { LoadingSpinner } from '@/slaveComponents/LoadingSpinnerS';

export const TreasuriesListPage = (): JSX.Element => {
  const authState = useAuth();

  return match(authState)
    .with({ tag: 'loading' }, () => <LoadingSpinner />)
    .with({ tag: 'unauthenticated' }, () => <AccessDeniedM Slave={AccessDeniedS} />)
    .with({ tag: 'authenticated', role: 'admin' }, () => <TreasuriesM Slave={TreasuriesS} />)
    .with({ tag: 'authenticated', role: 'landlord' }, () => <TreasuriesM Slave={TreasuriesS} />)
    .with({ tag: 'authenticated', role: 'tenant' }, () => <AccessDeniedM Slave={AccessDeniedS} />)
    .exhaustive();
};
