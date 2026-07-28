import type { ComponentType } from 'react';
import { useAuth } from '@/hooks/AuthContext';
import { DashboardSummaryM, type DashboardSummarySProps } from '@/masterComponents/DashboardSummaryM';
import { AdminDashboard } from '@/slaveComponents/AdminDashboardS';
import { LandlordDashboard } from '@/slaveComponents/LandlordDashboardS';
import { TenantDashboardS } from '@/slaveComponents/TenantDashboardS';

export const DashboardPage = (): JSX.Element => {
  const authState = useAuth();

  const DashboardSlave: ComponentType<DashboardSummarySProps> =
    authState.tag === 'authenticated' && authState.role === 'admin' ?
      AdminDashboard as ComponentType<DashboardSummarySProps> :
      authState.tag === 'authenticated' && authState.role === 'landlord' ?
        LandlordDashboard as unknown as ComponentType<DashboardSummarySProps> :
        TenantDashboardS as unknown as ComponentType<DashboardSummarySProps>;

  return <DashboardSummaryM Slave={DashboardSlave} />;
};
