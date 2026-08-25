import { Link } from '@tanstack/react-router';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import type { AppRole } from '@/hooks/AuthContext';
import { useFilteredPaginatedQuery, type ManyRecordsSlaveProps, type NavLink, type NavLinkWithId } from '@/generic';

type LeaseAgreementDbRow = Database['public']['Tables']['lease_agreement']['Row'];
type LeaseStatusDb = Database['public']['Enums']['lease_status'];

type LeaseAgreementRow = LeaseAgreementDbRow & {
  readonly tenant: { readonly first_name: string; readonly last_name: string };
  readonly property: { readonly name: string };
};

type NavLinkTo = Readonly<{
  readonly leaseAgreement: NavLinkWithId;
  readonly tenant: NavLinkWithId;
  readonly property: NavLinkWithId;
  readonly create?: NavLink;
}>;

type LeaseAgreementSortColumn = Extract<keyof LeaseAgreementRow, 'start_date' | 'end_date' | 'monthly_rent' | 'lease_status' | 'tenant' | 'property'>;

type LeaseAgreementFilter = 'text' | 'leaseStatus' | 'dateFrom' | 'dateTo';

export type LeaseAgreementsSProps = ManyRecordsSlaveProps<LeaseAgreementRow, LeaseAgreementSortColumn, NavLinkTo, LeaseAgreementFilter>;

type Props = {
  readonly Slave: ComponentType<LeaseAgreementsSProps>;
  readonly role: AppRole;
};

const SORT_COLUMN_MAP: Readonly<Record<LeaseAgreementSortColumn, string>> = Object.freeze({
  start_date: 'start_date',
  end_date: 'end_date',
  monthly_rent: 'monthly_rent',
  lease_status: 'lease_status',
  tenant: 'tenant(last_name)',
  property: 'property(name)',
});

const resolveSearchIds = async (search: string): Promise<{
  readonly tenantIds: readonly string[];
  readonly propertyIds: readonly string[];
}> => {
  const pattern = `*${search}*`;
  const [tenantRes, propertyRes] = await Promise.all([
    backendConnector.from('tenant').select('id').or(`first_name.ilike.${pattern},last_name.ilike.${pattern}`),
    backendConnector.from('property').select('id').ilike('name', pattern),
  ]);
  const tenantIds = (tenantRes.data ?? []).map((t: { readonly id: string }) => t.id);
  const propertyIds = (propertyRes.data ?? []).map((p: { readonly id: string }) => p.id);
  return { tenantIds, propertyIds };
};

export const LeaseAgreementsM = ({
  Slave,
  role,
}: Props): JSX.Element => {
  const { asyncData, sort, pagination, filter } = useFilteredPaginatedQuery<LeaseAgreementRow, LeaseAgreementSortColumn, LeaseAgreementFilter>({
    queryKey: ['lease_agreements'],
    defaultSort: { column: 'start_date', direction: 'desc' },
    fetchPage: async ({ sort: sortConfig, from, to, filter: filterConfig }) => {
      const ascending = sortConfig.direction === 'asc';
      const baseQuery = backendConnector
        .from('lease_agreement')
        .select('*, tenant(first_name,last_name), property(name)', { count: 'exact' })
        .order(SORT_COLUMN_MAP[sortConfig.column], { ascending });
      const leaseStatus = filterConfig.leaseStatus ?? '';
      const dateFrom = filterConfig.dateFrom ?? '';
      const dateTo = filterConfig.dateTo ?? '';
      const withStatus = leaseStatus.length > 0 ? baseQuery.eq('lease_status', leaseStatus as LeaseStatusDb) : baseQuery;
      const withDateFrom = dateFrom.length > 0 ? withStatus.gte('start_date', dateFrom) : withStatus;
      const withDateTo = dateTo.length > 0 ? withDateFrom.lte('start_date', dateTo) : withDateFrom;

      const search = filterConfig.text ?? '';
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

  const canCreate = role === 'admin' || role === 'landlord';

  const navLinkTo: NavLinkTo = {
    leaseAgreement: ({ content, id, style, ariaLabel }) => <Link to="/app/leases/$id" params={{ id }} style={style} aria-label={ariaLabel}>{content}</Link>,
    tenant: ({ content, id, style }) => <Link to="/app/tenants/$id" params={{ id }} style={style}>{content}</Link>,
    property: ({ content, id, style }) => <Link to="/app/properties/$id" params={{ id }} style={style}>{content}</Link>,
    ...(canCreate ? { create: ({ content, style }) => <Link to="/app/leases/$id" params={{ id: 'new' }} style={style}>{content}</Link> } : {}),
  };

  return <Slave asyncData={asyncData} navLinkTo={navLinkTo} sort={sort} pagination={pagination} filter={filter} />;
};