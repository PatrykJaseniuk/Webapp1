import { match } from 'ts-pattern';
import { transactionDetailRoute } from '@/main/routes';
import { useAuth } from '@/hooks/AuthContext';
import { TransactionDetailM } from '@/masterComponents/TransactionM';
import { AccessDeniedM } from '@/masterComponents/AccessDeniedM';
import { TransactionDetailS } from '@/slaveComponents/TransactionS';
import { AccessDeniedS } from '@/slaveComponents/AccessDeniedS';
import { LoadingSpinner } from '@/slaveComponents/LoadingSpinnerS';

export const TransactionDetailPage = (): JSX.Element => {
  const { id } = transactionDetailRoute.useParams();
  const authState = useAuth();

  return match(authState)
    .with({ tag: 'loading' }, () => <LoadingSpinner />)
    .with({ tag: 'unauthenticated' }, () => <AccessDeniedM Slave={AccessDeniedS} />)
    .with({ tag: 'authenticated', role: 'admin' }, () => <TransactionDetailM Slave={TransactionDetailS} id={id} role="admin" />)
    .with({ tag: 'authenticated', role: 'landlord' }, () => <TransactionDetailM Slave={TransactionDetailS} id={id} role="landlord" />)
    .with({ tag: 'authenticated', role: 'tenant' }, () => <TransactionDetailM Slave={TransactionDetailS} id={id} role="tenant" />)
    .exhaustive();
};