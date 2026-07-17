import { match } from 'ts-pattern';
import { useQuery } from '@tanstack/react-query';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import { useUrls } from '@/hooks/useUrls';
import type { Database } from '@/backendConnector';
import { toAsyncData, type AsyncData } from '@/generic';

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
  const urls = useUrls();
  const query = useQuery({
    queryKey: ['property', id],
    queryFn: async (): Promise<PropertyWithRelationships> => {
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

      const combinedError =
        propertyResult.error ??
        occupancyResult.error ??
        leasesResult.error ??
        transactionsResult.error ??
        financialResult.error ??
        attachmentsResult.error;
      if (combinedError !== null) throw combinedError;

      return {
        property: propertyResult.data ?? null,
        occupancy: occupancyResult.data ?? null,
        leases: leasesResult.data ?? [],
        transactions: transactionsResult.data ?? [],
        financial: financialResult.data ?? null,
        attachments: attachmentsResult.data ?? [],
      };
    },
  });

  const asyncData = toAsyncData(query, () => { query.refetch(); });

  return match(urls)
    .with({ tag: 'pending' }, () => (
      <Slave
        asyncData={{ tag: 'pending' }}
        getTenantUrl={() => ''}
        getLeaseUrl={() => ''}
        getTransactionUrl={() => ''}
        getEditUrl={() => ''}
        getBackUrl={() => ''}
      />
    ))
    .with({ tag: 'ready' }, ({ url }) => (
      <Slave
        asyncData={asyncData}
        getTenantUrl={url.tenantDetail}
        getLeaseUrl={url.leaseDetail}
        getTransactionUrl={url.transactionDetail}
        getEditUrl={() => `${url.propertyDetail(id)}/edit`}
        getBackUrl={url.propertiesList}
      />
    ))
    .exhaustive();
};