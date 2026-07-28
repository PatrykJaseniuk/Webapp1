import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import { toAsyncData, type AsyncData } from '@/generic';
import { NavLink, NavLinkWithId } from '@/generic/utils';

type TransactionRow = Database['public']['Tables']['transactions']['Row'];

type TransactionDetailData = Readonly<{
  transaction: TransactionRow;
  propertyName: string | null;
  leaseDescription: string | null;
}>;

type NavLinkTo = Readonly<{
  readonly toProperty: NavLinkWithId;
  readonly toLease: NavLinkWithId;
  readonly linkToTransactions: NavLink;
}>;

export type TransactionSProps = {
  readonly asyncData: AsyncData<TransactionDetailData>;
  readonly navLinkTo: NavLinkTo;
};

type Props = {
  readonly Slave: ComponentType<TransactionSProps>;
  readonly id: string;
};

export const TransactionDetailM = ({
  Slave,
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

  const navLinkTo: NavLinkTo = {
    toProperty: ({ id: propertyId, content, style }) => <Link to="/app/properties/$id" params={{ id: propertyId }} style={style}>{content}</Link>,
    toLease: ({ id: leaseId, content, style }) => <Link to="/app/leases/$id" params={{ id: leaseId }} style={style}>{content}</Link>,
    linkToTransactions: ({ content, style }) => <Link to="/app/transactions" style={style}>{content}</Link>,
  };

  return (
    <Slave
      asyncData={asyncData}
      navLinkTo={navLinkTo}
    />
  );
};