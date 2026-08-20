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
}>;

type NavLinkTo = Readonly<{
  readonly leases: NavLink;
  readonly tenants: NavLink;
  readonly properties: NavLink;
  readonly transactions: NavLink;
}>;

export type DashboardSummarySProps = {
  readonly asyncData: AsyncData<DashboardSummary>;
  readonly navLinkTo: NavLinkTo;
};

type Props = {
  readonly Slave: ComponentType<DashboardSummarySProps>;
};

const buildSummary = (
  propertiesCountResult: { readonly count: number | null; readonly error: unknown },
  tenantsCountResult: { readonly count: number | null; readonly error: unknown },
  unpaidResult: { readonly data: readonly { readonly total_unpaid_amount: number | null; readonly overdue_items_count: number | null }[] | null; readonly error: unknown },
  occupiedCountResult: { readonly count: number | null; readonly error: unknown },
  activeTenantsCountResult: { readonly count: number | null; readonly error: unknown },
): DashboardSummary => {
  const totalProperties = propertiesCountResult.count ?? 0;
  const occupiedProperties = occupiedCountResult.count ?? 0;
  const totalTenants = tenantsCountResult.count ?? 0;
  const activeTenants = activeTenantsCountResult.count ?? 0;

  const unpaidItems = unpaidResult.data ?? [];
  const totalUnpaidAmount = unpaidItems.reduce(
    (sum, u) => sum + (u.total_unpaid_amount ?? 0),
    0,
  );
  const overdueItems = unpaidItems.reduce(
    (sum, u) => sum + (u.overdue_items_count ?? 0),
    0,
  );

  return {
    totalProperties,
    occupiedProperties,
    totalTenants,
    activeTenants,
    totalUnpaidAmount,
    overdueItems,
  };
};

export const DashboardSummaryM = ({
  Slave,
}: Props): JSX.Element => {
  const query = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: async (): Promise<DashboardSummary> => {
      const [
        propertiesCountResult,
        tenantsCountResult,
        unpaidResult,
        occupiedCountResult,
        activeTenantsCountResult,
      ] = await Promise.all([
        backendConnector
          .from('properties')
          .select('*', { count: 'exact', head: true }),
        backendConnector
          .from('tenants')
          .select('*', { count: 'exact', head: true }),
        backendConnector
          .from('unpaid_transactions_summary')
          .select('*'),
        backendConnector
          .from('property_occupancy')
          .select('*', { count: 'exact', head: true })
          .eq('property_status', 'occupied'),
        backendConnector
          .from('tenants')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_status', 'active'),
      ]);

      const combinedError =
        propertiesCountResult.error ??
        tenantsCountResult.error ??
        unpaidResult.error ??
        occupiedCountResult.error ??
        activeTenantsCountResult.error;

      return combinedError !== null
        ? Promise.reject(combinedError)
        : buildSummary(
            propertiesCountResult,
            tenantsCountResult,
            unpaidResult,
            occupiedCountResult,
            activeTenantsCountResult,
          );
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
    transactions: ({ content, style }) => (
      <Link to="/app/transactions" style={style}>
        {content}
      </Link>
    ),
  };

  return <Slave asyncData={asyncData} navLinkTo={navLinkTo} />;
};