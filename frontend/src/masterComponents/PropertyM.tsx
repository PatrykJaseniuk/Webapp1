import { useCallback } from 'react';
import { useAsync } from 'react-use';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import type { DataMode } from '@/generic';

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

type Url = {
  readonly getTenantUrl: (tenantId: string) => string;
  readonly getLeaseUrl: (leaseId: string) => string;
  readonly getTransactionUrl: (transactionId: string) => string;
  readonly getEditUrl: () => string;
  readonly getBackUrl: () => string;
};

export type PropertySProps = {
  readonly dataMode: DataMode<PropertyWithRelationships>;
} &
  Url;

type Props = {
  readonly Slave: ComponentType<PropertySProps>;
  readonly id: string;
} &
  Url;

export const PropertyDetailM = ({
  Slave,
  id,
  getTenantUrl,
  getLeaseUrl,
  getTransactionUrl,
  getEditUrl,
  getBackUrl,
}: Props): JSX.Element => {
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

  const dataMode: DataMode<PropertyWithRelationships> =
    loading ?
      { tag: 'pending' } :
      error ?
        { tag: 'rejected', message: error.message, onRetry: handleRetry } :
        { tag: 'fulfilled', data };

  return (
    <Slave
      dataMode={dataMode}
      getTenantUrl={getTenantUrl}
      getLeaseUrl={getLeaseUrl}
      getTransactionUrl={getTransactionUrl}
      getEditUrl={getEditUrl}
      getBackUrl={getBackUrl}
    />
  );
};