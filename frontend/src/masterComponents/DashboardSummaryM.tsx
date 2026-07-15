import { useAsync } from 'react-use';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { DataMode, DashboardSummary } from '@/generic';

type DashboardViewProps = {
  readonly dataMode: DataMode<DashboardSummary>;
};

type Props = {
  readonly SummaryComponent: ComponentType<DashboardViewProps>;
};

export const DashboardSummaryData = ({
  SummaryComponent,
}: Props): JSX.Element => {
  const { loading, error, value } = useAsync(async (): Promise<DashboardSummary> => {
    const [propertiesCount, tenantsCount, unpaidResult] = await Promise.all([
      backendConnector
        .from('properties')
        .select('*', { count: 'exact', head: true }),
      backendConnector
        .from('tenants')
        .select('*', { count: 'exact', head: true }),
      backendConnector
        .from('unpaid_transactions_summary')
        .select('*'),
    ]);

    const occupiedCount =
      await backendConnector
        .from('property_occupancy')
        .select('*', { count: 'exact', head: true })
        .eq('property_status', 'occupied');

    const activeTenantsCount =
      await backendConnector
        .from('tenants')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_status', 'active');

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
      totalProperties: propertiesCount.count ?? 0,
      occupiedProperties: occupiedCount.count ?? 0,
      totalTenants: tenantsCount.count ?? 0,
      activeTenants: activeTenantsCount.count ?? 0,
      totalUnpaidAmount,
      overdueItems,
    };
  }, []);

  const dataMode: DataMode<DashboardSummary> =
    loading ?
      { tag: 'pending' } :
      error !== undefined ?
        { tag: 'rejected', message: error.message, onRetry: () => window.location.reload() } :
        { tag: 'fulfilled', data: value! };

  return <SummaryComponent dataMode={dataMode} />;
};