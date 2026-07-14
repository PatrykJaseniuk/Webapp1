import { useCallback } from 'react';
import { useAsync } from 'react-use';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import type { SlaveDataState, LeaseSummary, TransactionSummary, AttachmentSummary } from '@/generic';

type PropertyRow = Database['public']['Tables']['properties']['Row'];

export type PropertyDetailData = Readonly<{
  property: PropertyRow;
  currentTenantName: string | null;
  currentTenantId: string | null;
  leases: readonly LeaseSummary[];
  transactions: readonly TransactionSummary[];
  financialSummary: {
    readonly totalIncome: number;
    readonly totalExpenses: number;
    readonly netProfit: number;
  };
  attachments: readonly AttachmentSummary[];
}>;

export type PropertyDetailViewProps = {
  readonly state: SlaveDataState<PropertyDetailData>;
  readonly getTenantUrl: (tenantId: string) => string;
  readonly getLeaseUrl: (leaseId: string) => string;
  readonly getTransactionUrl: (transactionId: string) => string;
  readonly getEditUrl: () => string;
  readonly getBackUrl: () => string;
};

type Props = {
  readonly DetailViewComponent: ComponentType<PropertyDetailViewProps>;
  readonly id: string;
  readonly getTenantUrl: (tenantId: string) => string;
  readonly getLeaseUrl: (leaseId: string) => string;
  readonly getTransactionUrl: (transactionId: string) => string;
  readonly getEditUrl: () => string;
  readonly getBackUrl: () => string;
};

export const PropertyDetail = ({
  DetailViewComponent,
  id,
  getTenantUrl,
  getLeaseUrl,
  getTransactionUrl,
  getEditUrl,
  getBackUrl,
}: Props): JSX.Element => {
  const { loading, error, value } = useAsync(async (): Promise<PropertyDetailData> => {
    const [propertyResult, occupancyResult, leasesResult, transactionsResult, financialResult, attachmentsResult] =
      await Promise.all([
        backendConnector.from('properties').select('*').eq('id', id).single(),
        backendConnector
          .from('property_occupancy')
          .select('*')
          .eq('id', id)
          .single(),
        backendConnector.from('lease_agreements').select('*').eq('property_id', id).order('start_date', { ascending: false }),
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

    const property = propertyResult.data!;

    const currentTenantName: string | null =
      occupancyResult.data?.current_tenant_name ?? null;
    const currentTenantId: string | null =
      occupancyResult.data?.tenant_id ?? null;

    const leases: readonly LeaseSummary[] = (leasesResult.data ?? []).map((l) => ({
      id: l.id,
      propertyName: property.name,
      propertyId: l.property_id,
      tenantName: '',
      tenantId: l.tenant_id,
      startDate: l.start_date,
      endDate: l.end_date,
      monthlyRent: l.monthly_rent,
      depositAmount: l.deposit_amount,
      leaseStatus: l.lease_status,
    }));

    const transactions: readonly TransactionSummary[] = (transactionsResult.data ?? []).map((t) => ({
      id: t.id,
      type: t.type,
      description: t.description,
      amount: t.amount,
      dueDate: t.due_date,
      transactionStatus: t.transaction_status,
    }));

    const finRow = financialResult.data;

    const attachments: readonly AttachmentSummary[] = (attachmentsResult.data ?? []).map((a) => ({
      id: a.id,
      fileName: a.file_name,
      fileUrl: a.file_url,
      fileType: a.file_type,
      fileSize: a.file_size,
      description: a.description,
    }));

    return {
      property,
      currentTenantName,
      currentTenantId,
      leases,
      transactions,
      financialSummary: {
        totalIncome: finRow?.total_income ?? 0,
        totalExpenses: finRow?.total_expenses ?? 0,
        netProfit: finRow?.net_profit ?? 0,
      },
      attachments,
    };
  }, [id]);

  const handleRetry = useCallback((): void => {
    window.location.reload();
  }, []);

  const state: SlaveDataState<PropertyDetailData> =
    loading ?
      { tag: 'pending' } :
      error !== undefined ?
        { tag: 'rejected', message: error.message, onRetry: handleRetry } :
        { tag: 'fulfilled', data: value! };

  return (
    <DetailViewComponent
      state={state}
      getTenantUrl={getTenantUrl}
      getLeaseUrl={getLeaseUrl}
      getTransactionUrl={getTransactionUrl}
      getEditUrl={getEditUrl}
      getBackUrl={getBackUrl}
    />
  );
};