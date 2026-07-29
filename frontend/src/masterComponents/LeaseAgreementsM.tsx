import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import type { AppRole } from '@/hooks/AuthContext';
import { toAsyncData, useSort, type AsyncData, type SortConfig } from '@/generic';
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

export type LeaseAgreementsSProps = {
  readonly asyncData: AsyncData<readonly LeaseAgreementRow[]>;
  readonly isFetching: boolean;
  readonly navLinkTo: NavLinkTo;
  readonly sort: {
    readonly config: SortConfig<LeaseAgreementSortColumn>;
    readonly doSort: (column: LeaseAgreementSortColumn) => void;
  };
};

type Props = {
  readonly Slave: ComponentType<LeaseAgreementsSProps>;
  readonly role: AppRole;
};

export const LeaseAgreementsM = ({
  Slave,
  role: _role,
}: Props): JSX.Element => {
  const [sortConfig, doSort] = useSort<LeaseAgreementSortColumn>('start_date', 'desc');
  const sort = { config: sortConfig, doSort };

  const query = useQuery({
    queryKey: ['lease_agreements', sortConfig.column, sortConfig.direction],
    queryFn: async (): Promise<readonly LeaseAgreementRow[]> => {
      const ascending = sortConfig.direction === 'asc';
      const r = await backendConnector
        .from('lease_agreements')
        .select('*, tenants(first_name,last_name), properties(name)')
        .order(SORT_COLUMN_MAP[sortConfig.column], { ascending });
      if (r.error !== null) throw r.error;
      return r.data ?? [];
    },
    placeholderData: (prev) => prev,
  });

  const asyncData = toAsyncData(query, () => { void query.refetch(); });

  const navLinkTo: NavLinkTo = {
    leaseAgreement: ({ content, id, style }) => <Link to="/app/leases/$id" params={{ id }} style={style}>{content}</Link>,
    tenant: ({ content, id, style }) => <Link to="/app/tenants/$id" params={{ id }} style={style}>{content}</Link>,
    property: ({ content, id, style }) => <Link to="/app/properties/$id" params={{ id }} style={style}>{content}</Link>,
  };

  return (
    <Slave
      asyncData={asyncData}
      isFetching={query.isFetching}
      navLinkTo={navLinkTo}
      sort={sort}
    />
  );
};
