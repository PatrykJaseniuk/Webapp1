import { Link } from '@tanstack/react-router';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import type { AppRole } from '@/hooks/AuthContext';
import { useDateOrderedPaginatedQuery, type ManyRecordsSlavePropsFixedOrder, type NavLink, type NavLinkWithId } from '@/generic';

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

// Date range only. A financial table has no sort controls at all (see
// useDateOrderedPaginatedQuery) and no free-text filter: any filter that removes
// rows from the MIDDLE of the series would make the running balance jump by
// amounts the user cannot see.
type FinancialEntryFilter = 'dateFrom' | 'dateTo';

// Exported so the integration test executes the SAME select string this master
// ships. PostgREST resolves embedded relationships at request time, so a broken
// embed is invisible to tsc — only running this exact string catches it.
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

export type FinancialEntriesSProps = ManyRecordsSlavePropsFixedOrder<FinancialEntryListRow, NavLinkTo, FinancialEntryFilter>;

type Props = {
  readonly Slave: ComponentType<FinancialEntriesSProps>;
  readonly role: AppRole;
};

export const FinancialEntriesM = ({
  Slave,
  role,
}: Props): JSX.Element => {
  const { asyncData, pagination, filter } = useDateOrderedPaginatedQuery<FinancialEntryListRow, FinancialEntryFilter>({
    queryKey: ['financialEntries'],
    fetchPage: async ({ from, to, filter: filterConfig }) => {
      const dateFrom = filterConfig.dateFrom ?? '';
      const dateTo = filterConfig.dateTo ?? '';
      const baseQuery = backendConnector
        .from('financial_entry')
        .select(FINANCIAL_ENTRY_LIST_SELECT, { count: 'exact' })
        // A ledger is a sequence, always newest first. `id` breaks ties so that
        // `.range()` paginates over a TOTAL order: rows sharing a value_date
        // (every rent charge dated the 1st) otherwise have no defined order and
        // pagination could repeat one row here and skip another on the next page.
        .order('value_date', { ascending: false })
        .order('id', { ascending: false })
        .range(from, to);
      const withDateFrom = dateFrom.length > 0 ? baseQuery.gte('value_date', dateFrom) : baseQuery;
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
      pagination={pagination}
      filter={filter}
    />
  );
};