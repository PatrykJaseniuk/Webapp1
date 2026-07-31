import { Link } from '@tanstack/react-router';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import type { AppRole } from '@/hooks/AuthContext';
import { usePaginatedQuery, type ManyRecordsSlaveProps } from '@/generic';
import type { NavLinkWithId } from '@/generic/utils';

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

type LeaseAgreementSortColumn = Extract<keyof LeaseAgreementRow, 'start_date' | 'end_date' | 'monthly_rent' | 'lease_status' | 'tenants' | 'properties'>;

const SORT_COLUMN_MAP: Readonly<Record<LeaseAgreementSortColumn, string>> = Object.freeze({
  start_date: 'start_date',
  end_date: 'end_date',
  monthly_rent: 'monthly_rent',
  lease_status: 'lease_status',
  tenants: 'tenants(last_name)',
  properties: 'properties(name)',
});

export type LeaseAgreementsSProps = ManyRecordsSlaveProps<LeaseAgreementRow, LeaseAgreementSortColumn, NavLinkTo>;

type Props = {
  readonly Slave: ComponentType<LeaseAgreementsSProps>;
  readonly role: AppRole;
};

const PAGE_SIZE = 20;

export const LeaseAgreementsM = ({
  Slave,
  role: _role,
}: Props): JSX.Element => {
  const { asyncData, sort, pagination } = usePaginatedQuery<LeaseAgreementRow, LeaseAgreementSortColumn>({
    queryKeyBase: 'lease_agreements',
    defaultSortColumn: 'start_date',
    defaultSortDirection: 'desc',
    pageSize: PAGE_SIZE,
    queryFn: async (sortConfig, from, to) => {
      const ascending = sortConfig.direction === 'asc';
      const r = await backendConnector
        .from('lease_agreements')
        .select('*, tenants(first_name,last_name), properties(name)', { count: 'exact' })
        .order(SORT_COLUMN_MAP[sortConfig.column], { ascending })
        .range(from, to);
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
    />
  );
};