import { Link } from '@tanstack/react-router';
import { useState, useCallback, type ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import type { AppRole } from '@/hooks/AuthContext';
import { useFilteredPaginatedQuery, type FilterSetters, type ManyRecordsSlaveProps, type NavLinkWithId } from '@/generic';

type LeaseAgreementDbRow = Database['public']['Tables']['lease_agreements']['Row'];
type LeaseStatusDb = Database['public']['Enums']['lease_status'];

type LeaseAgreementRow = LeaseAgreementDbRow & {
  readonly tenants: { readonly first_name: string; readonly last_name: string };
  readonly properties: { readonly name: string };
};

type NavLinkTo = Readonly<{
  readonly leaseAgreement: NavLinkWithId;
  readonly tenant: NavLinkWithId;
  readonly property: NavLinkWithId;
}>;

type LeaseAgreementSortColumn = Extract<keyof LeaseAgreementRow, 'start_date' | 'end_date' | 'monthly_rent' | 'lease_status' | 'tenants' | 'properties'>;

type LeaseAgreementFilterValues = {
  readonly text: string;
  readonly leaseStatus: string;
  readonly dateFrom: string;
  readonly dateTo: string;
};

export type LeaseAgreementsSProps = ManyRecordsSlaveProps<LeaseAgreementRow, LeaseAgreementSortColumn, NavLinkTo, LeaseAgreementFilterValues & FilterSetters<LeaseAgreementFilterValues>> & {
  readonly clearFilter: () => void;
  readonly isFilterActive: boolean;
  readonly activeFilterCount: number;
  readonly filterResetKey: number;
};

type Props = {
  readonly Slave: ComponentType<LeaseAgreementsSProps>;
  readonly role: AppRole;
};

const INITIAL_FILTER: LeaseAgreementFilterValues = Object.freeze({
  text: '',
  leaseStatus: '',
  dateFrom: '',
  dateTo: '',
});

const SORT_COLUMN_MAP: Readonly<Record<LeaseAgreementSortColumn, string>> = Object.freeze({
  start_date: 'start_date',
  end_date: 'end_date',
  monthly_rent: 'monthly_rent',
  lease_status: 'lease_status',
  tenants: 'tenants(last_name)',
  properties: 'properties(name)',
});

const PAGE_SIZE = 20;

const resolveSearchIds = async (search: string): Promise<{
  readonly tenantIds: readonly string[];
  readonly propertyIds: readonly string[];
}> => {
  const pattern = `*${search}*`;
  const [tenantRes, propertyRes] = await Promise.all([
    backendConnector.from('tenants').select('id').or(`first_name.ilike.${pattern},last_name.ilike.${pattern}`),
    backendConnector.from('properties').select('id').ilike('name', pattern),
  ]);
  const tenantIds = (tenantRes.data ?? []).map((t: { readonly id: string }) => t.id);
  const propertyIds = (propertyRes.data ?? []).map((p: { readonly id: string }) => p.id);
  return { tenantIds, propertyIds };
};

export const LeaseAgreementsM = ({
  Slave,
  role: _role,
}: Props): JSX.Element => {
  const { asyncData, sort, pagination, filter, clearFilter, isFilterActive, activeFilterCount } = useFilteredPaginatedQuery<LeaseAgreementRow, LeaseAgreementSortColumn, LeaseAgreementFilterValues>({
    queryKeyBase: 'lease_agreements',
    defaultSortColumn: 'start_date',
    defaultSortDirection: 'desc',
    pageSize: PAGE_SIZE,
    initialFilter: INITIAL_FILTER,
    textFilterKey: 'text',
    debounceMs: 300,
    queryFn: async (sortConfig, from, to, filterValues) => {
      const ascending = sortConfig.direction === 'asc';
      const baseQuery = backendConnector
        .from('lease_agreements')
        .select('*, tenants(first_name,last_name), properties(name)', { count: 'exact' })
        .order(SORT_COLUMN_MAP[sortConfig.column], { ascending });
      const withStatus = filterValues.leaseStatus.length > 0 ? baseQuery.eq('lease_status', filterValues.leaseStatus as LeaseStatusDb) : baseQuery;
      const withDateFrom = filterValues.dateFrom.length > 0 ? withStatus.gte('start_date', filterValues.dateFrom) : withStatus;
      const withDateTo = filterValues.dateTo.length > 0 ? withDateFrom.lte('start_date', filterValues.dateTo) : withDateFrom;

      const search = filterValues.text;
      const searchExists = search.length > 0;
      const resolved = searchExists ?
        await resolveSearchIds(search) :
        { tenantIds: [] as readonly string[], propertyIds: [] as readonly string[] };
      const noMatches = searchExists && resolved.tenantIds.length === 0 && resolved.propertyIds.length === 0;
      const orParts = [
        resolved.tenantIds.length > 0 ? `tenant_id.in.(${resolved.tenantIds.join(',')})` : null,
        resolved.propertyIds.length > 0 ? `property_id.in.(${resolved.propertyIds.join(',')})` : null,
      ].filter((p): p is string => p !== null);
      const withSearch =
        searchExists && orParts.length > 0 ? withDateTo.or(orParts.join(',')) : withDateTo;

      const r = noMatches ?
        { data: [] as readonly LeaseAgreementRow[], count: 0, error: null } :
        await withSearch.range(from, to);
      return r.error !== null ? Promise.reject(r.error) : { rows: r.data ?? [], totalCount: r.count ?? 0 };
    },
  });

  const [filterResetKey, setFilterResetKey] = useState(0);
  const handleClearFilter = useCallback((): void => {
    clearFilter();
    setFilterResetKey((k) => k + 1);
  }, [clearFilter]);

  const navLinkTo: NavLinkTo = {
    leaseAgreement: ({ content, id, style, ariaLabel }) => <Link to="/app/leases/$id" params={{ id }} style={style} aria-label={ariaLabel}>{content}</Link>,
    tenant: ({ content, id, style }) => <Link to="/app/tenants/$id" params={{ id }} style={style}>{content}</Link>,
    property: ({ content, id, style }) => <Link to="/app/properties/$id" params={{ id }} style={style}>{content}</Link>,
  };

  return <Slave asyncData={asyncData} navLinkTo={navLinkTo} sort={sort} pagination={pagination} filter={filter} clearFilter={handleClearFilter} isFilterActive={isFilterActive} activeFilterCount={activeFilterCount} filterResetKey={filterResetKey} />;
};