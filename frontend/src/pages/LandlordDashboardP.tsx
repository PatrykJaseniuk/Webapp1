import { DashboardSummaryM } from '@/masterComponents/DashboardSummaryM';
import { LandlordDashboard } from '@/slaveComponents/LandlordDashboardS';

export const LandlordDashboardPage = (): JSX.Element => (
  <DashboardSummaryM Slave={LandlordDashboard} />
);