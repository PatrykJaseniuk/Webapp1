import { Link } from '@tanstack/react-router';
import { useState, type ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import type { AppRole } from '@/hooks/AuthContext';
import { usePaginatedQuery, type ManyRecordsSlaveProps, type NavLinkWithId } from '@/generic';

type LeaseAgreementDbRow = Database['public']['Tables']['lease_agreements']['Row'];
type LeaseAgreementRow = LeaseAgreementDbRow & {
  readonly tenants: { readonly first_name: string; readonly last_name: string };
  readonly properties: { readonly name: string };
};

type NavLinkTo = Readonly<{
  readonly leaseAgreement: NavLinkWithId;
  readonly tenant: NavLinkWithId;
  readonly property: NavLinkWithId;
}>;

type LeaseStatus = LeaseAgreementDbRow['lease_status'];

type LeaseAgreementSortColumn = Extract<keyof LeaseAgreementRow, 'start_date' | 'end_date' | 'monthly_rent' | 'lease_status' | 'tenants' | 'properties'>;

export type LeaseAgreementsFilterValues = Readonly<{
  readonly leaseStatus: LeaseStatus | null;
  readonly startDateFrom: string | null;
  readonly startDateTo: string | null;
  readonly search: string | null;
}>;

const INITIAL_FILTER_VALUES: LeaseAgreementsFilterValues = Object.freeze({
  leaseStatus: null,
  startDateFrom: null,
  startDateTo: null,
  search: null,
});

const SORT_COLUMN_MAP: Readonly<Record<LeaseAgreementSortColumn, string>> = Object.freeze({
  start_date: 'start_date',
  end_date: 'end_date',
  monthly_rent: 'monthly_rent',
  lease_status: 'lease_status',
  tenants: 'tenants(last_name)',
  properties: 'properties(name)',
});

export type LeaseAgreementsSProps = ManyRecordsSlaveProps<LeaseAgreementRow, LeaseAgreementSortColumn, NavLinkTo, Record<string, never>>;

type Props = {
  readonly Slave: ComponentType<LeaseAgreementsSProps>;
  readonly role: AppRole;
};

const PAGE_SIZE = 20;

export const LeaseAgreementsM = ({
  Slave,
  role: _role,
}: Props): JSX.Element => {
  const [filterValues] = useState<LeaseAgreementsFilterValues>(INITIAL_FILTER_VALUES);

  const extraQueryKeyParts = [filterValues.leaseStatus, filterValues.startDateFrom, filterValues.startDateTo, filterValues.search] as const;

  const { asyncData, sort, pagination } = usePaginatedQuery<LeaseAgreementRow, LeaseAgreementSortColumn, typeof extraQueryKeyParts>({
    queryKeyBase: 'lease_agreements',
    defaultSortColumn: 'start_date',
    defaultSortDirection: 'desc',
    pageSize: PAGE_SIZE,
    extraQueryKeyParts,
    queryFn: async (sortConfig, from, to) => {
      const ascending = sortConfig.direction === 'asc';
      const base = backendConnector
        .from('lease_agreements')
        .select('*, tenants(first_name,last_name), properties(name)', { count: 'exact' })
        .order(SORT_COLUMN_MAP[sortConfig.column], { ascending });
      const withStatus =
        filterValues.leaseStatus !== null ? base.filter('lease_status', 'eq', filterValues.leaseStatus) : base;
      const withDateFrom =
        filterValues.startDateFrom !== null ? withStatus.filter('start_date', 'gte', filterValues.startDateFrom) : withStatus;
      const withDateTo =
        filterValues.startDateTo !== null ? withDateFrom.filter('start_date', 'lte', filterValues.startDateTo) : withDateFrom;
      const search = filterValues.search;
      const searchExists = search !== null && search.length > 0;
      const resolveSearchIds = async (): Promise<{
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
      const resolved = searchExists ?
        await resolveSearchIds() :
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

  const navLinkTo: NavLinkTo = {
    leaseAgreement: ({ content, id, style }) => <Link to="/app/leases/$id" params={{ id }} style={style}>{content}</Link>,
    tenant: ({ content, id, style }) => <Link to="/app/tenants/$id" params={{ id }} style={style}>{content}</Link>,
    property: ({ content, id, style }) => <Link to="/app/properties/$id" params={{ id }} style={style}>{content}</Link>,
  };

  return (
    <Slave
      asyncData={asyncData}
      navLinkTo={navLinkTo}
      sort={sort}
      pagination={pagination}
      filter={{}}
    />
  );
};