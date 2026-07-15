import { useCallback } from 'react';
import { useAsync } from 'react-use';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import type { DataMode } from '@/generic';

type LeaseAgreementDbRow = Database['public']['Tables']['lease_agreements']['Row']
type LeaseAgreementRow = LeaseAgreementDbRow & {
  readonly tenants: { readonly first_name: string; readonly last_name: string; };
  readonly properties: { readonly name: string; };
};

type Url = {
  readonly getDetailUrl: (id: string) => string;
  readonly getTenantUrl: (tenantId: string) => string;
  readonly getPropertyUrl: (propertyId: string) => string;
}

export type LeaseAgreementsSProps = {
  readonly dataMode: DataMode<readonly LeaseAgreementRow[]>;
} &
  Url;

type Props = {
  readonly Slave: ComponentType<LeaseAgreementsSProps>;
} &
  Url;

export const LeaseAgreementsM = ({
  Slave,
  getDetailUrl,
  getTenantUrl,
  getPropertyUrl,
}: Props): JSX.Element => {
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

  const dataMode: DataMode<readonly LeaseAgreementRow[]> =
    loading ?
      { tag: 'pending' } :
      error ?
        { tag: 'rejected', message: error.message, onRetry: handleRetry } :
        { tag: 'fulfilled', data };

  return (
    <Slave
      dataMode={dataMode}
      getDetailUrl={getDetailUrl}
      getTenantUrl={getTenantUrl}
      getPropertyUrl={getPropertyUrl}
    />
  );
};