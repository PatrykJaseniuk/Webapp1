import { Link } from '@tanstack/react-router';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import { usePaginatedQuery, type ManyRecordsSlaveProps, type NavLinkWithId } from '@/generic';

type TenantDbRow = Database['public']['Tables']['tenants']['Row'];

type TenantListRow = TenantDbRow

type NavLinkTo = Readonly<{
  readonly tenant: NavLinkWithId;
  readonly property: NavLinkWithId;
}>;

type TenantSortColumn = Extract<keyof TenantDbRow, 'last_name' | 'first_name' | 'email' | 'tenant_status'>;

export type TenantsSProps = ManyRecordsSlaveProps<TenantListRow, TenantSortColumn, NavLinkTo, Record<string, never>>;

type Props = {
  readonly Slave: ComponentType<TenantsSProps>;
};

const PAGE_SIZE = 20;

export const TenantsM = ({
  Slave,
}: Props): JSX.Element => {
  const { asyncData, sort, pagination } = usePaginatedQuery<TenantListRow, TenantSortColumn>({
    queryKeyBase: 'tenants',
    defaultSortColumn: 'last_name',
    defaultSortDirection: 'asc',
    pageSize: PAGE_SIZE,
    queryFn: async (sortConfig, from, to) => {
      const ascending = sortConfig.direction === 'asc';
      const r = await backendConnector
        .from('tenants')
        .select('*', { count: 'exact' })
        .order(sortConfig.column, { ascending })
        .range(from, to);
      return r.error !== null ? Promise.reject(r.error) : { rows: r.data ?? [], totalCount: r.count ?? 0 };
    },
  });

  const navLinkTo: NavLinkTo = {
    tenant: ({ id, content, style }) => <Link to="/app/tenants/$id" params={{ id }} style={style}>{content}</Link>,
    property: ({ id, content, style }) => <Link to="/app/properties/$id" params={{ id }} style={style}>{content}</Link>,
  };

  return <Slave asyncData={asyncData} navLinkTo={navLinkTo} sort={sort} pagination={pagination} filter={{}} />;
};