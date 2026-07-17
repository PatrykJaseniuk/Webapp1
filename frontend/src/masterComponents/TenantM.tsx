import { match } from 'ts-pattern';
import { useQuery } from '@tanstack/react-query';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import { useUrls } from '@/hooks/useUrls';
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
  readonly getPropertyUrl: (propertyId: string) => string;
  readonly getLeaseUrl: (leaseId: string) => string;
  readonly getTransactionUrl: (transactionId: string) => string;
  readonly getEditUrl: () => string;
  readonly getBackUrl: () => string;
};

type Props = {
  readonly DetailViewComponent: ComponentType<TenantSProps>;
  readonly id: string;
};

export const TenantDetailM = ({
  DetailViewComponent,
  id,
}: Props): JSX.Element => {
  const urls = useUrls();

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

  return match(urls)
    .with({ tag: 'pending' }, () => (
      <DetailViewComponent
        asyncData={{ tag: 'pending' }}
        getPropertyUrl={() => ''}
        getLeaseUrl={() => ''}
        getTransactionUrl={() => ''}
        getEditUrl={() => ''}
        getBackUrl={() => ''}
      />
    ))
    .with({ tag: 'ready' }, ({ url }) => (
      <DetailViewComponent
        asyncData={asyncData}
        getPropertyUrl={url.propertyDetail}
        getLeaseUrl={url.leaseDetail}
        getTransactionUrl={url.transactionDetail}
        getEditUrl={() => `${url.tenantDetail(id)}/edit`}
        getBackUrl={url.tenantsList}
      />
    ))
    .exhaustive();
};