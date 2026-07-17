import { useCallback } from 'react';
import { useAsync } from 'react-use';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import { useUrls } from '@/hooks/useUrls';
import type { Database } from '@/backendConnector';
import type { AsyncData } from '@/generic';

type PropertyDbRow = Database['public']['Tables']['properties']['Row'];
type LeaseAgreementDbRow = Database['public']['Tables']['lease_agreements']['Row'];
type TransactionDbRow = Database['public']['Tables']['transactions']['Row'];
type FinancialSummaryDbRow = Database['public']['Views']['property_financial_summary']['Row'];
type OccupancyDbRow = Database['public']['Views']['property_occupancy']['Row'];
type AttachmentDbRow = Database['public']['Tables']['attachments']['Row'];

type PropertyWithRelationships = Readonly<{
  property: PropertyDbRow | null;
  occupancy: OccupancyDbRow | null;
  leases: readonly (LeaseAgreementDbRow & {
    readonly tenants: { readonly first_name: string; readonly last_name: string; };
  })[];
  transactions: readonly TransactionDbRow[];
  financial: FinancialSummaryDbRow | null;
  attachments: readonly AttachmentDbRow[];
}>;

export type PropertySProps = {
  readonly asyncData: AsyncData<PropertyWithRelationships>;
  readonly getTenantUrl: (tenantId: string) => string;
  readonly getLeaseUrl: (leaseId: string) => string;
  readonly getTransactionUrl: (transactionId: string) => string;
  readonly getEditUrl: () => string;
  readonly getBackUrl: () => string;
};

type Props = {
  readonly Slave: ComponentType<PropertySProps>;
  readonly id: string;
};

export const PropertyDetailM = ({
  Slave,
  id,
}: Props): JSX.Element => {
  const { url } = useUrls();
  const { loading, error: fetchError, value } = useAsync(async () => {
    const [propertyResult, occupancyResult, leasesResult, transactionsResult, financialResult, attachmentsResult] =
      await Promise.all([
        backendConnector.from('properties').select('*').eq('id', id).single(),
        backendConnector
          .from('property_occupancy')
          .select('*')
          .eq('id', id)
          .single(),
        backendConnector
          .from('lease_agreements')
          .select('*, tenants(first_name,last_name)')
          .eq('property_id', id)
          .order('start_date', { ascending: false }),
        backendConnector
          .from('transactions')
          .select('*')
          .eq('property_id', id)
          .order('due_date', { ascending: false })
          .limit(30),
        backendConnector
          .from('property_financial_summary')
          .select('*')
          .eq('property_id', id)
          .single(),
        backendConnector
          .from('attachments')
          .select('*')
          .eq('related_to_type', 'property')
          .eq('related_to_id', id),
      ]);

    return { propertyResult, occupancyResult, leasesResult, transactionsResult, financialResult, attachmentsResult };
  }, [id]);

  const error = fetchError ?? value?.propertyResult.error ?? value?.occupancyResult.error ?? value?.leasesResult.error ?? value?.transactionsResult.error ?? value?.financialResult.error ?? value?.attachmentsResult.error;

  const data: PropertyWithRelationships = {
    property: value?.propertyResult.data ?? null,
    occupancy: value?.occupancyResult.data ?? null,
    leases: value?.leasesResult.data ?? [],
    transactions: value?.transactionsResult.data ?? [],
    financial: value?.financialResult.data ?? null,
    attachments: value?.attachmentsResult.data ?? [],
  };

  const handleRetry = useCallback((): void => {
    window.location.reload();
  }, []);

  const asyncData: AsyncData<PropertyWithRelationships> =
    loading ?
      { tag: 'pending' } :
      error ?
        { tag: 'rejected', message: error.message, onRetry: handleRetry } :
        { tag: 'fulfilled', data };

  return (
    <Slave
      asyncData={asyncData}
      getTenantUrl={url.tenantDetail}
      getLeaseUrl={url.leaseDetail}
      getTransactionUrl={url.transactionDetail}
      getEditUrl={() => `${url.propertyDetail(id)}/edit`}
      getBackUrl={url.propertiesList}
    />
  );
};