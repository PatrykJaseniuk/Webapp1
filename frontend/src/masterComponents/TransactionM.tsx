import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import type { ComponentType, ReactNode } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
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
  readonly propertyLink: ReactNode;
  readonly leaseLink: ReactNode;
  readonly backLink: ReactNode;
};

type Props = {
  readonly DetailViewComponent: ComponentType<TransactionDetailViewProps>;
  readonly id: string;
};

export const TransactionDetail = ({
  DetailViewComponent,
  id,
}: Props): JSX.Element => {
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

  const propertyLink: ReactNode = <Link to="/app/properties/$id" params={{ id }} />;
  const leaseLink: ReactNode = <Link to="/app/leases/$id" params={{ id }} />;
  const backLink: ReactNode = <Link to="/app/transactions">← Powrót</Link>;

  return (
    <DetailViewComponent
      asyncData={asyncData}
      propertyLink={propertyLink}
      leaseLink={leaseLink}
      backLink={backLink}
    />
  );
};