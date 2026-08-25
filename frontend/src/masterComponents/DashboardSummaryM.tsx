import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import { toAsyncData, type AsyncData, type NavLink } from '@/generic';

type DashboardSummary = Readonly<{
  readonly totalProperties: number;
  readonly occupiedProperties: number;
  readonly totalTenants: number;
  readonly activeTenants: number;
  readonly totalUnpaidAmount: number;
  readonly overdueItems: number;
  readonly cashOnHand: number;
}>;

type NavLinkTo = Readonly<{
  readonly leases: NavLink;
  readonly tenants: NavLink;
  readonly properties: NavLink;
  readonly financialEntries: NavLink;
  readonly treasuries: NavLink;
}>;

export type DashboardSummarySProps = {
  readonly asyncData: AsyncData<DashboardSummary>;
  readonly navLinkTo: NavLinkTo;
};

type Props = {
  readonly Slave: ComponentType<DashboardSummarySProps>;
};

// Money is aggregated by the dashboard_summary view (numeric in SQL) rather than
// reduced over rows in JavaScript, so no float accumulation happens client-side.
const fetchSummary = async (): Promise<DashboardSummary> => {
  const { data, error } = await backendConnector
    .from('dashboard_summary')
    .select('*')
    .single();

  return error !== null
    ? Promise.reject(error)
    : {
        totalProperties: data.total_properties ?? 0,
        occupiedProperties: data.occupied_properties ?? 0,
        totalTenants: data.total_tenants ?? 0,
        activeTenants: data.active_tenants ?? 0,
        totalUnpaidAmount: data.total_unpaid_amount ?? 0,
        overdueItems: data.overdue_items ?? 0,
        cashOnHand: data.cash_on_hand ?? 0,
      };
};

export const DashboardSummaryM = ({
  Slave,
}: Props): JSX.Element => {
  const query = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: (): Promise<DashboardSummary> => fetchSummary(),
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
    tenants: ({ content, style }) => (
      <Link to="/app/tenants" style={style}>
        {content}
      </Link>
    ),
    properties: ({ content, style }) => (
      <Link to="/app/properties" style={style}>
        {content}
      </Link>
    ),
    financialEntries: ({ content, style }) => (
      <Link to="/app/financial-entries" style={style}>
        {content}
      </Link>
    ),
    treasuries: ({ content, style }) => (
      <Link to="/app/treasuries" style={style}>
        {content}
      </Link>
    ),
  };

  return <Slave asyncData={asyncData} navLinkTo={navLinkTo} />;
};
