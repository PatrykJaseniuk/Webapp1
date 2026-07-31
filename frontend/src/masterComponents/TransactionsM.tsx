import { Link } from '@tanstack/react-router';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import type { AppRole } from '@/hooks/AuthContext';
import { usePaginatedQuery, type ManyRecordsSlaveProps } from '@/generic';
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

export type TransactionsSProps = ManyRecordsSlaveProps<TransactionListRow, TransactionSortColumn, NavLinkTo>;

type Props = {
  readonly Slave: ComponentType<TransactionsSProps>;
  readonly role: AppRole;
};

const PAGE_SIZE = 20;

export const TransactionsM = ({
  Slave,
  role: _role,
}: Props): JSX.Element => {
  const { asyncData, sort, pagination } = usePaginatedQuery<TransactionListRow, TransactionSortColumn>({
    queryKeyBase: 'transactions',
    defaultSortColumn: 'due_date',
    defaultSortDirection: 'desc',
    pageSize: PAGE_SIZE,
    queryFn: async (sortConfig, from, to) => {
      const ascending = sortConfig.direction === 'asc';
      const r = await backendConnector
        .from('transactions')
        .select('*, properties(name), lease_agreements(start_date)', { count: 'exact' })
        .order(SORT_COLUMN_MAP[sortConfig.column], { ascending })
        .range(from, to);
      return r.error !== null ? Promise.reject(r.error) : { rows: r.data ?? [], totalCount: r.count ?? 0 };
    },
  });

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
      pagination={pagination}
    />
  );
};
