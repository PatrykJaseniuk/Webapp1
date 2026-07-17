import { useCallback } from 'react';
import { useAsync } from 'react-use';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import { useUrls } from '@/hooks/useUrls';
import type { Database } from '@/backendConnector';
import type { AsyncData } from '@/generic';

type LeaseAgreementDbRow = Database['public']['Tables']['lease_agreements']['Row']
type LeaseAgreementRow = LeaseAgreementDbRow & {
  readonly tenants: { readonly first_name: string; readonly last_name: string; };
  readonly properties: { readonly name: string; };
};


export type LeaseAgreementsSProps = {
  readonly asyncData: AsyncData<readonly LeaseAgreementRow[]>;
  readonly getLeaseAgreementUrl: (id: string) => string;
  readonly getTenantUrl: (tenantId: string) => string;
  readonly getPropertyUrl: (propertyId: string) => string;
};

type Props = {
  readonly Slave: ComponentType<LeaseAgreementsSProps>;
};

export const LeaseAgreementsM = ({
  Slave,
}: Props): JSX.Element => {
  const { url } = useUrls();

  const { loading, error: fetchError, value } = useAsync(
    async () => await backendConnector
      .from('lease_agreements')
      .select('*, tenants(first_name,last_name), properties(name)')
    , []);

  const error = fetchError ?? value?.error
  const data = value?.data ?? [];

  const handleRetry = useCallback((): void => {
    window.location.reload();
  }, []);

  const asyncData: AsyncData<readonly LeaseAgreementRow[]> =
    loading ?
      { tag: 'pending' } :
      error ?
        { tag: 'rejected', message: error.message, onRetry: handleRetry } :
        { tag: 'fulfilled', data };

  return (
    <Slave
      asyncData={asyncData}
      getLeaseAgreementUrl={url.leaseDetail}
      getTenantUrl={url.tenantDetail}
      getPropertyUrl={url.propertyDetail}
    />
  );
};