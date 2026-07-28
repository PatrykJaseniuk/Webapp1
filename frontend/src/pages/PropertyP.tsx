import { Link } from '@tanstack/react-router';
import { match } from 'ts-pattern';
import { propertyDetailRoute } from '@/main/routes';
import { useAuth } from '@/hooks/AuthContext';
import { PropertyDetailM } from '@/masterComponents/PropertyM';
import { PropertyDetailS } from '@/slaveComponents/PropertyS';
import { LoadingSpinner } from '@/slaveComponents/LoadingSpinnerS';
import { AccessDenied } from '@/slaveComponents/AccessDeniedS';

const loginLink = <Link to="/login" className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Go to login</Link>;

export const PropertyDetailPage = (): JSX.Element => {
  const { id } = propertyDetailRoute.useParams();
  const authState = useAuth();

  return match(authState)
    .with({ tag: 'loading' }, () => <LoadingSpinner />)
    .with({ tag: 'unauthenticated' }, () => <AccessDenied loginLink={loginLink} />)
    .with({ tag: 'authenticated', role: 'admin' }, () => <PropertyDetailM Slave={PropertyDetailS} id={id} />)
    .with({ tag: 'authenticated', role: 'landlord' }, () => <PropertyDetailM Slave={PropertyDetailS} id={id} />)
    .with({ tag: 'authenticated', role: 'tenant' }, () => <AccessDenied loginLink={<></>} />)
    .exhaustive();
};