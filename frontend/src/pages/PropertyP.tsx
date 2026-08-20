import { match } from 'ts-pattern';
import { propertyDetailRoute } from '@/main/routes';
import { useAuth } from '@/hooks/AuthContext';
import { PropertyDetailM, type PropertyDetailMode } from '@/masterComponents/PropertyM';
import { AccessDeniedM } from '@/masterComponents/AccessDeniedM';
import { PropertyDetailS } from '@/slaveComponents/PropertyS';
import { AccessDeniedS } from '@/slaveComponents/AccessDeniedS';
import { LoadingSpinner } from '@/slaveComponents/LoadingSpinnerS';

export const PropertyPage = (): JSX.Element => {
  const { id } = propertyDetailRoute.useParams();
  const mode: PropertyDetailMode = id === 'new' ? { tag: 'create' } : { tag: 'edit', id };
  const authState = useAuth();

  return match(authState)
    .with({ tag: 'loading' }, () => <LoadingSpinner />)
    .with({ tag: 'unauthenticated' }, () => <AccessDeniedM Slave={AccessDeniedS} />)
    .with({ tag: 'authenticated', role: 'admin' }, () => <PropertyDetailM Slave={PropertyDetailS} mode={mode} />)
    .with({ tag: 'authenticated', role: 'landlord' }, () => <PropertyDetailM Slave={PropertyDetailS} mode={mode} />)
    .with({ tag: 'authenticated', role: 'tenant' }, () => <AccessDeniedM Slave={AccessDeniedS} />)
    .exhaustive();
};
