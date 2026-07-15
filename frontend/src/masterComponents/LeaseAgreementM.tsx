import { useCallback } from 'react';
import { useAsync } from 'react-use';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import type { DataMode } from '@/generic';

type LeaseAgreementRow = Database['public']['Tables']['lease_agreements']['Row'];
type TransactionRow = Database['public']['Tables']['transactions']['Row'];
type AttachmentRow = Database['public']['Tables']['attachments']['Row'];

type LeaseAgreementData = Readonly<{
  leaseAgreement: LeaseAgreementRow & {
    readonly tenants: { readonly first_name: string; readonly last_name: string; };
    readonly properties: { readonly name: string; };
  } | null;
  transactions: readonly TransactionRow[];
  attachments: readonly AttachmentRow[];
}>;

type Url = {
  readonly getTenantUrl: (tenantId: string) => string;
  readonly getPropertyUrl: (propertyId: string) => string;
  readonly getTransactionUrl: (transactionId: string) => string;
  readonly getEditUrl: () => string;
  readonly getBackUrl: () => string;
}

export type LeaseAgreementSProps = {
  readonly dataMode: DataMode<LeaseAgreementData>;
} &
  Url;

type Props = {
  readonly DetailViewComponent: ComponentType<LeaseAgreementSProps>;
  readonly id: string;
} &
  Url;

export const LeaseAgreementDetailM = ({
  DetailViewComponent,
  id,
  getTenantUrl,
  getPropertyUrl,
  getTransactionUrl,
  getEditUrl,
  getBackUrl,
}: Props): JSX.Element => {
  const { loading, error: fetchError, value } = useAsync(async () => {
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

    return { leaseResult, transactionsResult, attachmentsResult };
  }, [id]);

  const error = fetchError ?? value?.attachmentsResult.error ?? value?.leaseResult.error ?? value?.transactionsResult.error

  const data: LeaseAgreementData = {
    attachments: value?.attachmentsResult.data ?? [],
    leaseAgreement: value?.leaseResult.data ?? null,
    transactions: value?.transactionsResult.data ?? []
  }


  const handleRetry = useCallback((): void => {
    window.location.reload();
  }, []);

  const dataMode: DataMode<LeaseAgreementData> =
    loading ?
      { tag: 'pending' } :
      error ?
        { tag: 'rejected', message: error.message, onRetry: handleRetry } :
        { tag: 'fulfilled', data: data };

  return (
    <DetailViewComponent
      dataMode={dataMode}
      getTenantUrl={getTenantUrl}
      getPropertyUrl={getPropertyUrl}
      getTransactionUrl={getTransactionUrl}
      getEditUrl={getEditUrl}
      getBackUrl={getBackUrl}
    />
  );
};
