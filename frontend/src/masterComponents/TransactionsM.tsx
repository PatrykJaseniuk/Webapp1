import { match } from 'ts-pattern';
import { useQuery } from '@tanstack/react-query';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import { useUrls } from '@/hooks/useUrls';
import type { Database } from '@/backendConnector';
import { toAsyncData, type AsyncData } from '@/generic';

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
  const urls = useUrls();

  const query = useQuery({
    queryKey: ['transactions'],
    queryFn: async (): Promise<readonly TransactionListRow[]> => {
      const r = await backendConnector
        .from('transactions')
        .select('*, properties(name)')
        .order('due_date', { ascending: false })
        .limit(100);
      if (r.error !== null) throw r.error;
      return r.data ?? [];
    },
  });

  const asyncData = toAsyncData(query, () => { query.refetch(); });

  return match(urls)
    .with({ tag: 'pending' }, () => (
      <Slave
        asyncData={{ tag: 'pending' }}
        getTransactionUrl={() => ''}
        getPropertyUrl={() => ''}
        getLeaseUrl={() => ''}
      />
    ))
    .with({ tag: 'ready' }, ({ url }) => (
      <Slave
        asyncData={asyncData}
        getTransactionUrl={url.transactionDetail}
        getPropertyUrl={url.propertyDetail}
        getLeaseUrl={url.leaseDetail}
      />
    ))
    .exhaustive();
};