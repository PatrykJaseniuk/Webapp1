import { Link } from '@tanstack/react-router';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import { usePaginatedQuery, type ManyRecordsSlaveProps, type NavLinkWithId } from '@/generic';

type PropertyOccupancyRow = Database['public']['Views']['property_occupancy']['Row'];

type NavLinkTo = Readonly<{
  readonly property: NavLinkWithId;
  readonly tenant: NavLinkWithId;
}>;

type PropertyDbRow = Database['public']['Tables']['properties']['Row'];
type PropertySortColumn = Extract<keyof PropertyDbRow, 'name' | 'address' | 'property_type' | 'property_status' | 'monthly_rent'>;

export type PropertiesSProps = ManyRecordsSlaveProps<PropertyOccupancyRow, PropertySortColumn, NavLinkTo>;

type Props = {
  readonly Slave: ComponentType<PropertiesSProps>;
};

const PAGE_SIZE = 20;

export const PropertiesM = ({
  Slave,
}: Props): JSX.Element => {
  const { asyncData, sort, pagination } = usePaginatedQuery<PropertyOccupancyRow, PropertySortColumn>({
    queryKeyBase: 'properties',
    defaultSortColumn: 'name',
    defaultSortDirection: 'asc',
    pageSize: PAGE_SIZE,
    queryFn: async (sortConfig, from, to) => {
      const ascending = sortConfig.direction === 'asc';
      const r = await backendConnector
        .from('property_occupancy')
        .select('*', { count: 'exact' })
        .order(sortConfig.column, { ascending })
        .range(from, to);
      return r.error !== null ? Promise.reject(r.error) : { rows: r.data ?? [], totalCount: r.count ?? 0 };
    },
  });

  const navLinkTo: NavLinkTo = {
    property: ({ id, content, style }) => <Link to="/app/properties/$id" params={{ id }} style={style}>{content}</Link>,
    tenant: ({ id, content, style }) => <Link to="/app/tenants/$id" params={{ id }} style={style}>{content}</Link>,
  };

  return <Slave asyncData={asyncData} navLinkTo={navLinkTo} sort={sort} pagination={pagination} />;
};