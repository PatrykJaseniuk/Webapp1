import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import type { AppRole } from '@/hooks/AuthContext';
import {
  toAsyncData,
  useFilteredPaginatedQuery,
  type AsyncData,
  type FilteredQueryResult,
  type NavLink,
  type NavLinkWithId,
} from '@/generic';

type LeaseAgreementDbRow = Database['public']['Tables']['lease_agreements']['Row'];
type TransactionDbRow = Database['public']['Tables']['transactions']['Row'];
type AttachmentDbRow = Database['public']['Tables']['attachments']['Row'];
type TransactionTypeDb = Database['public']['Enums']['transaction_type'];
type TransactionStatusDb = Database['public']['Enums']['transaction_status'];

type LeaseAgreementWithRelationships = Readonly<{
  readonly leaseAgreement: LeaseAgreementDbRow & {
    readonly tenants: { readonly first_name: string; readonly last_name: string; };
    readonly properties: { readonly name: string; };
  } | null;
  readonly attachments: readonly AttachmentDbRow[];
}>;

type NavLinkTo = Readonly<{
  readonly tenant: NavLinkWithId;
  readonly property: NavLinkWithId;
  readonly transaction: NavLinkWithId;
  readonly edit: NavLink;
  readonly leases: NavLink;
}>;

type TransactionSortColumn = Extract<keyof TransactionDbRow, 'due_date' | 'type' | 'amount' | 'transaction_status'>;

const SORT_COLUMN_MAP: Readonly<Record<TransactionSortColumn, string>> = Object.freeze({
  due_date: 'due_date',
  type: 'type',
  amount: 'amount',
  transaction_status: 'transaction_status',
});

const TRANSACTIONS_PAGE_SIZE = 20;

export type LeaseAgreementSProps = {
  readonly asyncData: AsyncData<LeaseAgreementWithRelationships>;
  readonly transactions: FilteredQueryResult<TransactionDbRow, TransactionSortColumn, LeaseTransactionFilterValues>;
  readonly navLinkTo: NavLinkTo;
};

type Props = {
  readonly Slave: ComponentType<LeaseAgreementSProps>;
  readonly id: string;
  readonly role: AppRole;
};

type LeaseTransactionFilterValues = {
  readonly text: string;
  readonly type: string;
  readonly status: string;
  readonly dateFrom: string;
  readonly dateTo: string;
};

const FILTER_KEYS = Object.freeze(['text', 'type', 'status', 'dateFrom', 'dateTo'] as const satisfies readonly (keyof LeaseTransactionFilterValues & string)[]);

export const LeaseAgreementDetailM = ({
  Slave,
  id,
  role: _role,
}: Props): JSX.Element => {
  const query = useQuery({
    queryKey: ['leaseAgreement', id],
    queryFn: async (): Promise<LeaseAgreementWithRelationships> => {
      const [leaseResult, attachmentsResult] = await Promise.all([
        backendConnector
          .from('lease_agreements')
          .select('*, tenants(first_name,last_name), properties(name)')
          .eq('id', id)
          .single(),
        backendConnector
          .from('attachments')
          .select('*')
          .eq('related_to_type', 'lease')
          .eq('related_to_id', id),
      ]);

      const combinedError = leaseResult.error ?? attachmentsResult.error;
      return combinedError !== null
        ? Promise.reject(combinedError)
        : {
          attachments: attachmentsResult.data ?? [],
          leaseAgreement: leaseResult.data ?? null,
        };
    },
  });

  const asyncData = toAsyncData(query, () => { void query.refetch(); });

  const transactions = useFilteredPaginatedQuery<TransactionDbRow, TransactionSortColumn, LeaseTransactionFilterValues, readonly [string, string]>({
    queryKeyBase: 'transactions',
    defaultSortColumn: 'due_date',
    defaultSortDirection: 'desc',
    pageSize: TRANSACTIONS_PAGE_SIZE,
    extraQueryKeyParts: ['leaseAgreement', id],
    filterKeys: FILTER_KEYS,
    textFilterKey: 'text',
    debounceMs: 300,
    queryFn: async (sortConfig, from, to, filterValues) => {
      const ascending = sortConfig.direction === 'asc';
      const baseQuery = backendConnector
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('lease_id', id)
        .order(SORT_COLUMN_MAP[sortConfig.column], { ascending });
      const withText = filterValues.text.length > 0 ? baseQuery.ilike('description', `*${filterValues.text}*`) : baseQuery;
      const withType = filterValues.type.length > 0 ? withText.eq('type', filterValues.type as TransactionTypeDb) : withText;
      const withStatus = filterValues.status.length > 0 ? withType.eq('transaction_status', filterValues.status as TransactionStatusDb) : withType;
      const withDateFrom = filterValues.dateFrom.length > 0 ? withStatus.gte('due_date', filterValues.dateFrom) : withStatus;
      const queryWithFilters = filterValues.dateTo.length > 0 ? withDateFrom.lte('due_date', filterValues.dateTo) : withDateFrom;
      const result = await queryWithFilters.range(from, to);
      return result.error !== null
        ? Promise.reject(result.error)
        : { rows: result.data ?? [], totalCount: result.count ?? 0 };
    },
  });

  const navLinkTo: NavLinkTo = {
    tenant: ({ id: tenantId, content, style }) => <Link to="/app/tenants/$id" params={{ id: tenantId }} style={style}>{content}</Link>,
    property: ({ id: propertyId, content, style }) => <Link to="/app/properties/$id" params={{ id: propertyId }} style={style}>{content}</Link>,
    transaction: ({ id: transactionId, content, style, ariaLabel }) => <Link to="/app/transactions/$id" params={{ id: transactionId }} style={style} aria-label={ariaLabel}>{content}</Link>,
    edit: ({ content, style }) => <Link to="/app/leases/$id" params={{ id }} style={style}>{content}</Link>,
    leases: ({ content, style }) => <Link to="/app/leases" style={style}>{content}</Link>,
  };

  return (
    <Slave
      asyncData={asyncData}
      transactions={transactions}
      navLinkTo={navLinkTo}
    />
  );
};