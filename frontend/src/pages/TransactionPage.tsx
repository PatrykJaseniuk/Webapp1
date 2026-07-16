import { useParams, useLocation } from 'react-router-dom';
import { TransactionDetail } from '@/masterComponents/TransactionM';
import { TransactionDetailView } from '@/slaveComponents/TransactionS';

export const TransactionDetailPage = (): JSX.Element => {
  const { id } = useParams<{ readonly id: string }>();
  const { pathname } = useLocation();

  const txnPath = pathname.replace(/\/[^/]+$/, '');
  const rolePrefix = txnPath.replace(/\/transactions$/, '');

  const getPropertyUrl = (propertyId: string): string => `#${rolePrefix}/properties/${propertyId}`;
  const getLeaseUrl = (leaseId: string): string => `#${rolePrefix}/leases/${leaseId}`;
  const getBackUrl = (): string => `#${txnPath}`;

  return (
    <TransactionDetail
      DetailViewComponent={TransactionDetailView}
      id={id!}
      getPropertyUrl={getPropertyUrl}
      getLeaseUrl={getLeaseUrl}
      getBackUrl={getBackUrl}
    />
  );
};