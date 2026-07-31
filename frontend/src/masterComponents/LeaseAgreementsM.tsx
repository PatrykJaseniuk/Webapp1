import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import type { AppRole } from '@/hooks/AuthContext';
import { toAsyncData, usePagination, useSort, type AsyncData, type SortConfig } from '@/generic';
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

type LeaseAgreementsPageData = {
  readonly rows: readonly LeaseAgreementRow[];
  readonly totalCount: number;
};

export type LeaseAgreementsSProps = {
  readonly asyncData: AsyncData<LeaseAgreementsPageData>;
  readonly navLinkTo: NavLinkTo;
  readonly sort: {
    readonly config: SortConfig<LeaseAgreementSortColumn>;
    readonly doSort: (column: LeaseAgreementSortColumn) => void;
  };
  readonly pagination: {
    readonly page: number;
    readonly pageSize: number;
    readonly prevPage: () => void;
    readonly nextPage: () => void;
  };
};

type Props = {
  readonly Slave: ComponentType<LeaseAgreementsSProps>;
  readonly role: AppRole;
};

const PAGE_SIZE = 20;

export const LeaseAgreementsM = ({
  Slave,
  role: _role,
}: Props): JSX.Element => {
  const [sortConfig, onSort] = useSort<LeaseAgreementSortColumn>('start_date', 'desc');
  const [pagination, { goToPage, ...pageControls }] = usePagination(1, PAGE_SIZE);

  const doSort = (column: LeaseAgreementSortColumn): void => {
    onSort(column);
    goToPage(1);
  };
  const sort = { config: sortConfig, doSort };

  const paginationProps = {
    page: pagination.page,
    pageSize: pagination.pageSize,
    prevPage: pageControls.prevPage,
    nextPage: pageControls.nextPage,
  };

  const query = useQuery({
    queryKey: ['lease_agreements', sortConfig.column, sortConfig.direction, pagination.page, pagination.pageSize],
    queryFn: async (): Promise<LeaseAgreementsPageData> => {
      const ascending = sortConfig.direction === 'asc';
      const from = (pagination.page - 1) * pagination.pageSize;
      const to = from + pagination.pageSize - 1;
      const r = await backendConnector
        .from('lease_agreements')
        .select('*, tenants(first_name,last_name), properties(name)', { count: 'exact' })
        .order(SORT_COLUMN_MAP[sortConfig.column], { ascending })
        .range(from, to);
      return r.error !== null ? Promise.reject(r.error) : { rows: r.data ?? [], totalCount: r.count ?? 0 };
    },
    placeholderData: (prev) => prev,
  });

  const asyncData = toAsyncData(query, () => { void query.refetch(); }, query.isFetching);

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
      pagination={paginationProps}
    />
  );
};