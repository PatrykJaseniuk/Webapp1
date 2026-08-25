import { Link } from '@tanstack/react-router';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import type { AppRole } from '@/hooks/AuthContext';
import { useFilteredPaginatedQuery, type ManyRecordsSlaveProps, type NavLink, type NavLinkWithId } from '@/generic';

type TransactionDbRow = Database['public']['Tables']['transactions']['Row'];

type TransactionListRow = TransactionDbRow & {
  readonly properties: { readonly name: string };
  readonly lease_agreements: { readonly start_date: string } | null;
};

type NavLinkTo = Readonly<{
  readonly transaction: NavLinkWithId;
  readonly property: NavLinkWithId;
  readonly lease: NavLinkWithId;
  readonly create?: NavLink;
}>;

type TransactionSortColumn = Extract<keyof TransactionDbRow, 'due_date' | 'amount'> | 'properties';

const SORT_COLUMN_MAP: Readonly<Record<TransactionSortColumn, string>> = Object.freeze({
  due_date: 'due_date',
  amount: 'amount',
  properties: 'properties(name)',
});

type TransactionFilter = 'text' | 'dateFrom' | 'dateTo';

export type TransactionsSProps = ManyRecordsSlaveProps<TransactionListRow, TransactionSortColumn, NavLinkTo, TransactionFilter>;

type Props = {
  readonly Slave: ComponentType<TransactionsSProps>;
  readonly role: AppRole;
};

export const TransactionsM = ({
  Slave,
  role,
}: Props): JSX.Element => {
  const { asyncData, sort, pagination, filter } = useFilteredPaginatedQuery<TransactionListRow, TransactionSortColumn, TransactionFilter>({
    queryKey: ['transactions'],
    defaultSort: { column: 'due_date', direction: 'desc' },
    fetchPage: async ({ sort: sortConfig, from, to, filter: filterConfig }) => {
      const ascending = sortConfig.direction === 'asc';
      const baseQuery = backendConnector
        .from('transactions')
        .select('*, properties!inner(name), lease_agreements(start_date)', { count: 'exact' })
        .order(SORT_COLUMN_MAP[sortConfig.column], { ascending })
        .range(from, to);
      const text = filterConfig.text ?? '';
      const dateFrom = filterConfig.dateFrom ?? '';
      const dateTo = filterConfig.dateTo ?? '';
      const withText = text.length > 0 ? baseQuery.ilike('properties.name', `*${text}*`) : baseQuery;
      const withDateFrom = dateFrom.length > 0 ? withText.gte('due_date', dateFrom) : withText;
      const queryWithFilters = dateTo.length > 0 ? withDateFrom.lte('due_date', dateTo) : withDateFrom;
      const result = await queryWithFilters;
      return result.error !== null ? Promise.reject(result.error) : { rows: result.data ?? [], totalCount: result.count ?? 0 };
    },
  });

  const canCreate = role === 'admin' || role === 'landlord';

  const navLinkTo: NavLinkTo = {
    transaction: ({ id, content, style, ariaLabel }) => <Link to="/app/transactions/$id" params={{ id }} style={style} aria-label={ariaLabel}>{content}</Link>,
    property: ({ id, content, style }) => <Link to="/app/properties/$id" params={{ id }} style={style}>{content}</Link>,
    lease: ({ id, content, style }) => <Link to="/app/leases/$id" params={{ id }} style={style}>{content}</Link>,
    ...(canCreate ? { create: ({ content, style }) => <Link to="/app/transactions/$id" params={{ id: 'new' }} style={style}>{content}</Link> } : {}),
  };

  return (
    <Slave
      asyncData={asyncData}
      navLinkTo={navLinkTo}
      sort={sort}
      pagination={pagination}
      filter={filter}
    />
  );
};