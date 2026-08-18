import { Link } from '@tanstack/react-router';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import { filterTextValue, useFilteredPaginatedQuery, type ManyRecordsSlaveProps, type NavLinkWithId } from '@/generic';

type TenantDbRow = Database['public']['Tables']['tenants']['Row'];
type TenantStatusDb = Database['public']['Enums']['tenant_status'];

type TenantListRow = TenantDbRow;

type NavLinkTo = Readonly<{
  readonly tenant: NavLinkWithId;
  readonly property: NavLinkWithId;
}>;

type TenantSortColumn = Extract<keyof TenantDbRow, 'last_name' | 'first_name' | 'email' | 'tenant_status'>;

type TenantFilter = 'text' | 'tenantStatus';

export type TenantsSProps = ManyRecordsSlaveProps<TenantListRow, TenantSortColumn, NavLinkTo, TenantFilter>;

type Props = {
  readonly Slave: ComponentType<TenantsSProps>;
};

export const TenantsM = ({
  Slave,
}: Props): JSX.Element => {
  const { asyncData, sort, pagination, filter } = useFilteredPaginatedQuery<TenantListRow, TenantSortColumn, TenantFilter>({
    queryKey: ['tenants'],
    defaultSort: { column: 'last_name', direction: 'asc' },
    fetchPage: async ({ sort: sortConfig, from, to, filter: filterConfig }) => {
      const ascending = sortConfig.direction === 'asc';
      const baseQuery = backendConnector
        .from('tenants')
        .select('*', { count: 'exact' })
        .order(sortConfig.column, { ascending })
        .range(from, to);
      const text = filterTextValue(filterConfig.text);
      const tenantStatus = filterTextValue(filterConfig.tenantStatus);
      const withText = text.length > 0 ? baseQuery.or(`first_name.ilike.*${text}*,last_name.ilike.*${text}*,email.ilike.*${text}*`) : baseQuery;
      const queryWithFilters = tenantStatus.length > 0 ? withText.eq('tenant_status', tenantStatus as TenantStatusDb) : withText;
      const result = await queryWithFilters;
      return result.error !== null ? Promise.reject(result.error) : { rows: result.data ?? [], totalCount: result.count ?? 0 };
    },
  });

  const navLinkTo: NavLinkTo = {
    tenant: ({ id, content, style, ariaLabel }) => <Link to="/app/tenants/$id" params={{ id }} style={style} aria-label={ariaLabel}>{content}</Link>,
    property: ({ id, content, style }) => <Link to="/app/properties/$id" params={{ id }} style={style}>{content}</Link>,
  };

  return <Slave asyncData={asyncData} navLinkTo={navLinkTo} sort={sort} pagination={pagination} filter={filter} />;
};