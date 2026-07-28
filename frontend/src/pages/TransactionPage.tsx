import { Link } from '@tanstack/react-router';
import { match } from 'ts-pattern';
import { transactionDetailRoute } from '@/main/routes';
import { useAuth } from '@/hooks/AuthContext';
import { TransactionDetailM } from '@/masterComponents/TransactionM';
import { TransactionDetailS } from '@/slaveComponents/TransactionS';
import { LoadingSpinner } from '@/slaveComponents/LoadingSpinnerS';
import { AccessDenied } from '@/slaveComponents/AccessDeniedS';

const loginLink = <Link to="/login" className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Go to login</Link>;

export const TransactionDetailPage = (): JSX.Element => {
  const { id } = transactionDetailRoute.useParams();
  const authState = useAuth();

  return match(authState)
    .with({ tag: 'loading' }, () => <LoadingSpinner />)
    .with({ tag: 'unauthenticated' }, () => <AccessDenied loginLink={loginLink} />)
    .with({ tag: 'authenticated', role: 'admin' }, () => <TransactionDetailM Slave={TransactionDetailS} id={id} role="admin" />)
    .with({ tag: 'authenticated', role: 'landlord' }, () => <TransactionDetailM Slave={TransactionDetailS} id={id} role="landlord" />)
    .with({ tag: 'authenticated', role: 'tenant' }, () => <TransactionDetailM Slave={TransactionDetailS} id={id} role="tenant" />)
    .exhaustive();
};