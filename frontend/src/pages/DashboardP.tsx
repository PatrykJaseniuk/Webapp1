import { DashboardSummaryM } from '@/masterComponents/DashboardSummaryM';
import { AdminDashboard } from '@/slaveComponents/AdminDashboardS';

export const DashboardPage = (): JSX.Element => (
  <DashboardSummaryM Slave={AdminDashboard} />
);