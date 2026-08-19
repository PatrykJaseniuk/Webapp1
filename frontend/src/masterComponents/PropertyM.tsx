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

type PropertyDbRow = Database['public']['Tables']['properties']['Row'];
type LeaseAgreementDbRow = Database['public']['Tables']['lease_agreements']['Row'];
type TransactionDbRow = Database['public']['Tables']['transactions']['Row'];
type FinancialSummaryDbRow = Database['public']['Views']['property_financial_summary']['Row'];
type OccupancyDbRow = Database['public']['Views']['property_occupancy']['Row'];
type AttachmentDbRow = Database['public']['Tables']['attachments']['Row'];
type TransactionTypeDb = Database['public']['Enums']['transaction_type'];
type TransactionStatusDb = Database['public']['Enums']['transaction_status'];
type LeaseStatusDb = Database['public']['Enums']['lease_status'];

type LeaseRow = LeaseAgreementDbRow & {
  readonly tenants: { readonly first_name: string; readonly last_name: string; };
};

type PropertyData = Readonly<{
  readonly property: PropertyDbRow | null;
  readonly occupancy: OccupancyDbRow | null;
  readonly financial: FinancialSummaryDbRow | null;
}>;

type NavLinkTo = Readonly<{
  readonly tenant: NavLinkWithId;
  readonly lease: NavLinkWithId;
  readonly transaction: NavLinkWithId;
  readonly edit: NavLink;
  readonly goBack: NavLink;
}>;

type LeaseSortColumn = Extract<keyof LeaseAgreementDbRow, 'start_date' | 'end_date' | 'monthly_rent' | 'lease_status'>;
type TransactionSortColumn = Extract<keyof TransactionDbRow, 'due_date' | 'type' | 'amount' | 'transaction_status'>;
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

export type PropertySProps = {
  readonly asyncData: AsyncData<PropertyData>;
  readonly leases: FilteredQueryResult<LeaseRow, LeaseSortColumn, LeaseFilter>;
  readonly transactions: FilteredQueryResult<TransactionDbRow, TransactionSortColumn, TransactionFilter>;
  readonly attachments: FilteredQueryResult<AttachmentDbRow, AttachmentSortColumn, never>;
  readonly navLinkTo: NavLinkTo;
};

type Props = {
  readonly Slave: ComponentType<PropertySProps>;
  readonly id: string;
};

export const PropertyDetailM = ({
  Slave,
  id,
}: Props): JSX.Element => {
  const query = useQuery({
    queryKey: ['property', id],
    queryFn: async (): Promise<PropertyData> => {
      const [propertyResult, occupancyResult, financialResult] = await Promise.all([
        backendConnector.from('properties').select('*').eq('id', id).single(),
        backendConnector.from('property_occupancy').select('*').eq('id', id).single(),
        backendConnector.from('property_financial_summary').select('*').eq('property_id', id).single(),
      ]);

      const combinedError = propertyResult.error ?? occupancyResult.error ?? financialResult.error;
      return combinedError !== null
        ? Promise.reject(combinedError)
        : {
            property: propertyResult.data ?? null,
            occupancy: occupancyResult.data ?? null,
            financial: financialResult.data ?? null,
          };
    },
  });

  const asyncData = toAsyncData(query, () => { void query.refetch(); });

  const leases = useFilteredPaginatedQuery<LeaseRow, LeaseSortColumn, LeaseFilter>({
    queryKey: ['leases', 'property', id],
    defaultSort: { column: 'start_date', direction: 'desc' },
    pageSize: 5,
    fetchPage: async ({ sort: sortConfig, from, to, filter: filterConfig }) => {
      const ascending = sortConfig.direction === 'asc';
      const baseQuery = backendConnector
        .from('lease_agreements')
        .select('*, tenants(first_name,last_name)', { count: 'exact' })
        .eq('property_id', id)
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

  const transactions = useFilteredPaginatedQuery<TransactionDbRow, TransactionSortColumn, TransactionFilter>({
    queryKey: ['transactions', 'property', id],
    defaultSort: { column: 'due_date', direction: 'desc' },
    pageSize: 5,
    fetchPage: async ({ sort: sortConfig, from, to, filter: filterConfig }) => {
      const ascending = sortConfig.direction === 'asc';
      const baseQuery = backendConnector
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('property_id', id)
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

  const attachments = useFilteredPaginatedQuery<AttachmentDbRow, AttachmentSortColumn, never>({
    queryKey: ['attachments', 'property', id],
    defaultSort: { column: 'created_at', direction: 'desc' },
    pageSize: 5,
    fetchPage: async ({ sort: sortConfig, from, to }) => {
      const ascending = sortConfig.direction === 'asc';
      const result = await backendConnector
        .from('attachments')
        .select('*', { count: 'exact' })
        .eq('related_to_type', 'property')
        .eq('related_to_id', id)
        .order(sortConfig.column, { ascending })
        .range(from, to);
      return result.error !== null
        ? Promise.reject(result.error)
        : { rows: result.data ?? [], totalCount: result.count ?? 0 };
    },
  });

  const navLinkTo: NavLinkTo = {
    tenant: ({ id: tenantId, content, style }) => <Link to="/app/tenants/$id" params={{ id: tenantId }} style={style}>{content}</Link>,
    lease: ({ id: leaseId, content, style }) => <Link to="/app/leases/$id" params={{ id: leaseId }} style={style}>{content}</Link>,
    transaction: ({ id: transactionId, content, style }) => <Link to="/app/transactions/$id" params={{ id: transactionId }} style={style}>{content}</Link>,
    edit: ({ content, style }) => <Link to="/app/properties/$id" params={{ id }} style={style}>{content}</Link>,
    goBack: ({ content, style }) => <button type="button" onClick={() => window.history.back()} style={style}>{content}</button>,
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