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
  readonly financialEntries: NavLink;
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
      // dashboard_summary is security_invoker, so every figure is already
      // filtered to this tenant's own leases and summed in SQL (numeric).
      const { data, error } = await backendConnector
        .from('dashboard_summary')
        .select('active_leases, total_unpaid_amount, overdue_items')
        .single();

      return error !== null
        ? Promise.reject(error)
        : {
            activeLeases: data.active_leases ?? 0,
            totalUnpaidAmount: data.total_unpaid_amount ?? 0,
            overdueItems: data.overdue_items ?? 0,
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
    financialEntries: ({ content, style }) => (
      <Link to="/app/financial-entries" style={style}>
        {content}
      </Link>
    ),
  };

  return <Slave asyncData={asyncData} navLinkTo={navLinkTo} />;
};
