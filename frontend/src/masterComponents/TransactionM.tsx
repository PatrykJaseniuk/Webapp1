import { useCallback } from 'react';
import { useAsync } from 'react-use';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import { useUrls } from '@/hooks/useUrls';
import type { Database } from '@/backendConnector';
import type { AsyncData } from '@/generic';

type TransactionRow = Database['public']['Tables']['transactions']['Row'];

export type TransactionDetailData = Readonly<{
  transaction: TransactionRow;
  propertyName: string | null;
  leaseDescription: string | null;
}>;

export type TransactionDetailViewProps = {
  readonly asyncData: AsyncData<TransactionDetailData>;
  readonly getPropertyUrl: (propertyId: string) => string;
  readonly getLeaseUrl: (leaseId: string) => string;
  readonly getBackUrl: () => string;
};

type Props = {
  readonly DetailViewComponent: ComponentType<TransactionDetailViewProps>;
  readonly id: string;
};

export const TransactionDetail = ({
  DetailViewComponent,
  id,
}: Props): JSX.Element => {
  const { url } = useUrls();

  const { loading, error, value } = useAsync(async (): Promise<TransactionDetailData> => {
    const { data: txn, error: txnError } = await backendConnector
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();
    if (txnError !== null) return Promise.reject(txnError);

    const propertyName: string | null =
      txn.property_id !== null ?
        (await backendConnector
          .from('properties')
          .select('name')
          .eq('id', txn.property_id)
          .single()).data?.name ?? null :
        null;

    const leaseDescription: string | null =
      txn.lease_id !== null ?
        ((await backendConnector
          .from('lease_agreements')
          .select('id')
          .eq('id', txn.lease_id)
          .single()).data !== null ?
          `Umowa ${txn.lease_id.slice(0, 8)}...` :
          null) :
        null;

    return { transaction: txn, propertyName, leaseDescription };
  }, [id]);

  const handleRetry = useCallback((): void => {
    window.location.reload();
  }, []);

  const asyncData: AsyncData<TransactionDetailData> =
    loading ?
      { tag: 'pending' } :
      error !== undefined ?
        { tag: 'rejected', message: error.message, onRetry: handleRetry } :
        { tag: 'fulfilled', data: value! };

  return (
    <DetailViewComponent
      asyncData={asyncData}
      getPropertyUrl={url.propertyDetail}
      getLeaseUrl={url.leaseDetail}
      getBackUrl={url.transactionsList}
    />
  );
};