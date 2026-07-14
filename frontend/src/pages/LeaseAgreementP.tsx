import { useParams, useLocation } from 'react-router-dom';
import { LeaseAgreementDetail } from '@/masterComponents/LeaseAgreementM';
import { LeaseAgreementDetailView } from '@/slaveComponents/LeaseAgreementS';

export const LeaseAgreementDetailPage = (): JSX.Element => {
  const { id } = useParams<{ readonly id: string }>();
  const { pathname } = useLocation();

  const leasesPath = pathname.replace(/\/[^/]+$/, '');
  const rolePrefix = leasesPath.replace(/\/leases$/, '');

  const getTenantUrl = (tenantId: string): string => `#${rolePrefix}/tenants/${tenantId}`;
  const getPropertyUrl = (propertyId: string): string => `#${rolePrefix}/properties/${propertyId}`;
  const getTransactionUrl = (transactionId: string): string => `#${rolePrefix}/transactions/${transactionId}`;
  const getEditUrl = (): string => `#${rolePrefix}/leases/${id}/edit`;
  const getBackUrl = (): string => `#${leasesPath}`;

  return (
    <LeaseAgreementDetail
      DetailViewComponent={LeaseAgreementDetailView}
      id={id!}
      getTenantUrl={getTenantUrl}
      getPropertyUrl={getPropertyUrl}
      getTransactionUrl={getTransactionUrl}
      getEditUrl={getEditUrl}
      getBackUrl={getBackUrl}
    />
  );
};