import { useCallback } from 'react';
import { useAsync } from 'react-use';
import { useNavigate } from 'react-router-dom';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import type { AsyncData } from '@/generic';

type LeaseAgreementDbRow = Database['public']['Tables']['lease_agreements']['Row']
type LeaseAgreementRow = LeaseAgreementDbRow & {
  readonly tenants: { readonly first_name: string; readonly last_name: string; };
  readonly properties: { readonly name: string; };
};

type Url = {
  readonly getLeaseAgreementUrl: (id: string) => string;
  readonly getTenantUrl: (tenantId: string) => string;
  readonly getPropertyUrl: (propertyId: string) => string;
}


export type LeaseAgreementsSProps = {
  readonly asyncData: AsyncData<readonly LeaseAgreementRow[]>;
  readonly navigateTo: (url: string) => void;
} &
  Url;

type Props = {
  readonly Slave: ComponentType<LeaseAgreementsSProps>;
} &
  Url;

export const LeaseAgreementsM = ({
  Slave,
  getLeaseAgreementUrl,
  getTenantUrl,
  getPropertyUrl,
}: Props): JSX.Element => {
  const navigate = useNavigate();

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

  const navigateTo = useCallback((url: string): void => {
    navigate(url);
  }, [navigate]);

  const asyncData: AsyncData<readonly LeaseAgreementRow[]> =
    loading ?
      { tag: 'pending' } :
      error ?
        { tag: 'rejected', message: error.message, onRetry: handleRetry } :
        { tag: 'fulfilled', data };

  return (
    <Slave
      asyncData={asyncData}
      navigateTo={navigateTo}
      getLeaseAgreementUrl={getLeaseAgreementUrl}
      getTenantUrl={getTenantUrl}
      getPropertyUrl={getPropertyUrl}
    />
  );
};
