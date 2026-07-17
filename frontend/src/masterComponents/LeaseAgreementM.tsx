import { useCallback } from 'react';
import { useAsync } from 'react-use';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import { useUrls } from '@/hooks/useUrls';
import type { Database } from '@/backendConnector';
import type { AsyncData } from '@/generic';

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

export type LeaseAgreementSProps = {
  readonly asyncData: AsyncData<LeaseAgreementWithRelationships>;
  readonly getTenantUrl: (tenantId: string) => string;
  readonly getPropertyUrl: (propertyId: string) => string;
  readonly getTransactionUrl: (transactionId: string) => string;
  readonly getEditUrl: () => string;
  readonly getBackUrl: () => string;
};

type Props = {
  readonly Slave: ComponentType<LeaseAgreementSProps>;
  readonly id: string;
};

export const LeaseAgreementDetailM = ({
  Slave,
  id,
}: Props): JSX.Element => {
  const { url } = useUrls();

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

  const data: LeaseAgreementWithRelationships = {
    attachments: value?.attachmentsResult.data ?? [],
    leaseAgreement: value?.leaseResult.data ?? null,
    transactions: value?.transactionsResult.data ?? []
  }


  const handleRetry = useCallback((): void => {
    window.location.reload();
  }, []);

  const asyncData: AsyncData<LeaseAgreementWithRelationships> =
    loading ?
      { tag: 'pending' } :
      error ?
        { tag: 'rejected', message: error.message, onRetry: handleRetry } :
        { tag: 'fulfilled', data: data };

  return (
    <Slave
      asyncData={asyncData}
      getTenantUrl={url.tenantDetail}
      getPropertyUrl={url.propertyDetail}
      getTransactionUrl={url.transactionDetail}
      getEditUrl={() => `${url.leaseDetail(id)}/edit`}
      getBackUrl={url.leasesList}
    />
  );
};