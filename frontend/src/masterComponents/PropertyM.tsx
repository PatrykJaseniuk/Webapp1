import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import { toAsyncData, type AsyncData } from '@/generic';
import type { NavLink, NavLinkWithId } from '@/generic/utils';

type PropertyDbRow = Database['public']['Tables']['properties']['Row'];
type LeaseAgreementDbRow = Database['public']['Tables']['lease_agreements']['Row'];
type TransactionDbRow = Database['public']['Tables']['transactions']['Row'];
type FinancialSummaryDbRow = Database['public']['Views']['property_financial_summary']['Row'];
type OccupancyDbRow = Database['public']['Views']['property_occupancy']['Row'];
type AttachmentDbRow = Database['public']['Tables']['attachments']['Row'];

type PropertyWithRelationships = Readonly<{
  readonly property: PropertyDbRow | null;
  readonly occupancy: OccupancyDbRow | null;
  readonly leases: readonly (LeaseAgreementDbRow & {
    readonly tenants: { readonly first_name: string; readonly last_name: string; };
  })[];
  readonly transactions: readonly TransactionDbRow[];
  readonly financial: FinancialSummaryDbRow | null;
  readonly attachments: readonly AttachmentDbRow[];
}>;

type NavLinkTo = Readonly<{
  readonly tenant: NavLinkWithId;
  readonly lease: NavLinkWithId;
  readonly transaction: NavLinkWithId;
  readonly edit: NavLink;
  readonly properties: NavLink;
}>;

export type PropertySProps = {
  readonly asyncData: AsyncData<PropertyWithRelationships>;
  readonly navLinkTo: NavLinkTo;
};

type Props = {
  readonly Slave: ComponentType<PropertySProps>;
  readonly id: string;
};

export const PropertyDetailM = ({
  Slave,
  id,
}: Props): JSX.Element => {
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
      return combinedError !== null
        ? Promise.reject(combinedError)
        : {
        property: propertyResult.data ?? null,
        occupancy: occupancyResult.data ?? null,
        leases: leasesResult.data ?? [],
        transactions: transactionsResult.data ?? [],
        financial: financialResult.data ?? null,
        attachments: attachmentsResult.data ?? [],
      };
    },
  });

  const asyncData = toAsyncData(query, () => { void query.refetch(); });

  const navLinkTo: NavLinkTo = {
    tenant: ({ id: tenantId, content, style }) => <Link to="/app/tenants/$id" params={{ id: tenantId }} style={style}>{content}</Link>,
    lease: ({ id: leaseId, content, style }) => <Link to="/app/leases/$id" params={{ id: leaseId }} style={style}>{content}</Link>,
    transaction: ({ id: transactionId, content, style }) => <Link to="/app/transactions/$id" params={{ id: transactionId }} style={style}>{content}</Link>,
    edit: ({ content, style }) => <Link to="/app/properties/$id" params={{ id }} style={style}>{content}</Link>,
    properties: ({ content, style }) => <Link to="/app/properties" style={style}>{content}</Link>,
  };

  return (
    <Slave
      asyncData={asyncData}
      navLinkTo={navLinkTo}
    />
  );
};