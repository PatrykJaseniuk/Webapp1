import { useAsync } from 'react-use';
import type { ComponentType } from 'react';
import { useCallback } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { AsyncData } from '@/generic';

type DashboardSummary = Readonly<{
  totalProperties: number;
  occupiedProperties: number;
  totalTenants: number;
  activeTenants: number;
  totalUnpaidAmount: number;
  overdueItems: number;
}>;

export type DashboardSummarySProps = {
  readonly asyncData: AsyncData<DashboardSummary>;
};

type Props = {
  readonly Slave: ComponentType<DashboardSummarySProps>;
};

export const DashboardSummaryM = ({
  Slave,
}: Props): JSX.Element => {
  const { loading, error: fetchError, value } = useAsync(async () => {
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
    return {
      propertiesCountResult,
      tenantsCountResult,
      unpaidResult,
      occupiedCountResult,
      activeTenantsCountResult,
    };
  }, []);

  const error = fetchError ??
    value?.propertiesCountResult.error ??
    value?.tenantsCountResult.error ??
    value?.unpaidResult.error ??
    value?.occupiedCountResult.error ??
    value?.activeTenantsCountResult.error;

  const totalProperties = value?.propertiesCountResult.count ?? 0;
  const occupiedProperties = value?.occupiedCountResult.count ?? 0;
  const totalTenants = value?.tenantsCountResult.count ?? 0;
  const activeTenants = value?.activeTenantsCountResult.count ?? 0;

  const unpaidItems = value?.unpaidResult.data ?? [];
  const totalUnpaidAmount = unpaidItems.reduce(
    (sum, u) => sum + (u.total_unpaid_amount ?? 0),
    0,
  );
  const overdueItems = unpaidItems.reduce(
    (sum, u) => sum + (u.overdue_items_count ?? 0),
    0,
  );

  const handleRetry = useCallback((): void => {
    window.location.reload();
  }, []);

  const asyncData: AsyncData<DashboardSummary> =
    loading ?
      { tag: 'pending' } :
      error ?
        { tag: 'rejected', message: error.message, onRetry: handleRetry } :
        {
          tag: 'fulfilled', data: {
            totalProperties,
            occupiedProperties,
            totalTenants,
            activeTenants,
            totalUnpaidAmount,
            overdueItems,
          }
        };

  return <Slave asyncData={asyncData} />;
};