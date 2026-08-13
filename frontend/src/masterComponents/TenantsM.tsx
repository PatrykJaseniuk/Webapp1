import { Link } from '@tanstack/react-router';
import { useState, useCallback } from 'react';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import { useFilteredPaginatedQuery, type FilterSetters, type ManyRecordsSlaveProps } from '@/generic';
import type { NavLinkWithId } from '@/generic';

type TenantDbRow = Database['public']['Tables']['tenants']['Row'];
type TenantStatusDb = Database['public']['Enums']['tenant_status'];

type TenantListRow = TenantDbRow;

type NavLinkTo = Readonly<{
  readonly tenant: NavLinkWithId;
  readonly property: NavLinkWithId;
}>;

type TenantSortColumn = Extract<keyof TenantDbRow, 'last_name' | 'first_name' | 'email' | 'tenant_status'>;

type TenantFilterValues = {
  readonly text: string;
  readonly tenantStatus: string;
};

export type TenantsSProps = ManyRecordsSlaveProps<TenantListRow, TenantSortColumn, NavLinkTo, TenantFilterValues & FilterSetters<TenantFilterValues>> & {
  readonly clearFilter: () => void;
  readonly isFilterActive: boolean;
  readonly activeFilterCount: number;
  readonly filterResetKey: number;
};

type Props = {
  readonly Slave: ComponentType<TenantsSProps>;
};

const INITIAL_FILTER: TenantFilterValues = Object.freeze({
  text: '',
  tenantStatus: '',
});

const PAGE_SIZE = 20;

export const TenantsM = ({
  Slave,
}: Props): JSX.Element => {
  const { asyncData, sort, pagination, filter, clearFilter, isFilterActive, activeFilterCount } = useFilteredPaginatedQuery<TenantListRow, TenantSortColumn, TenantFilterValues>({
    queryKeyBase: 'tenants',
    defaultSortColumn: 'last_name',
    defaultSortDirection: 'asc',
    pageSize: PAGE_SIZE,
    initialFilter: INITIAL_FILTER,
    textFilterKey: 'text',
    debounceMs: 300,
    queryFn: async (sortConfig, from, to, filterValues) => {
      const ascending = sortConfig.direction === 'asc';
      const baseQuery = backendConnector
        .from('tenants')
        .select('*', { count: 'exact' })
        .order(sortConfig.column, { ascending })
        .range(from, to);
      const withText = filterValues.text.length > 0 ? baseQuery.or(`first_name.ilike.*${filterValues.text}*,last_name.ilike.*${filterValues.text}*,email.ilike.*${filterValues.text}*`) : baseQuery;
      const queryWithFilters = filterValues.tenantStatus.length > 0 ? withText.eq('tenant_status', filterValues.tenantStatus as TenantStatusDb) : withText;
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
    tenant: ({ id, content, style, ariaLabel }) => <Link to="/app/tenants/$id" params={{ id }} style={style} aria-label={ariaLabel}>{content}</Link>,
    property: ({ id, content, style }) => <Link to="/app/properties/$id" params={{ id }} style={style}>{content}</Link>,
  };

  return <Slave asyncData={asyncData} navLinkTo={navLinkTo} sort={sort} pagination={pagination} filter={filter} clearFilter={handleClearFilter} isFilterActive={isFilterActive} activeFilterCount={activeFilterCount} filterResetKey={filterResetKey} />;
};