import { Link } from '@tanstack/react-router';
import { match } from 'ts-pattern';
import { useAuth } from '@/hooks/AuthContext';
import { TransactionsM } from '@/masterComponents/TransactionsM';
import { TransactionsS } from '@/slaveComponents/TransactionsS';
import { LoadingSpinner } from '@/slaveComponents/LoadingSpinnerS';
import { AccessDenied } from '@/slaveComponents/AccessDeniedS';

const loginLink = <Link to="/login" className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Go to login</Link>;

export const TransactionsListPage = (): JSX.Element => {
  const authState = useAuth();

  return match(authState)
    .with({ tag: 'loading' }, () => <LoadingSpinner />)
    .with({ tag: 'unauthenticated' }, () => <AccessDenied loginLink={loginLink} />)
    .with({ tag: 'authenticated', role: 'admin' }, () => <TransactionsM Slave={TransactionsS} role="admin" />)
    .with({ tag: 'authenticated', role: 'landlord' }, () => <TransactionsM Slave={TransactionsS} role="landlord" />)
    .with({ tag: 'authenticated', role: 'tenant' }, () => <TransactionsM Slave={TransactionsS} role="tenant" />)
    .exhaustive();
};