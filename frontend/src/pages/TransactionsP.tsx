import { useLocation } from 'react-router-dom';
import { TransactionsM } from '@/masterComponents/TransactionsM';
import { TransactionsS } from '@/slaveComponents/TransactionsS';

export const TransactionsListPage = (): JSX.Element => {
  const { pathname } = useLocation();

  const basePath = pathname.endsWith('/transactions') ? pathname : pathname.replace(/\/+$/, '');
  const rolePrefix = basePath.replace(/\/transactions$/, '');

  const getTransactionUrl = (id: string): string => `#${basePath}/${id}`;
  const getPropertyUrl = (propertyId: string): string => `#${rolePrefix}/properties/${propertyId}`;
  const getLeaseUrl = (leaseId: string): string => `#${rolePrefix}/leases/${leaseId}`;

  return (
    <TransactionsM
      Slave={TransactionsS}
      getTransactionUrl={getTransactionUrl}
      getPropertyUrl={getPropertyUrl}
      getLeaseUrl={getLeaseUrl}
    />
  );
};