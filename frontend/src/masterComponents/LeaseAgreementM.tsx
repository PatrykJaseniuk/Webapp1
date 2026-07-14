import { useCallback } from 'react';
import { useAsync } from 'react-use';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import type { SlaveDataState } from '@/generic';

type LeaseRow = Database['public']['Tables']['lease_agreements']['Row'];
type Transactions = readonly Database['public']['Tables']['transactions']['Row'][];
type Attachments = readonly Database['public']['Tables']['attachments']['Row'][];

type LeaseAgreementData = Readonly<{
  lease: LeaseRow;
  tenantName: string;
  propertyName: string;
  transactions: Transactions
  attachments: Attachments;
}>;

export type LeaseAgreementSProps = {
  readonly state: SlaveDataState<LeaseAgreementData>;
  readonly getTenantUrl: (tenantId: string) => string;
  readonly getPropertyUrl: (propertyId: string) => string;
  readonly getTransactionUrl: (transactionId: string) => string;
  readonly getEditUrl: () => string;
  readonly getBackUrl: () => string;
};

type Props = {
  readonly DetailViewComponent: ComponentType<LeaseAgreementSProps>;
  readonly id: string;
  readonly getTenantUrl: (tenantId: string) => string;
  readonly getPropertyUrl: (propertyId: string) => string;
  readonly getTransactionUrl: (transactionId: string) => string;
  readonly getEditUrl: () => string;
  readonly getBackUrl: () => string;
};

export const LeaseAgreementDetail = ({
  DetailViewComponent,
  id,
  getTenantUrl,
  getPropertyUrl,
  getTransactionUrl,
  getEditUrl,
  getBackUrl,
}: Props): JSX.Element => {
  const { loading, error, value } = useAsync(async (): Promise<LeaseAgreementData> => {
    const [leaseResult, transactionsResult, attachmentsResult] = await Promise.all([
      backendConnector.from('lease_agreements').select('*').eq('id', id).single(),
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

    const lease = leaseResult.data!;

    const [tenantResult, propertyResult] = await Promise.all([
      backendConnector.from('tenants').select('first_name,last_name').eq('id', lease.tenant_id).single(),
      backendConnector.from('properties').select('name').eq('id', lease.property_id).single(),
    ]);

    const tenantName = `${tenantResult.data?.first_name ?? ''} ${tenantResult.data?.last_name ?? ''}`.trim();
    const propertyName = propertyResult.data?.name ?? '';

    const transactions = transactionsResult.data ?? [];

    const attachments = attachmentsResult.data ?? []

    return { lease, tenantName, propertyName, transactions, attachments };
  }, [id]);

  const handleRetry = useCallback((): void => {
    window.location.reload();
  }, []);

  const state: SlaveDataState<LeaseAgreementData> =
    loading ?
      { tag: 'pending' } :
      error !== undefined ?
        { tag: 'rejected', message: error.message, onRetry: handleRetry } :
        { tag: 'fulfilled', data: value! };

  return (
    <DetailViewComponent
      state={state}
      getTenantUrl={getTenantUrl}
      getPropertyUrl={getPropertyUrl}
      getTransactionUrl={getTransactionUrl}
      getEditUrl={getEditUrl}
      getBackUrl={getBackUrl}
    />
  );
};