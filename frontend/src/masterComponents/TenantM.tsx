import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import {
  toAsyncData,
  useFilteredPaginatedQuery,
  type AsyncData,
  type FilteredQueryResult,
  type NavLink,
  type NavLinkWithId,
} from '@/generic';

type TenantRow = Database['public']['Tables']['tenants']['Row'];
type LeaseAgreementDbRow = Database['public']['Tables']['lease_agreements']['Row'];
type TransactionRow = Database['public']['Tables']['transactions']['Row'];
type AttachmentRow = Database['public']['Tables']['attachments']['Row'];
type TransactionTypeDb = Database['public']['Enums']['transaction_type'];
type TransactionStatusDb = Database['public']['Enums']['transaction_status'];
type LeaseStatusDb = Database['public']['Enums']['lease_status'];

type LeaseRow = LeaseAgreementDbRow & {
  readonly properties: { readonly name: string; };
};

type TenantDetailData = Readonly<{
  readonly tenant: TenantRow;
}>;

type NavLinkTo = Readonly<{
  readonly toProperty: NavLinkWithId;
  readonly toLease: NavLinkWithId;
  readonly toTransaction: NavLinkWithId;
  readonly linkToEdit: NavLink;
  readonly linkToTenants: NavLink;
}>;

type LeaseSortColumn = Extract<keyof LeaseAgreementDbRow, 'start_date' | 'end_date' | 'monthly_rent' | 'lease_status'>;
type TransactionSortColumn = Extract<keyof TransactionRow, 'due_date' | 'type' | 'amount' | 'transaction_status'>;
type AttachmentSortColumn = 'created_at';

type LeaseFilter = 'status' | 'dateFrom' | 'dateTo';
type TransactionFilter = 'text' | 'type' | 'status' | 'dateFrom' | 'dateTo';

const LEASE_SORT_COLUMN_MAP: Readonly<Record<LeaseSortColumn, string>> = Object.freeze({
  start_date: 'start_date',
  end_date: 'end_date',
  monthly_rent: 'monthly_rent',
  lease_status: 'lease_status',
});

const TRANSACTION_SORT_COLUMN_MAP: Readonly<Record<TransactionSortColumn, string>> = Object.freeze({
  due_date: 'due_date',
  type: 'type',
  amount: 'amount',
  transaction_status: 'transaction_status',
});

export type TenantSProps = {
  readonly asyncData: AsyncData<TenantDetailData>;
  readonly leases: FilteredQueryResult<LeaseRow, LeaseSortColumn, LeaseFilter>;
  readonly transactions: FilteredQueryResult<TransactionRow, TransactionSortColumn, TransactionFilter>;
  readonly attachments: FilteredQueryResult<AttachmentRow, AttachmentSortColumn, never>;
  readonly navLinkTo: NavLinkTo;
};

type Props = {
  readonly Slave: ComponentType<TenantSProps>;
  readonly id: string;
};

const fetchTenantLeaseIds = async (id: string): Promise<readonly string[]> => {
  const result = await backendConnector.from('lease_agreements').select('id').eq('tenant_id', id);
  return result.data?.map((l) => l.id) ?? [];
};

