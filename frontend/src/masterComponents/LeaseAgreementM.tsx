import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import { toAsyncData, type AsyncData } from '@/generic';
import { NavLink } from '@/generic/utils';

type LeaseAgreementDbRow = Database['public']['Tables']['lease_agreements']['Row'];
type TransactionDbRow = Database['public']['Tables']['transactions']['Row'];
type AttachmentDbRow = Database['public']['Tables']['attachments']['Row'];

type LeaseAgreementWithRelationships = Readonly<{
  leaseAgreement: LeaseAgreementDbRow & {
    readonly tenants: { readonly first_name: string; readonly last_name: string; };
    readonly properties: { readonly name: string; };
  } | null;
  transactions: readonly TransactionDbRow[];
  attachments: readonly AttachmentDbRow[];
}>;

type NavLinkTo = Readonly<{
  readonly tenant: NavLink;
  readonly property: NavLink;
  readonly transaction: NavLink;
  readonly edit: NavLink;
  readonly leases: NavLink;
}>;

export type LeaseAgreementSProps = {
  readonly asyncData: AsyncData<LeaseAgreementWithRelationships>;
  readonly navLinkTo: NavLinkTo;
};

type Props = {
  readonly Slave: ComponentType<LeaseAgreementSProps>;
  readonly id: string;
};

export const LeaseAgreementDetailM = ({
  Slave,
  id,
}: Props): JSX.Element => {
  const query = useQuery({
    queryKey: ['leaseAgreement', id],
    queryFn: async (): Promise<LeaseAgreementWithRelationships> => {
      const [leaseResult, transactionsResult, attachmentsResult] = await Promise.all([
        backendConnector
          .from('lease_agreements')
          .select('*, tenants(first_name,last_name), properties(name)')
          .eq('id', id)
          .single(),
        backendConnector
          .from('transactions')
          .select('*')
          .eq('lease_id', id)
          .order('due_date', { ascending: false })
          .limit(30),
        backendConnector
          .from('attachments')
          .select('*')
          .eq('related_to_type', 'lease')
          .eq('related_to_id', id),
      ]);

      const combinedError =
        leaseResult.error ??
        transactionsResult.error ??
        attachmentsResult.error;
      if (combinedError !== null) throw combinedError;

      return {
        attachments: attachmentsResult.data ?? [],
        leaseAgreement: leaseResult.data ?? null,
        transactions: transactionsResult.data ?? [],
      };
    },
  });

  const asyncData = toAsyncData(query, () => { query.refetch(); });

  const navLinkTo: NavLinkTo = {
    tenant: ({ id: tenantId, content, style }) => <Link to="/app/tenants/$id" params={{ id: tenantId }} style={style}>{content}</Link>,
    property: ({ id: propertyId, content, style }) => <Link to="/app/properties/$id" params={{ id: propertyId }} style={style}>{content}</Link>,
    transaction: ({ id: transactionId, content, style }) => <Link to="/app/transactions/$id" params={{ id: transactionId }} style={style}>{content}</Link>,
    edit: ({ id: _id, content, style }) => <Link to="/app/leases/$id" params={{ id }} style={style}>{content}</Link>,
    leases: ({ id: _id, content, style }) => <Link to="/app/leases" style={style}>{content}</Link>,
  };

  return (
    <Slave
      asyncData={asyncData}
      navLinkTo={navLinkTo}
    />
  );
};