import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import type { AppRole } from '@/hooks/AuthContext';
import {
  filterTextValue,
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

type LeaseTransactionFilter = 'text' | 'type' | 'status' | 'dateFrom' | 'dateTo';

const SORT_COLUMN_MAP: Readonly<Record<TransactionSortColumn, string>> = Object.freeze({
  due_date: 'due_date',
  type: 'type',
  amount: 'amount',
  transaction_status: 'transaction_status',
});

export type LeaseAgreementSProps = {
  readonly asyncData: AsyncData<LeaseAgreementWithRelationships>;
  readonly transactions: FilteredQueryResult<TransactionDbRow, TransactionSortColumn, LeaseTransactionFilter>;
  readonly navLinkTo: NavLinkTo;
};

type Props = {
  readonly Slave: ComponentType<LeaseAgreementSProps>;
  readonly id: string;
  readonly role: AppRole;
};

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

  const transactions = useFilteredPaginatedQuery<TransactionDbRow, TransactionSortColumn, LeaseTransactionFilter>({
    queryKey: ['transactions', 'leaseAgreement', id],
    defaultSort: { column: 'due_date', direction: 'desc' },
    fetchPage: async ({ sort: sortConfig, from, to, filter: filterConfig }) => {
      const ascending = sortConfig.direction === 'asc';
      const baseQuery = backendConnector
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('lease_id', id)
        .order(SORT_COLUMN_MAP[sortConfig.column], { ascending });
      const text = filterTextValue(filterConfig.text);
      const type = filterTextValue(filterConfig.type);
      const status = filterTextValue(filterConfig.status);
      const dateFrom = filterTextValue(filterConfig.dateFrom);
      const dateTo = filterTextValue(filterConfig.dateTo);
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