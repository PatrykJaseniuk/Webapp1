import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import { toAsyncData, usePagination, useSort, type AsyncData, type SortConfig } from '@/generic';
import type { NavLinkWithId } from '@/generic/utils';

type TenantDbRow = Database['public']['Tables']['tenants']['Row'];

type TenantListRow = TenantDbRow

type NavLinkTo = Readonly<{
  readonly tenant: NavLinkWithId;
  readonly property: NavLinkWithId;
}>;

type TenantSortColumn = Extract<keyof TenantDbRow, 'last_name' | 'first_name' | 'email' | 'tenant_status'>;

type TenantsPageData = {
  readonly rows: readonly TenantListRow[];
  readonly totalCount: number;
};

export type TenantsSProps = {
  readonly asyncData: AsyncData<TenantsPageData>;
  readonly navLinkTo: NavLinkTo;
  readonly sort: {
    readonly config: SortConfig<TenantSortColumn>;
    readonly doSort: (column: TenantSortColumn) => void;
  };
  readonly pagination: {
    readonly page: number;
    readonly pageSize: number;
    readonly prevPage: () => void;
    readonly nextPage: () => void;
  };
};

type Props = {
  readonly Slave: ComponentType<TenantsSProps>;
};

const PAGE_SIZE = 20;

export const TenantsM = ({
  Slave,
}: Props): JSX.Element => {
  const [sortConfig, onSort] = useSort<TenantSortColumn>('last_name', 'asc');
  const [pagination, { goToPage, ...pageControls }] = usePagination(1, PAGE_SIZE);

  const doSort = (column: TenantSortColumn): void => {
    onSort(column);
    goToPage(1);
  };
  const sort = { config: sortConfig, doSort };

  const paginationProps = {
    page: pagination.page,
    pageSize: pagination.pageSize,
    prevPage: pageControls.prevPage,
    nextPage: pageControls.nextPage,
  };

  const query = useQuery({
    queryKey: ['tenants', sortConfig.column, sortConfig.direction, pagination.page, pagination.pageSize],
    queryFn: async (): Promise<TenantsPageData> => {
      const ascending = sortConfig.direction === 'asc';
      const from = (pagination.page - 1) * pagination.pageSize;
      const to = from + pagination.pageSize - 1;
      const r = await backendConnector
        .from('tenants')
        .select('*', { count: 'exact' })
        .order(sortConfig.column, { ascending })
        .range(from, to);
      return r.error !== null ? Promise.reject(r.error) : { rows: r.data ?? [], totalCount: r.count ?? 0 };
    },
    placeholderData: (prev) => prev,
  });

  const asyncData = toAsyncData(query, () => { void query.refetch(); }, query.isFetching);

  const navLinkTo: NavLinkTo = {
    tenant: ({ id, content, style }) => <Link to="/app/tenants/$id" params={{ id }} style={style}>{content}</Link>,
    property: ({ id, content, style }) => <Link to="/app/properties/$id" params={{ id }} style={style}>{content}</Link>,
  };

  return <Slave asyncData={asyncData} navLinkTo={navLinkTo} sort={sort} pagination={paginationProps} />;
};