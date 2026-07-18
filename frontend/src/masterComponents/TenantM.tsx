import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from '@tanstack/react-router';
import type { ComponentType, ReactNode } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import { toAsyncData, type AsyncData } from '@/generic';

export type LeaseSummary = Readonly<{
  id: string;
  propertyName: string;
  propertyId: string;
  tenantName: string;
  tenantId: string;
  startDate: string;
  endDate: string | null;
  monthlyRent: number;
  depositAmount: number;
  leaseStatus: string;
}>;

export type TransactionSummary = Readonly<{
  id: string;
  type: string;
  description: string | null;
  amount: number;
  dueDate: string;
  transactionStatus: string;
}>;

export type AttachmentSummary = Readonly<{
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string | null;
  fileSize: number | null;
  description: string | null;
}>;

type TenantRow = Database['public']['Tables']['tenants']['Row'];

type TenantDetailData = Readonly<{
  tenant: TenantRow;
  leases: readonly LeaseSummary[];
  transactions: readonly TransactionSummary[];
  attachments: readonly AttachmentSummary[];
}>;

export type TenantSProps = {
  readonly asyncData: AsyncData<TenantDetailData>;
  readonly onPropertyClick: (propertyId: string) => void;
  readonly onLeaseClick: (leaseId: string) => void;
  readonly onTransactionClick: (transactionId: string) => void;
  readonly editLink: ReactNode;
  readonly backLink: ReactNode;
};

type Props = {
  readonly DetailViewComponent: ComponentType<TenantSProps>;
  readonly id: string;
};

export const TenantDetailM = ({
  DetailViewComponent,
  id,
}: Props): JSX.Element => {
  const navigate = useNavigate();

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

      const tenant = tenantResult.data!;
      const leases: readonly LeaseSummary[] = (leasesResult.data ?? []).map((l) => ({
        id: l.id ?? '',
        propertyName: l.property_name ?? '',
        propertyId: l.property_id ?? '',
        tenantName: l.tenant_name ?? '',
        tenantId: l.tenant_id ?? '',
        startDate: l.start_date ?? '',
        endDate: l.end_date,
        monthlyRent: l.monthly_rent ?? 0,
        depositAmount: l.deposit_amount ?? 0,
        leaseStatus: l.lease_status ?? 'active',
      }));

      const transactions: readonly TransactionSummary[] = (transactionsResult.data ?? []).map((t) => ({
        id: t.id,
        type: t.type,
        description: t.description,
        amount: t.amount,
        dueDate: t.due_date,
        transactionStatus: t.transaction_status,
      }));

      const attachments: readonly AttachmentSummary[] = (attachmentsResult.data ?? []).map((a) => ({
        id: a.id,
        fileName: a.file_name,
        fileUrl: a.file_url,
        fileType: a.file_type,
        fileSize: a.file_size,
        description: a.description,
      }));

      return { tenant, leases, transactions, attachments };
    },
  });

  const asyncData = toAsyncData(query, () => { query.refetch(); });

  const onPropertyClick = (propertyId: string) => { navigate({ to: '/app/properties/$id', params: { id: propertyId } }); };
  const onLeaseClick = (leaseId: string) => { navigate({ to: '/app/leases/$id', params: { id: leaseId } }); };
  const onTransactionClick = (transactionId: string) => { navigate({ to: '/app/transactions/$id', params: { id: transactionId } }); };

  const editLink: ReactNode = <Link to="/app/tenants/$id" params={{ id }} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Edytuj</Link>;
  const backLink: ReactNode = <Link to="/app/tenants" className="text-sm text-blue-600 hover:text-blue-800 hover:underline">← Powrót do listy</Link>;

  return (
    <DetailViewComponent
      asyncData={asyncData}
      onPropertyClick={onPropertyClick}
      onLeaseClick={onLeaseClick}
      onTransactionClick={onTransactionClick}
      editLink={editLink}
      backLink={backLink}
    />
  );
};