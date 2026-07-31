import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import type { AppRole } from '@/hooks/AuthContext';
import { toAsyncData, usePagination, useSort, type AsyncData, type SortConfig } from '@/generic';
import type { NavLinkWithId } from '@/generic';

type TransactionDbRow = Database['public']['Tables']['transactions']['Row'];

type TransactionListRow = TransactionDbRow & {
  readonly properties: { readonly name: string } | null;
  readonly lease_agreements: { readonly start_date: string } | null;
};

type NavLinkTo = Readonly<{
  readonly transaction: NavLinkWithId;
  readonly property: NavLinkWithId;
  readonly lease: NavLinkWithId;
}>;

type TransactionSortColumn = Extract<keyof TransactionDbRow, 'due_date' | 'type' | 'amount' | 'transaction_status'> | 'properties';

const SORT_COLUMN_MAP: Readonly<Record<TransactionSortColumn, string>> = Object.freeze({
  due_date: 'due_date',
  type: 'type',
  amount: 'amount',
  transaction_status: 'transaction_status',
  properties: 'properties(name)',
});

type TransactionsPageData = {
  readonly rows: readonly TransactionListRow[];
  readonly totalCount: number;
};

export type TransactionsSProps = {
  readonly asyncData: AsyncData<TransactionsPageData>;
  readonly navLinkTo: NavLinkTo;
  readonly sort: {
    readonly config: SortConfig<TransactionSortColumn>;
    readonly doSort: (column: TransactionSortColumn) => void;
  };
  readonly pagination: {
    readonly page: number;
    readonly pageSize: number;
    readonly prevPage: () => void;
    readonly nextPage: () => void;
  };
};

type Props = {
  readonly Slave: ComponentType<TransactionsSProps>;
  readonly role: AppRole;
};

const PAGE_SIZE = 20;

export const TransactionsM = ({
  Slave,
  role: _role,
}: Props): JSX.Element => {
  const [sortConfig, onSort] = useSort<TransactionSortColumn>('due_date', 'desc');
  const [pagination, { goToPage, ...pageControls }] = usePagination(1, PAGE_SIZE);

  const doSort = (column: TransactionSortColumn): void => {
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
    queryKey: ['transactions', sortConfig.column, sortConfig.direction, pagination.page, pagination.pageSize],
    queryFn: async (): Promise<TransactionsPageData> => {
      const ascending = sortConfig.direction === 'asc';
      const from = (pagination.page - 1) * pagination.pageSize;
      const to = from + pagination.pageSize - 1;
      const r = await backendConnector
        .from('transactions')
        .select('*, properties(name), lease_agreements(start_date)', { count: 'exact' })
        .order(SORT_COLUMN_MAP[sortConfig.column], { ascending })
        .range(from, to);
      return r.error !== null ? Promise.reject(r.error) : { rows: r.data ?? [], totalCount: r.count ?? 0 };
    },
    placeholderData: (prev) => prev,
  });

  const asyncData = toAsyncData(query, () => { void query.refetch(); }, query.isFetching);

  const navLinkTo: NavLinkTo = {
    transaction: ({ id, content, style, ariaLabel }) => <Link to="/app/transactions/$id" params={{ id }} style={style} aria-label={ariaLabel}>{content}</Link>,
    property: ({ id, content, style }) => <Link to="/app/properties/$id" params={{ id }} style={style}>{content}</Link>,
    lease: ({ id, content, style }) => <Link to="/app/leases/$id" params={{ id }} style={style}>{content}</Link>,
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
