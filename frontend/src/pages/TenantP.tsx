import { useParams, useLocation } from 'react-router-dom';
import { TenantsDetail } from '@/masterComponents/TenantM';
import { TenantDetailView } from '@/slaveComponents/TenantS';

export const TenantDetailPage = (): JSX.Element => {
  const { id } = useParams<{ readonly id: string }>();
  const { pathname } = useLocation();

  const tenantsPath = pathname.replace(/\/[^/]+$/, '');
  const rolePrefix = tenantsPath.replace(/\/tenants$/, '');

  const getPropertyUrl = (propertyId: string): string => `#${rolePrefix}/properties/${propertyId}`;
  const getLeaseUrl = (leaseId: string): string => `#${rolePrefix}/leases/${leaseId}`;
  const getTransactionUrl = (transactionId: string): string => `#${rolePrefix}/transactions/${transactionId}`;
  const getEditUrl = (): string => `#${pathname}/edit`;
  const getBackUrl = (): string => `#${tenantsPath}`;

  return (
    <TenantsDetail
      DetailViewComponent={TenantDetailView}
      id={id!}
      getPropertyUrl={getPropertyUrl}
      getLeaseUrl={getLeaseUrl}
      getTransactionUrl={getTransactionUrl}
      getEditUrl={getEditUrl}
      getBackUrl={getBackUrl}
    />
  );
};