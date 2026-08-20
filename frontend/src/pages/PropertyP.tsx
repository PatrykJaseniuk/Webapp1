import { match } from 'ts-pattern';
import { propertyDetailRoute } from '@/main/routes';
import { useAuth } from '@/hooks/AuthContext';
import { PropertyDetailM } from '@/masterComponents/PropertyM';
import { AccessDeniedM } from '@/masterComponents/AccessDeniedM';
import { PropertyDetailS } from '@/slaveComponents/PropertyS';
import { AccessDeniedS } from '@/slaveComponents/AccessDeniedS';
import { LoadingSpinner } from '@/slaveComponents/LoadingSpinnerS';

const PropertyPage = ({ id }: { readonly id: string | null }): JSX.Element => {
  const authState = useAuth();

  return match(authState)
    .with({ tag: 'loading' }, () => <LoadingSpinner />)
    .with({ tag: 'unauthenticated' }, () => <AccessDeniedM Slave={AccessDeniedS} />)
    .with({ tag: 'authenticated', role: 'admin' }, () => <PropertyDetailM Slave={PropertyDetailS} id={id} />)
    .with({ tag: 'authenticated', role: 'landlord' }, () => <PropertyDetailM Slave={PropertyDetailS} id={id} />)
    .with({ tag: 'authenticated', role: 'tenant' }, () => <AccessDeniedM Slave={AccessDeniedS} />)
    .exhaustive();
};

export const PropertyDetailPage = (): JSX.Element => {
  const { id } = propertyDetailRoute.useParams();
  return <PropertyPage id={id} />;
};

export const PropertyNewPage = (): JSX.Element => <PropertyPage id={null} />;