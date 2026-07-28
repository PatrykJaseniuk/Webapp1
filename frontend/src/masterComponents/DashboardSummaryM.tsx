import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import { toAsyncData, type AsyncData } from '@/generic';
import { NavLink } from '@/generic/utils';

type DashboardSummary = Readonly<{
  totalProperties: number;
  occupiedProperties: number;
  totalTenants: number;
  activeTenants: number;
  totalUnpaidAmount: number;
  overdueItems: number;
}>;

type NavLinkTo=  {
    leases:NavLink,
    tenants:NavLink,
    properties:NavLink
  };

export type DashboardSummarySProps = {
  readonly asyncData: AsyncData<DashboardSummary>;
  navLinkTo:NavLinkTo  
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

  const navLinkTo: NavLinkTo = {
    leases: ({ id: _id, content, style }) => <Link to='/app/leases' style={style}> {content}</Link>,
    tenants: ({ id: _id, content, style }) => <Link to='/app/tenants' style={style}> {content}</Link>,
    properties: ({ id: _id, content, style }) => <Link to='/app/properties' style={style}> {content}</Link>,
  }
  

  return <Slave asyncData={asyncData} navLinkTo={navLinkTo} />;
};