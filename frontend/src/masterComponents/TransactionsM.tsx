import { Link } from '@tanstack/react-router';
import { useState, useCallback } from 'react';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import type { AppRole } from '@/hooks/AuthContext';
import { useFilteredPaginatedQuery, type ManyRecordsSlaveProps } from '@/generic';
import type { NavLinkWithId } from '@/generic';

type TransactionDbRow = Database['public']['Tables']['transactions']['Row'];
type TransactionTypeDb = Database['public']['Enums']['transaction_type'];

type TransactionListRow = TransactionDbRow & {
  readonly properties: { readonly name: string };
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

type TransactionsFilterShape = Readonly<{
  readonly text: string;
  readonly type: string;
  readonly dateFrom: string;
  readonly dateTo: string;
  readonly setText: (v: string) => void;
  readonly setType: (v: string) => void;
  readonly setDateFrom: (v: string) => void;
  readonly setDateTo: (v: string) => void;
}>;

export type TransactionsSProps = ManyRecordsSlaveProps<TransactionListRow, TransactionSortColumn, NavLinkTo, TransactionsFilterShape> & {
  readonly clearFilter: () => void;
  readonly isFilterActive: boolean;
  readonly activeFilterCount: number;
  readonly filterResetKey: number;
};

type Props = {
  readonly Slave: ComponentType<TransactionsSProps>;
  readonly role: AppRole;
};

type TransactionFilterValues = {
  readonly text: string;
  readonly type: string;
  readonly dateFrom: string;
  readonly dateTo: string;
};

const INITIAL_FILTER: TransactionFilterValues = Object.freeze({
  text: '',
  type: '',
  dateFrom: '',
  dateTo: '',
});

const PAGE_SIZE = 20;

export const TransactionsM = ({
  Slave,
  role: _role,
}: Props): JSX.Element => {
  const { asyncData, sort, pagination, filter, clearFilter, isFilterActive, activeFilterCount } = useFilteredPaginatedQuery<TransactionListRow, TransactionSortColumn, TransactionFilterValues, TransactionsFilterShape>({
    queryKeyBase: 'transactions',
    defaultSortColumn: 'due_date',
    defaultSortDirection: 'desc',
    pageSize: PAGE_SIZE,
    initialFilter: INITIAL_FILTER,
    textFilterKey: 'text',
    debounceMs: 300,
    assembleFilter: (values, setters) => ({
      text: values.text,
      type: values.type,
      dateFrom: values.dateFrom,
      dateTo: values.dateTo,
      setText: setters.text,
      setType: setters.type,
      setDateFrom: setters.dateFrom,
      setDateTo: setters.dateTo,
    }),
    queryFn: async (sortConfig, from, to, filterValues) => {
      const ascending = sortConfig.direction === 'asc';
      const baseQuery = backendConnector
        .from('transactions')
        .select('*, properties!inner(name), lease_agreements(start_date)', { count: 'exact' })
        .order(SORT_COLUMN_MAP[sortConfig.column], { ascending })
        .range(from, to);
      const withText = filterValues.text.length > 0 ? baseQuery.or(`description.ilike.*${filterValues.text}*,property_id(name).ilike.*${filterValues.text}*`) : baseQuery;
      const withType = filterValues.type.length > 0 ? withText.eq('type', filterValues.type as TransactionTypeDb) : withText;
      const withDateFrom = filterValues.dateFrom.length > 0 ? withType.gte('due_date', filterValues.dateFrom) : withType;
      const queryWithFilters = filterValues.dateTo.length > 0 ? withDateFrom.lte('due_date', filterValues.dateTo) : withDateFrom;
      const result = await queryWithFilters;
      return result.error !== null ? Promise.reject(result.error) : { rows: result.data ?? [], totalCount: result.count ?? 0 };
    },
  });

  const [filterResetKey, setFilterResetKey] = useState(0);
  const handleClearFilter = useCallback((): void => {
    clearFilter();
    setFilterResetKey((k) => k + 1);
  }, [clearFilter]);

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
      filter={filter}
      clearFilter={handleClearFilter}
      isFilterActive={isFilterActive}
      activeFilterCount={activeFilterCount}
      filterResetKey={filterResetKey}
    />
  );
};