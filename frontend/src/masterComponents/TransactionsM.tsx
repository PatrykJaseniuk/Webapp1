import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import type { AppRole } from '@/hooks/AuthContext';
import { toAsyncData, useSort, type AsyncData, type SortConfig } from '@/generic';
import type { NavLinkWithId } from '@/generic';

type TransactionDbRow = Database['public']['Tables']['transactions']['Row'];

type TransactionListRow = TransactionDbRow & {
  readonly properties: { readonly name: string } | null;
  readonly lease_agreements: { readonly start_date: string } | null;
};

type NavLinkTo = Readonly<{
  readonly transaction: NavLinkWithId;
  readonly property: NavLinkWithId;
  readonly lease: NavLinkWithId;
}>;

type TransactionSortColumn = Extract<keyof TransactionDbRow, 'due_date' | 'type' | 'amount' | 'transaction_status'> | 'properties';

const SORT_COLUMN_MAP: Readonly<Record<TransactionSortColumn, string>> = Object.freeze({
  due_date: 'due_date',
  type: 'type',
  amount: 'amount',
  transaction_status: 'transaction_status',
  properties: 'properties(name)',
});

export type TransactionsSProps = {
  readonly asyncData: AsyncData<readonly TransactionListRow[]>;
  readonly navLinkTo: NavLinkTo;
  readonly sort: {
    readonly config: SortConfig<TransactionSortColumn>;
    readonly doSort: (column: TransactionSortColumn) => void;
  };
};

type Props = {
  readonly Slave: ComponentType<TransactionsSProps>;
  readonly role: AppRole;
};

export const TransactionsM = ({
  Slave,
  role: _role,
}: Props): JSX.Element => {
  const [sortConfig, onSort] = useSort<TransactionSortColumn>('due_date', 'desc');
  const sort = { config: sortConfig, doSort: onSort };

  const query = useQuery({
    queryKey: ['transactions', sortConfig.column, sortConfig.direction],
    queryFn: async (): Promise<readonly TransactionListRow[]> => {
      const ascending = sortConfig.direction === 'asc';
      const r = await backendConnector
        .from('transactions')
        .select('*, properties(name), lease_agreements(start_date)')
        .order(SORT_COLUMN_MAP[sortConfig.column], { ascending })
        .limit(100);
      if (r.error !== null) throw r.error;
      return r.data ?? [];
    },
    placeholderData: (prev) => prev,
  });

  const asyncData = toAsyncData(query, () => { void query.refetch(); }, query.isFetching);

  const navLinkTo: NavLinkTo = {
    transaction: ({ id, content, style, ariaLabel }) => <Link to="/app/transactions/$id" params={{ id }} style={style} aria-label={ariaLabel}>{content}</Link>,
    property: ({ id, content, style }) => <Link to="/app/properties/$id" params={{ id }} style={style}>{content}</Link>,
    lease: ({ id, content, style }) => <Link to="/app/leases/$id" params={{ id }} style={style}>{content}</Link>,
  };

  return (
    <Slave
      asyncData={asyncData}
      navLinkTo={navLinkTo}
      sort={sort}
    />
  );
};
