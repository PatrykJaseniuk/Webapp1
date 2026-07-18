import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import type { ComponentType, ReactNode } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import { toAsyncData, type AsyncData } from '@/generic';

type DashboardSummary = Readonly<{
  totalProperties: number;
  occupiedProperties: number;
  totalTenants: number;
  activeTenants: number;
  totalUnpaidAmount: number;
  overdueItems: number;
}>;

export type DashboardCard = Readonly<{
  link: ReactNode;
}>;

export type DashboardSummarySProps = {
  readonly asyncData: AsyncData<DashboardSummary>;
  readonly cards: readonly DashboardCard[];
};

type Props = {
  readonly Slave: ComponentType<DashboardSummarySProps>;
};

export const DashboardSummaryM = ({
  Slave,
}: Props): JSX.Element => {
  const query = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: async (): Promise<DashboardSummary> => {
      const [propertiesCountResult, tenantsCountResult, unpaidResult, occupiedCountResult, activeTenantsCountResult] = await Promise.all([
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
      if (combinedError !== null) throw combinedError;

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
    },
  });

  const asyncData = toAsyncData(query, () => { query.refetch(); });

  const cards: readonly DashboardCard[] = [
    { link: <Link to="/app/properties" className="block h-full">Nieruchomości<br />Zarządzaj nieruchomościami</Link> },
    { link: <Link to="/app/tenants" className="block h-full">Najemcy<br />Zarządzaj najemcami</Link> },
    { link: <Link to="/app/leases" className="block h-full">Umowy najmu<br />Zarządzaj umowami</Link> },
  ];

  return <Slave asyncData={asyncData} cards={cards} />;
};