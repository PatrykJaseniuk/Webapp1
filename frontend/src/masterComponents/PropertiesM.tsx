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

type PropertyFilter = 'text' | 'propertyType' | 'propertyStatus';

export type PropertiesSProps = ManyRecordsSlaveProps<PropertyOccupancyRow, PropertySortColumn, NavLinkTo, PropertyFilter>;

type Props = {
  readonly Slave: ComponentType<PropertiesSProps>;
};

export const PropertiesM = ({
  Slave,
}: Props): JSX.Element => {
  const { asyncData, sort, pagination, filter } = useFilteredPaginatedQuery<PropertyOccupancyRow, PropertySortColumn, PropertyFilter>({
    queryKey: ['properties'],
    defaultSort: { column: 'name', direction: 'asc' },
    fetchPage: async ({ sort: sortConfig, from, to, filter: filterConfig }) => {
      const ascending = sortConfig.direction === 'asc';
      const baseQuery = backendConnector
        .from('property_occupancy')
        .select('*', { count: 'exact' })
        .order(sortConfig.column, { ascending })
        .range(from, to);
      const text = filterConfig.text ?? '';
      const propertyType = filterConfig.propertyType ?? '';
      const propertyStatus = filterConfig.propertyStatus ?? '';
      const withText = text.length > 0 ? baseQuery.or(`name.ilike.*${text}*,address.ilike.*${text}*`) : baseQuery;
      const withType = propertyType.length > 0 ? withText.eq('property_type', propertyType as PropertyTypeDb) : withText;
      const queryWithFilters = propertyStatus.length > 0 ? withType.eq('property_status', propertyStatus as PropertyStatusDb) : withType;
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