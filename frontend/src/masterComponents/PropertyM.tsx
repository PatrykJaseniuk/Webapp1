import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from '@tanstack/react-router';
import type { ComponentType, ReactNode } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
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
  readonly onTenantClick: (tenantId: string) => void;
  readonly onLeaseClick: (leaseId: string) => void;
  readonly onTransactionClick: (transactionId: string) => void;
  readonly editLink: ReactNode;
  readonly backLink: ReactNode;
};

type Props = {
  readonly Slave: ComponentType<PropertySProps>;
  readonly id: string;
};

export const PropertyDetailM = ({
  Slave,
  id,
}: Props): JSX.Element => {
  const navigate = useNavigate();

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

  const onTenantClick = (tenantId: string) => { navigate({ to: '/app/tenants/$id', params: { id: tenantId } }); };
  const onLeaseClick = (leaseId: string) => { navigate({ to: '/app/leases/$id', params: { id: leaseId } }); };
  const onTransactionClick = (transactionId: string) => { navigate({ to: '/app/transactions/$id', params: { id: transactionId } }); };

  const editLink: ReactNode = <Link to="/app/properties/$id" params={{ id }}>Edytuj</Link>;
  const backLink: ReactNode = <Link to="/app/properties">← Powrót do listy</Link>;

  return (
    <Slave
      asyncData={asyncData}
      onTenantClick={onTenantClick}
      onLeaseClick={onLeaseClick}
      onTransactionClick={onTransactionClick}
      editLink={editLink}
      backLink={backLink}
    />
  );
};