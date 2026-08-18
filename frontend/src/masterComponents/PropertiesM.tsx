import { Link } from '@tanstack/react-router';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';

import { useFilteredPaginatedQuery, type ManyRecordsSlaveProps, type NavLinkWithId } from '@/generic';

type PropertyOccupancyRow = Database['public']['Views']['property_occupancy']['Row'];
type PropertyTypeDb = Database['public']['Enums']['property_type'];
type PropertyStatusDb = Database['public']['Enums']['property_status'];

type NavLinkTo = Readonly<{
  readonly property: NavLinkWithId;
  readonly tenant: NavLinkWithId;
}>;

type PropertyDbRow = Database['public']['Tables']['properties']['Row'];
type PropertySortColumn = Extract<keyof PropertyDbRow, 'name' | 'address' | 'property_type' | 'property_status' | 'monthly_rent'>;

type PropertyFilterValues = {
  readonly text: string;
  readonly propertyType: string;
  readonly propertyStatus: string;
};

export type PropertiesSProps = ManyRecordsSlaveProps<PropertyOccupancyRow, PropertySortColumn, NavLinkTo, PropertyFilterValues>;

type Props = {
  readonly Slave: ComponentType<PropertiesSProps>;
};

export const PropertiesM = ({
  Slave,
}: Props): JSX.Element => {
  const { asyncData, sort, pagination, filter } = useFilteredPaginatedQuery<PropertyOccupancyRow, PropertySortColumn, PropertyFilterValues>({
    queryKeyBase: 'properties',
    defaultSortColumn: 'name',
    initialFilter: { text: '', propertyType: '', propertyStatus: '' },
    textFilterKey: 'text',
    queryFn: async (sortConfig, from, to, filterValues) => {
      const ascending = sortConfig.direction === 'asc';
      const baseQuery = backendConnector
        .from('property_occupancy')
        .select('*', { count: 'exact' })
        .order(sortConfig.column, { ascending })
        .range(from, to);
      const withText = filterValues.text.length > 0 ? baseQuery.or(`name.ilike.*${filterValues.text}*,address.ilike.*${filterValues.text}*`) : baseQuery;
      const withType = filterValues.propertyType.length > 0 ? withText.eq('property_type', filterValues.propertyType as PropertyTypeDb) : withText;
      const queryWithFilters = filterValues.propertyStatus.length > 0 ? withType.eq('property_status', filterValues.propertyStatus as PropertyStatusDb) : withType;
      const r = await queryWithFilters;
      return r.error !== null ? Promise.reject(r.error) : { rows: r.data ?? [], totalCount: r.count ?? 0 };
    },
  });

  const navLinkTo: NavLinkTo = {
    property: ({ id, content, style, ariaLabel }) => <Link to="/app/properties/$id" params={{ id }} style={style} aria-label={ariaLabel}>{content}</Link>,
    tenant: ({ id, content, style }) => <Link to="/app/tenants/$id" params={{ id }} style={style}>{content}</Link>,
  };

  return <Slave asyncData={asyncData} navLinkTo={navLinkTo} sort={sort} pagination={pagination} filter={filter} />;
};