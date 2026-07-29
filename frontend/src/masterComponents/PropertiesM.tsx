import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import { toAsyncData, useSort, type AsyncData, type SortConfig } from '@/generic';
import type { NavLinkWithId } from '@/generic/utils';

type PropertyOccupancyRow = Database['public']['Views']['property_occupancy']['Row'];

type NavLinkTo = Readonly<{
  readonly property: NavLinkWithId;
  readonly tenant: NavLinkWithId;
}>;

type PropertyDbRow = Database['public']['Tables']['properties']['Row'];
type PropertySortColumn = Extract<keyof PropertyDbRow, 'name' | 'address' | 'property_type' | 'property_status' | 'monthly_rent'>;

export type PropertiesSProps = {
  readonly asyncData: AsyncData<readonly PropertyOccupancyRow[]>;
  readonly isFetching: boolean;
  readonly navLinkTo: NavLinkTo;
  readonly sort: {
    readonly config: SortConfig<PropertySortColumn>;
    readonly doSort: (column: PropertySortColumn) => void;
  };
};

type Props = {
  readonly Slave: ComponentType<PropertiesSProps>;
};

export const PropertiesM = ({
  Slave,
}: Props): JSX.Element => {
  const [sortConfig, onSort] = useSort<PropertySortColumn>('name', 'asc');
  const sort = { config: sortConfig, doSort: onSort };

  const query = useQuery({
    queryKey: ['properties', sortConfig.column, sortConfig.direction],
    queryFn: async (): Promise<readonly PropertyOccupancyRow[]> => {
      const ascending = sortConfig.direction === 'asc';
      const r = await backendConnector
        .from('property_occupancy')
        .select('*')
        .order(sortConfig.column, { ascending });
      if (r.error !== null) throw r.error;
      return r.data ?? [];
    },
    placeholderData: (prev) => prev,
  });

  const asyncData = toAsyncData(query, () => { void query.refetch(); });

  const navLinkTo: NavLinkTo = {
    property: ({ id, content, style }) => <Link to="/app/properties/$id" params={{ id }} style={style}>{content}</Link>,
    tenant: ({ id, content, style }) => <Link to="/app/tenants/$id" params={{ id }} style={style}>{content}</Link>,
  };

  return <Slave asyncData={asyncData} isFetching={query.isFetching} navLinkTo={navLinkTo} sort={sort} />;
};
