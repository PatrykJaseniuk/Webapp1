import { match } from 'ts-pattern';
import { useAuth } from '@/hooks/AuthContext';
import { TransactionsM } from '@/masterComponents/TransactionsM';
import { AccessDeniedM } from '@/masterComponents/AccessDeniedM';
import { TransactionsS } from '@/slaveComponents/TransactionsS';
import { AccessDeniedS } from '@/slaveComponents/AccessDeniedS';
import { LoadingSpinner } from '@/slaveComponents/LoadingSpinnerS';

export const TransactionsListPage = (): JSX.Element => {
  const authState = useAuth();

  return match(authState)
    .with({ tag: 'loading' }, () => <LoadingSpinner />)
    .with({ tag: 'unauthenticated' }, () => <AccessDeniedM Slave={AccessDeniedS} />)
    .with({ tag: 'authenticated', role: 'admin' }, () => <TransactionsM Slave={TransactionsS} role="admin" />)
    .with({ tag: 'authenticated', role: 'landlord' }, () => <TransactionsM Slave={TransactionsS} role="landlord" />)
    .with({ tag: 'authenticated', role: 'tenant' }, () => <TransactionsM Slave={TransactionsS} role="tenant" />)
    .exhaustive();
};
