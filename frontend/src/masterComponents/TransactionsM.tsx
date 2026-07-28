import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import type { AppRole } from '@/hooks/AuthContext';
import { toAsyncData, type AsyncData } from '@/generic';
import type { NavLinkWithId } from '@/generic/utils';

type TransactionDbRow = Database['public']['Tables']['transactions']['Row'];

type TransactionListRow = TransactionDbRow & {
  readonly properties: { readonly name: string } | null;
};

type NavLinkTo = Readonly<{
  readonly transaction: NavLinkWithId;
  readonly property: NavLinkWithId;
  readonly lease: NavLinkWithId;
}>;

export type TransactionsSProps = {
  readonly asyncData: AsyncData<readonly TransactionListRow[]>;
  readonly navLinkTo: NavLinkTo;
};

type Props = {
  readonly Slave: ComponentType<TransactionsSProps>;
  readonly role: AppRole;
};

export const TransactionsM = ({
  Slave,
  role: _role,
}: Props): JSX.Element => {
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

  const asyncData = toAsyncData(query, () => { void query.refetch(); });

  const navLinkTo: NavLinkTo = {
    transaction: ({ id, content, style }) => <Link to="/app/transactions/$id" params={{ id }} style={style}>{content}</Link>,
    property: ({ id, content, style }) => <Link to="/app/properties/$id" params={{ id }} style={style}>{content}</Link>,
    lease: ({ id, content, style }) => <Link to="/app/leases/$id" params={{ id }} style={style}>{content}</Link>,
  };

  return (
    <Slave
      asyncData={asyncData}
      navLinkTo={navLinkTo}
    />
  );
};