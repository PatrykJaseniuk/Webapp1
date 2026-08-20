import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import { toAsyncData, type AsyncData, type NavLink } from '@/generic';

type TenantDashboardSummary = Readonly<{
  readonly activeLeases: number;
  readonly totalUnpaidAmount: number;
  readonly overdueItems: number;
}>;

type NavLinkTo = Readonly<{
  readonly leases: NavLink;
  readonly transactions: NavLink;
}>;

export type TenantDashboardSProps = {
  readonly asyncData: AsyncData<TenantDashboardSummary>;
  readonly navLinkTo: NavLinkTo;
};

type Props = {
  readonly Slave: ComponentType<TenantDashboardSProps>;
};

export const TenantDashboardM = ({ Slave }: Props): JSX.Element => {
  const query = useQuery({
    queryKey: ['tenantDashboard'],
    queryFn: async (): Promise<TenantDashboardSummary> => {
      const [leasesResult, unpaidResult] = await Promise.all([
        backendConnector
          .from('lease_agreements')
          .select('id', { count: 'exact', head: true })
          .eq('lease_status', 'active'),
        backendConnector.from('unpaid_transactions_summary').select('*'),
      ]);

      const combinedError = leasesResult.error ?? unpaidResult.error;

      return combinedError !== null
        ? Promise.reject(combinedError)
        : {
            activeLeases: leasesResult.count ?? 0,
            totalUnpaidAmount: (unpaidResult.data ?? []).reduce(
              (sum, u) => sum + (u.total_unpaid_amount ?? 0),
              0,
            ),
            overdueItems: (unpaidResult.data ?? []).reduce(
              (sum, u) => sum + (u.overdue_items_count ?? 0),
              0,
            ),
          };
    },
  });

  const asyncData = toAsyncData(query, () => {
    void query.refetch();
  });

  const navLinkTo: NavLinkTo = {
    leases: ({ content, style }) => (
      <Link to="/app/leases" style={style}>
        {content}
      </Link>
    ),
    transactions: ({ content, style }) => (
      <Link to="/app/transactions" style={style}>
        {content}
      </Link>
    ),
  };

  return <Slave asyncData={asyncData} navLinkTo={navLinkTo} />;
};