export const TenantDetailM = ({
  Slave,
  id,
}: Props): JSX.Element => {
  const query = useQuery({
    queryKey: ['tenant', id],
    queryFn: async (): Promise<TenantDetailData> => {
      const tenantResult = await backendConnector.from('tenants').select('*').eq('id', id).single();

      return tenantResult.error !== null
        ? Promise.reject(tenantResult.error)
        : { tenant: tenantResult.data as NonNullable<typeof tenantResult.data> };
    },
  });

  const asyncData = toAsyncData(query, () => { void query.refetch(); });

  const leases = useFilteredPaginatedQuery<LeaseRow, LeaseSortColumn, LeaseFilter>({
    queryKey: ['leases', 'tenant', id],
    defaultSort: { column: 'start_date', direction: 'desc' },
    pageSize: 5,
    fetchPage: async ({ sort: sortConfig, from, to, filter: filterConfig }) => {
      const ascending = sortConfig.direction === 'asc';
      const baseQuery = backendConnector
        .from('lease_agreements')
        .select('*, properties(name)', { count: 'exact' })
        .eq('tenant_id', id)
        .order(LEASE_SORT_COLUMN_MAP[sortConfig.column], { ascending });
      const status = filterConfig.status ?? '';
      const dateFrom = filterConfig.dateFrom ?? '';
      const dateTo = filterConfig.dateTo ?? '';
      const withStatus = status.length > 0 ? baseQuery.eq('lease_status', status as LeaseStatusDb) : baseQuery;
      const withDateFrom = dateFrom.length > 0 ? withStatus.gte('start_date', dateFrom) : withStatus;
      const queryWithFilters = dateTo.length > 0 ? withDateFrom.lte('start_date', dateTo) : withDateFrom;
      const result = await queryWithFilters.range(from, to);
      return result.error !== null
        ? Promise.reject(result.error)
        : { rows: result.data ?? [], totalCount: result.count ?? 0 };
    },
  });

  const transactions = useFilteredPaginatedQuery<TransactionRow, TransactionSortColumn, TransactionFilter>({
    queryKey: ['transactions', 'tenant', id],
    defaultSort: { column: 'due_date', direction: 'desc' },
    pageSize: 5,
    fetchPage: async ({ sort: sortConfig, from, to, filter: filterConfig }) => {
      const leaseIds = await fetchTenantLeaseIds(id);
      const ascending = sortConfig.direction === 'asc';
      const baseQuery = backendConnector
        .from('transactions')
        .select('*', { count: 'exact' })
        .in('lease_id', leaseIds.length > 0 ? leaseIds : ['__none__'])
        .order(TRANSACTION_SORT_COLUMN_MAP[sortConfig.column], { ascending });
      const text = filterConfig.text ?? '';
      const type = filterConfig.type ?? '';
      const status = filterConfig.status ?? '';
      const dateFrom = filterConfig.dateFrom ?? '';
      const dateTo = filterConfig.dateTo ?? '';
      const withText = text.length > 0 ? baseQuery.ilike('description', `*${text}*`) : baseQuery;
      const withType = type.length > 0 ? withText.eq('type', type as TransactionTypeDb) : withText;
      const withStatus = status.length > 0 ? withType.eq('transaction_status', status as TransactionStatusDb) : withType;
      const withDateFrom = dateFrom.length > 0 ? withStatus.gte('due_date', dateFrom) : withStatus;
      const queryWithFilters = dateTo.length > 0 ? withDateFrom.lte('due_date', dateTo) : withDateFrom;
      const result = await queryWithFilters.range(from, to);
      return result.error !== null
        ? Promise.reject(result.error)
        : { rows: result.data ?? [], totalCount: result.count ?? 0 };
    },
  });

  const attachments = useFilteredPaginatedQuery<AttachmentRow, AttachmentSortColumn, never>({
    queryKey: ['attachments', 'tenant', id],
    defaultSort: { column: 'created_at', direction: 'desc' },
    pageSize: 5,
    fetchPage: async ({ sort: sortConfig, from, to }) => {
      const ascending = sortConfig.direction === 'asc';
      const result = await backendConnector
        .from('attachments')
        .select('*', { count: 'exact' })
        .eq('related_to_type', 'tenant')
        .eq('related_to_id', id)
        .order(sortConfig.column, { ascending })
        .range(from, to);
      return result.error !== null
        ? Promise.reject(result.error)
        : { rows: result.data ?? [], totalCount: result.count ?? 0 };
    },
  });

  const navLinkTo: NavLinkTo = {
    toProperty: ({ id: propertyId, content, style }) => <Link to="/app/properties/$id" params={{ id: propertyId }} style={style}>{content}</Link>,
    toLease: ({ id: leaseId, content, style }) => <Link to="/app/leases/$id" params={{ id: leaseId }} style={style}>{content}</Link>,
    toTransaction: ({ id: transactionId, content, style }) => <Link to="/app/transactions/$id" params={{ id: transactionId }} style={style}>{content}</Link>,
    linkToEdit: ({ content, style }) => <Link to="/app/tenants/$id" params={{ id }} style={style}>{content}</Link>,
    linkToTenants: ({ content, style }) => <Link to="/app/tenants" style={style}>{content}</Link>,
  };

  return (
    <Slave
      asyncData={asyncData}
      leases={leases}
      transactions={transactions}
      attachments={attachments}
      navLinkTo={navLinkTo}
    />
  );
};