import { Link } from '@tanstack/react-router';
import { useState, useCallback } from 'react';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';

import { useFilteredPaginatedQuery, type ManyRecordsSlaveProps } from '@/generic';
import type { NavLinkWithId } from '@/generic/utils';

type PropertyOccupancyRow = Database['public']['Views']['property_occupancy']['Row'];
type PropertyTypeDb = Database['public']['Enums']['property_type'];
type PropertyStatusDb = Database['public']['Enums']['property_status'];

type NavLinkTo = Readonly<{
  readonly property: NavLinkWithId;
  readonly tenant: NavLinkWithId;
}>;

type PropertyDbRow = Database['public']['Tables']['properties']['Row'];
type PropertySortColumn = Extract<keyof PropertyDbRow, 'name' | 'address' | 'property_type' | 'property_status' | 'monthly_rent'>;

type PropertiesFilterShape = Readonly<{
  readonly text: string;
  readonly propertyType: string;
  readonly propertyStatus: string;
  readonly setText: (v: string) => void;
  readonly setPropertyType: (v: string) => void;
  readonly setPropertyStatus: (v: string) => void;
}>;

export type PropertiesSProps = ManyRecordsSlaveProps<PropertyOccupancyRow, PropertySortColumn, NavLinkTo, PropertiesFilterShape> & {
  readonly clearFilter: () => void;
  readonly isFilterActive: boolean;
  readonly activeFilterCount: number;
  readonly filterResetKey: number;
};

type Props = {
  readonly Slave: ComponentType<PropertiesSProps>;
};

type PropertyFilterValues = {
  readonly text: string;
  readonly propertyType: string;
  readonly propertyStatus: string;
};

const INITIAL_FILTER: PropertyFilterValues = Object.freeze({
  text: '',
  propertyType: '',
  propertyStatus: '',
});

const PAGE_SIZE = 20;

export const PropertiesM = ({
  Slave,
}: Props): JSX.Element => {
  const { asyncData, sort, pagination, filter, clearFilter, isFilterActive, activeFilterCount } = useFilteredPaginatedQuery<PropertyOccupancyRow, PropertySortColumn, PropertyFilterValues, PropertiesFilterShape>({
    queryKeyBase: 'properties',
    defaultSortColumn: 'name',
    defaultSortDirection: 'asc',
    pageSize: PAGE_SIZE,
    initialFilter: INITIAL_FILTER,
    textFilterKey: 'text',
    debounceMs: 300,
    assembleFilter: (values, setters) => ({
      text: values.text,
      propertyType: values.propertyType,
      propertyStatus: values.propertyStatus,
      setText: setters.text,
      setPropertyType: setters.propertyType,
      setPropertyStatus: setters.propertyStatus,
    }),
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

  const [filterResetKey, setFilterResetKey] = useState(0);
  const handleClearFilter = useCallback((): void => {
    clearFilter();
    setFilterResetKey((k) => k + 1);
  }, [clearFilter]);

  const navLinkTo: NavLinkTo = {
    property: ({ id, content, style }) => <Link to="/app/properties/$id" params={{ id }} style={style}>{content}</Link>,
    tenant: ({ id, content, style }) => <Link to="/app/tenants/$id" params={{ id }} style={style}>{content}</Link>,
  };

  return <Slave asyncData={asyncData} navLinkTo={navLinkTo} sort={sort} pagination={pagination} filter={filter} clearFilter={handleClearFilter} isFilterActive={isFilterActive} activeFilterCount={activeFilterCount} filterResetKey={filterResetKey} />;
};