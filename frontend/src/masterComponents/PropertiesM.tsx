import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import { toAsyncData, usePagination, useSort, type AsyncData, type SortConfig } from '@/generic';
import type { NavLinkWithId } from '@/generic/utils';

type PropertyOccupancyRow = Database['public']['Views']['property_occupancy']['Row'];

type NavLinkTo = Readonly<{
  readonly property: NavLinkWithId;
  readonly tenant: NavLinkWithId;
}>;

type PropertyDbRow = Database['public']['Tables']['properties']['Row'];
type PropertySortColumn = Extract<keyof PropertyDbRow, 'name' | 'address' | 'property_type' | 'property_status' | 'monthly_rent'>;

type PropertiesPageData = {
  readonly rows: readonly PropertyOccupancyRow[];
  readonly totalCount: number;
};

export type PropertiesSProps = {
  readonly asyncData: AsyncData<PropertiesPageData>;
  readonly navLinkTo: NavLinkTo;
  readonly sort: {
    readonly config: SortConfig<PropertySortColumn>;
    readonly doSort: (column: PropertySortColumn) => void;
  };
  readonly pagination: {
    readonly page: number;
    readonly pageSize: number;
    readonly prevPage: () => void;
    readonly nextPage: () => void;
  };
};

type Props = {
  readonly Slave: ComponentType<PropertiesSProps>;
};

const PAGE_SIZE = 20;

export const PropertiesM = ({
  Slave,
}: Props): JSX.Element => {
  const [sortConfig, onSort] = useSort<PropertySortColumn>('name', 'asc');
  const [pagination, { goToPage, ...pageControls }] = usePagination(1, PAGE_SIZE);

  const doSort = (column: PropertySortColumn): void => {
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
    queryKey: ['properties', sortConfig.column, sortConfig.direction, pagination.page, pagination.pageSize],
    queryFn: async (): Promise<PropertiesPageData> => {
      const ascending = sortConfig.direction === 'asc';
      const from = (pagination.page - 1) * pagination.pageSize;
      const to = from + pagination.pageSize - 1;
      const r = await backendConnector
        .from('property_occupancy')
        .select('*', { count: 'exact' })
        .order(sortConfig.column, { ascending })
        .range(from, to);
      return r.error !== null ? Promise.reject(r.error) : { rows: r.data ?? [], totalCount: r.count ?? 0 };
    },
    placeholderData: (prev) => prev,
  });

  const asyncData = toAsyncData(query, () => { void query.refetch(); }, query.isFetching);

  const navLinkTo: NavLinkTo = {
    property: ({ id, content, style }) => <Link to="/app/properties/$id" params={{ id }} style={style}>{content}</Link>,
    tenant: ({ id, content, style }) => <Link to="/app/tenants/$id" params={{ id }} style={style}>{content}</Link>,
  };

  return <Slave asyncData={asyncData} navLinkTo={navLinkTo} sort={sort} pagination={paginationProps} />;
};