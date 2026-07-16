import { useParams, useLocation } from 'react-router-dom';
import { PropertyDetailM } from '@/masterComponents/PropertyM';
import { PropertyDetailS } from '@/slaveComponents/PropertyS';

export const PropertyDetailPage = (): JSX.Element => {
  const { id } = useParams<{ readonly id: string }>();
  const { pathname } = useLocation();

  const propertiesPath = pathname.replace(/\/[^/]+$/, '');
  const rolePrefix = propertiesPath.replace(/\/properties$/, '');

  const getTenantUrl = (tenantId: string): string => `${rolePrefix}/tenants/${tenantId}`;
  const getLeaseUrl = (leaseId: string): string => `${rolePrefix}/leases/${leaseId}`;
  const getTransactionUrl = (transactionId: string): string => `${rolePrefix}/transactions/${transactionId}`;
  const getEditUrl = (): string => `${rolePrefix}/properties/${id}/edit`;
  const getBackUrl = (): string => `${propertiesPath}`;

  return (
    <PropertyDetailM
      Slave={PropertyDetailS}
      id={id!}
      getTenantUrl={getTenantUrl}
      getLeaseUrl={getLeaseUrl}
      getTransactionUrl={getTransactionUrl}
      getEditUrl={getEditUrl}
      getBackUrl={getBackUrl}
    />
  );
};