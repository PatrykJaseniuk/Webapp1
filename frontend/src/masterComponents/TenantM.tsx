import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import { toAsyncData, type AsyncData } from '@/generic';
import type { NavLink, NavLinkWithId } from '@/generic/utils';

type TenantRow = Database['public']['Tables']['tenants']['Row'];
type ActiveLeaseRow = Database['public']['Views']['active_leases']['Row'];
type TransactionRow = Database['public']['Tables']['transactions']['Row'];
type AttachmentRow = Database['public']['Tables']['attachments']['Row'];

type TenantDetailData = Readonly<{
  tenant: TenantRow;
  leases: readonly ActiveLeaseRow[];
  transactions: readonly TransactionRow[];
  attachments: readonly AttachmentRow[];
}>;

type NavLinkTo = Readonly<{
  readonly toProperty: NavLinkWithId;
  readonly toLease: NavLinkWithId;
  readonly toTransaction: NavLinkWithId;
  readonly linkToEdit: NavLink;
  readonly linkToTenants: NavLink;
}>;

export type TenantSProps = {
  readonly asyncData: AsyncData<TenantDetailData>;
  readonly navLinkTo: NavLinkTo;
};

type Props = {
  readonly Slave: ComponentType<TenantSProps>;
  readonly id: string;
};

export const TenantDetailM = ({
  Slave,
  id,
}: Props): JSX.Element => {
  const query = useQuery({
    queryKey: ['tenant', id],
    queryFn: async (): Promise<TenantDetailData> => {
      const [tenantResult, leasesResult, attachmentsResult] = await Promise.all([
        backendConnector.from('tenants').select('*').eq('id', id).single(),
        backendConnector.from('active_leases').select('*').eq('tenant_id', id),
        backendConnector
          .from('attachments')
          .select('*')
          .eq('related_to_type', 'tenant')
          .eq('related_to_id', id),
      ]);

      const leaseIds =
        (await backendConnector.from('lease_agreements').select('id').eq('tenant_id', id)).data?.map((l) => l.id) ?? [];
      const transactionsResult =
        await backendConnector
          .from('transactions')
          .select('*')
          .in('lease_id', leaseIds.length > 0 ? leaseIds : ['__none__'])
          .order('due_date', { ascending: false })
          .limit(20);

      const combinedError =
        tenantResult.error ??
        leasesResult.error ??
        attachmentsResult.error ??
        transactionsResult.error;
      if (combinedError !== null) throw combinedError;

      return {
        attachments: attachmentsResult.data ?? [],
        leases: leasesResult.data ?? [],
        tenant: tenantResult.data as NonNullable<typeof tenantResult.data>,
        transactions: transactionsResult.data ?? [],
      };
    },
  });

  const asyncData = toAsyncData(query, () => { void query.refetch(); });

  const navLinkTo: NavLinkTo = {
    toProperty: ({ id: propertyId, content, style }) => <Link to="/app/properties/$id" params={{ id: propertyId }} style={style}>{content}</Link>,
    toLease: ({ id: leaseId, content, style }) => <Link to="/app/leases/$id" params={{ id: leaseId }} style={style}>{content}</Link>,
    toTransaction: ({ id: transactionId, content, style }) => <Link to="/app/transactions/$id" params={{ id: transactionId }} style={style}>{content}</Link>,
    linkToEdit: ({ content, style }) => <Link to="/app/tenants/$id" params={{ id }} style={style}>{content}</Link>,
    linkToTenants: ({ content, style }) => <Link to="/app/tenants" style={style}>{content}</Link>,
  };

  return (
    <Slave
      asyncData={asyncData}
      navLinkTo={navLinkTo}
    />
  );
};