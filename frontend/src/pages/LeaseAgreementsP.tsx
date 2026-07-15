import { useLocation } from 'react-router-dom';
import { LeaseAgreementsM } from '@/masterComponents/LeaseAgreementsM';
import { LeaseAgreementsTable } from '@/slaveComponents/LeaseAgreementsS';

export const LeaseAgreementsListPage = (): JSX.Element => {
  const { pathname } = useLocation();

  const basePath = pathname.endsWith('/leases') ? pathname : pathname.replace(/\/+$/, '');
  const rolePrefix = basePath.replace(/\/leases$/, '');

  const getDetailUrl = (id: string): string => `#${basePath}/${id}`;
  const getTenantUrl = (tenantId: string): string => `#${rolePrefix}/tenants/${tenantId}`;
  const getPropertyUrl = (propertyId: string): string => `#${rolePrefix}/properties/${propertyId}`;

  return (
    <LeaseAgreementsM
      Slave={LeaseAgreementsTable}
      getDetailUrl={getDetailUrl}
      getTenantUrl={getTenantUrl}
      getPropertyUrl={getPropertyUrl}
    />
  );
};