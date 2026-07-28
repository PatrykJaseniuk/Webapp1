import { match } from 'ts-pattern';
import { useAuth } from '@/hooks/AuthContext';
import { DashboardSummaryM } from '@/masterComponents/DashboardSummaryM';
import { AdminDashboard } from '@/slaveComponents/AdminDashboardS';
import { LandlordDashboard } from '@/slaveComponents/LandlordDashboardS';
import { TenantDashboardS } from '@/slaveComponents/TenantDashboardS';
import { LoadingSpinner } from '@/slaveComponents/LoadingSpinnerS';

export const DashboardPage = (): JSX.Element => {
  const authState = useAuth();

  return match(authState)
    .with({ tag: 'authenticated', role: 'admin' }, () => (
      <DashboardSummaryM Slave={AdminDashboard} />
    ))
    .with({ tag: 'authenticated', role: 'landlord' }, () => (
      <DashboardSummaryM Slave={LandlordDashboard} />
    ))
    .with({ tag: 'authenticated', role: 'tenant' }, () => (
      <DashboardSummaryM Slave={TenantDashboardS} />
    ))
    .with({ tag: 'loading' }, () => <LoadingSpinner />)
    .with({ tag: 'unauthenticated' }, () => <></>)
    .exhaustive();
};