import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import { toAsyncData, useSort, type AsyncData, type SortConfig } from '@/generic';
import type { NavLinkWithId } from '@/generic/utils';

type TenantDbRow = Database['public']['Tables']['tenants']['Row'];

type TenantListRow = TenantDbRow

type NavLinkTo = Readonly<{
  readonly tenant: NavLinkWithId;
  readonly property: NavLinkWithId;
}>;

type TenantSortColumn = Extract<keyof TenantDbRow, 'last_name' | 'first_name' | 'email' | 'tenant_status'>;


export type TenantsSProps = {
  readonly asyncData: AsyncData<readonly TenantListRow[]>;
  readonly navLinkTo: NavLinkTo;
  readonly sort: {
    readonly config: SortConfig<TenantSortColumn>;
    readonly doSort: (column: TenantSortColumn) => void;
  };
};

type Props = {
  readonly Slave: ComponentType<TenantsSProps>;
};

export const TenantsM = ({
  Slave,
}: Props): JSX.Element => {
  const [sortConfig, onSort] = useSort<TenantSortColumn>('last_name', 'asc');
  const sort = { config: sortConfig, doSort: onSort };

  const query = useQuery({
    queryKey: ['tenants', sortConfig.column, sortConfig.direction],
    queryFn: async (): Promise<readonly TenantListRow[]> => {
      const ascending = sortConfig.direction === 'asc';
      const r = await backendConnector
        .from('tenants')
        .select('*')
        .order(sortConfig.column, { ascending });
      if (r.error !== null) throw r.error;
      return (r.data ?? []);
    },
  });

  const asyncData = toAsyncData(query, () => { void query.refetch(); });

  const navLinkTo: NavLinkTo = {
    tenant: ({ id, content, style }) => <Link to="/app/tenants/$id" params={{ id }} style={style}>{content}</Link>,
    property: ({ id, content, style }) => <Link to="/app/properties/$id" params={{ id }} style={style}>{content}</Link>,
  };

  return <Slave asyncData={asyncData} navLinkTo={navLinkTo} sort={sort} />;
};
