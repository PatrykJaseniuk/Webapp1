import { match } from 'ts-pattern';
import { useQuery } from '@tanstack/react-query';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import { useUrls } from '@/hooks/useUrls';
import type { Database } from '@/backendConnector';
import { toAsyncData, type AsyncData } from '@/generic';

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
  const urls = useUrls();

  const query = useQuery({
    queryKey: ['transaction', id],
    queryFn: async (): Promise<TransactionDetailData> => {
      const { data: txn, error: txnError } = await backendConnector
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single();
      if (txnError !== null) throw txnError;

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
    },
  });

  const asyncData = toAsyncData(query, () => { query.refetch(); });

  return match(urls)
    .with({ tag: 'pending' }, () => (
      <DetailViewComponent
        asyncData={{ tag: 'pending' }}
        getPropertyUrl={() => ''}
        getLeaseUrl={() => ''}
        getBackUrl={() => ''}
      />
    ))
    .with({ tag: 'ready' }, ({ url }) => (
      <DetailViewComponent
        asyncData={asyncData}
        getPropertyUrl={url.propertyDetail}
        getLeaseUrl={url.leaseDetail}
        getBackUrl={url.transactionsList}
      />
    ))
    .exhaustive();
};