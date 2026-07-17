import { useCallback } from 'react';
import { useAsync } from 'react-use';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import { useUrls } from '@/hooks/useUrls';
import type { Database } from '@/backendConnector';
import type { AsyncData } from '@/generic';

type TransactionDbRow = Database['public']['Tables']['transactions']['Row'];

type TransactionListRow = TransactionDbRow & {
  readonly properties: { readonly name: string } | null;
};

export type TransactionsSProps = {
  readonly asyncData: AsyncData<readonly TransactionListRow[]>;
  readonly getTransactionUrl: (id: string) => string;
  readonly getPropertyUrl: (propertyId: string) => string;
  readonly getLeaseUrl: (leaseId: string) => string;
};

type Props = {
  readonly Slave: ComponentType<TransactionsSProps>;
};

export const TransactionsM = ({
  Slave,
}: Props): JSX.Element => {
  const { url } = useUrls();

  const { loading, error: fetchError, value } = useAsync(
    async () =>
      await backendConnector
        .from('transactions')
        .select('*, properties(name)')
        .order('due_date', { ascending: false })
        .limit(100),
    [],
  );

  const error = fetchError ?? value?.error;
  const data = value?.data ?? [];

  const handleRetry = useCallback((): void => {
    window.location.reload();
  }, []);

  const asyncData: AsyncData<readonly TransactionListRow[]> =
    loading ?
      { tag: 'pending' } :
      error ?
        { tag: 'rejected', message: error.message, onRetry: handleRetry } :
        { tag: 'fulfilled', data };

  return (
    <Slave
      asyncData={asyncData}
      getTransactionUrl={url.transactionDetail}
      getPropertyUrl={url.propertyDetail}
      getLeaseUrl={url.leaseDetail}
    />
  );
};