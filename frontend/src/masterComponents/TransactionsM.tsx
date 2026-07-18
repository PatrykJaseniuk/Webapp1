import { useNavigate, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import type { ComponentType, ReactNode } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import { toAsyncData, type AsyncData } from '@/generic';

type TransactionDbRow = Database['public']['Tables']['transactions']['Row'];

type TransactionListRow = TransactionDbRow & {
  readonly properties: { readonly name: string } | null;
};

export type TransactionsSProps = {
  readonly asyncData: AsyncData<readonly TransactionListRow[]>;
  readonly onTransactionClick: (id: string) => void;
  readonly renderPropertyLink: (propertyId: string) => ReactNode;
  readonly renderLeaseLink: (leaseId: string) => ReactNode;
};

type Props = {
  readonly Slave: ComponentType<TransactionsSProps>;
};

export const TransactionsM = ({
  Slave,
}: Props): JSX.Element => {
  const navigate = useNavigate();

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

  const onTransactionClick = (id: string): void => {
    navigate({ to: '/app/transactions/$id', params: { id } });
  };

  const renderPropertyLink = (propertyId: string): ReactNode =>
    <Link to="/app/properties/$id" params={{ id: propertyId }} />;

  const renderLeaseLink = (leaseId: string): ReactNode =>
    <Link to="/app/leases/$id" params={{ id: leaseId }} />;

  return (
    <Slave
      asyncData={asyncData}
      onTransactionClick={onTransactionClick}
      renderPropertyLink={renderPropertyLink}
      renderLeaseLink={renderLeaseLink}
    />
  );
};