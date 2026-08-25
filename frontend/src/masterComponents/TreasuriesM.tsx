import { Link } from '@tanstack/react-router';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import { useFilteredPaginatedQuery, type ManyRecordsSlaveProps, type NavLink, type NavLinkWithId } from '@/generic';

type TreasuryBalanceDbRow = Database['public']['Views']['treasury_balance']['Row'];

type TreasuryListRow = TreasuryBalanceDbRow & { readonly treasury_id: string };

type NavLinkTo = Readonly<{
  readonly treasury: NavLinkWithId;
  readonly create: NavLink;
}>;

type TreasurySortColumn = Extract<keyof TreasuryBalanceDbRow, 'treasury_name' | 'balance' | 'last_value_date'>;

type TreasuryFilter = 'text';

export type TreasuriesSProps = ManyRecordsSlaveProps<TreasuryListRow, TreasurySortColumn, NavLinkTo, TreasuryFilter>;

type Props = {
  readonly Slave: ComponentType<TreasuriesSProps>;
};

export const TreasuriesM = ({
  Slave,
}: Props): JSX.Element => {
  const { asyncData, sort, pagination, filter } = useFilteredPaginatedQuery<TreasuryListRow, TreasurySortColumn, TreasuryFilter>({
    queryKey: ['treasuries'],
    defaultSort: { column: 'treasury_name', direction: 'asc' },
    fetchPage: async ({ sort: sortConfig, from, to, filter: filterConfig }) => {
      const ascending = sortConfig.direction === 'asc';
      const baseQuery = backendConnector
        .from('treasury_balance')
        .select('*', { count: 'exact' })
        .order(sortConfig.column, { ascending })
        .range(from, to);
      const text = filterConfig.text ?? '';
      const queryWithFilters = text.length > 0 ? baseQuery.ilike('treasury_name', `*${text}*`) : baseQuery;
      const result = await queryWithFilters;
      return result.error !== null
        ? Promise.reject(result.error)
        : { rows: (result.data ?? []) as readonly TreasuryListRow[], totalCount: result.count ?? 0 };
    },
  });

  const navLinkTo: NavLinkTo = {
    treasury: ({ id, content, style, ariaLabel }) => <Link to="/app/treasuries/$id" params={{ id }} style={style} aria-label={ariaLabel}>{content}</Link>,
    create: ({ content, style }) => <Link to="/app/treasuries/$id" params={{ id: 'new' }} style={style}>{content}</Link>,
  };

  return <Slave asyncData={asyncData} navLinkTo={navLinkTo} sort={sort} pagination={pagination} filter={filter} />;
};
