import { Link } from '@tanstack/react-router';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import type { AppRole } from '@/hooks/AuthContext';
import { useFilteredPaginatedQuery, type ManyRecordsSlaveProps, type NavLink, type NavLinkWithId } from '@/generic';

type FinancialEntryDbRow = Database['public']['Tables']['financial_entry']['Row'];

type FinancialEntryListRow = FinancialEntryDbRow & {
  readonly property: { readonly name: string } | null;
  readonly lease_agreement: { readonly start_date: string } | null;
};

type NavLinkTo = Readonly<{
  readonly financialEntry: NavLinkWithId;
  readonly property: NavLinkWithId;
  readonly lease: NavLinkWithId;
  readonly create?: NavLink;
}>;

type FinancialEntrySortColumn = Extract<keyof FinancialEntryDbRow, 'value_date' | 'amount'> | 'property';

const SORT_COLUMN_MAP: Readonly<Record<FinancialEntrySortColumn, string>> = Object.freeze({
  value_date: 'value_date',
  amount: 'amount',
  property: 'property(name)',
});

type FinancialEntryFilter = 'text' | 'dateFrom' | 'dateTo';

// Exported so the integration test executes the SAME select strings this master
// ships. PostgREST resolves embedded relationships at request time, so a broken
// embed is invisible to tsc — only running these exact strings catches it.
//
// The `!lease_id` hint names the foreign key explicitly. It is not strictly
// required today (financial_entry.lease_id is the only FK between the two
// tables), but a second FK in either direction would make an unhinted embed
// ambiguous and PostgREST would reject the request with PGRST201. Naming the FK
// costs nothing and keeps that failure mode out of reach.
//
// `property(name)` is a LEFT join on purpose. Most of the ledger has no
// property_id — every accrual charge is lease-only, and deposit cash legs and
// treasury-only movements carry no property either — so an inner join would
// silently hide over half of all entries, including every unpaid charge.
export const FINANCIAL_ENTRY_LIST_SELECT =
  '*, property(name), lease_agreement!lease_id(start_date)';

// Only when filtering BY property name does the join become inner: filtering on
// an embedded column requires it, and rows without a property cannot match the
// text anyway.
export const FINANCIAL_ENTRY_LIST_SELECT_BY_PROPERTY =
  '*, property!inner(name), lease_agreement!lease_id(start_date)';

export type FinancialEntriesSProps = ManyRecordsSlaveProps<FinancialEntryListRow, FinancialEntrySortColumn, NavLinkTo, FinancialEntryFilter>;

type Props = {
  readonly Slave: ComponentType<FinancialEntriesSProps>;
  readonly role: AppRole;
};

export const FinancialEntriesM = ({
  Slave,
  role,
}: Props): JSX.Element => {
  const { asyncData, sort, pagination, filter } = useFilteredPaginatedQuery<FinancialEntryListRow, FinancialEntrySortColumn, FinancialEntryFilter>({
    queryKey: ['financialEntries'],
    defaultSort: { column: 'value_date', direction: 'desc' },
    fetchPage: async ({ sort: sortConfig, from, to, filter: filterConfig }) => {
      const ascending = sortConfig.direction === 'asc';
      const text = filterConfig.text ?? '';
      const dateFrom = filterConfig.dateFrom ?? '';
      const dateTo = filterConfig.dateTo ?? '';
      const baseQuery = backendConnector
        .from('financial_entry')
        .select(
          text.length > 0 ? FINANCIAL_ENTRY_LIST_SELECT_BY_PROPERTY : FINANCIAL_ENTRY_LIST_SELECT,
          { count: 'exact' },
        )
        .order(SORT_COLUMN_MAP[sortConfig.column], { ascending })
        .range(from, to);
      const withText = text.length > 0 ? baseQuery.ilike('property.name', `*${text}*`) : baseQuery;
      const withDateFrom = dateFrom.length > 0 ? withText.gte('value_date', dateFrom) : withText;
      const queryWithFilters = dateTo.length > 0 ? withDateFrom.lte('value_date', dateTo) : withDateFrom;
      const result = await queryWithFilters;
      return result.error !== null ? Promise.reject(result.error) : { rows: result.data ?? [], totalCount: result.count ?? 0 };
    },
  });

  const canCreate = role === 'admin' || role === 'landlord';

  const navLinkTo: NavLinkTo = {
    financialEntry: ({ id, content, style, ariaLabel }) => <Link to="/app/financial-entries/$id" params={{ id }} style={style} aria-label={ariaLabel}>{content}</Link>,
    property: ({ id, content, style }) => <Link to="/app/properties/$id" params={{ id }} style={style}>{content}</Link>,
    lease: ({ id, content, style }) => <Link to="/app/leases/$id" params={{ id }} style={style}>{content}</Link>,
    ...(canCreate ? { create: ({ content, style }) => <Link to="/app/financial-entries/$id" params={{ id: 'new' }} style={style}>{content}</Link> } : {}),
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