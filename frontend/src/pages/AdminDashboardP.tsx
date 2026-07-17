import { DashboardSummaryM } from '@/masterComponents/DashboardSummaryM';
import { AdminDashboard } from '@/slaveComponents/AdminDashboardS';

export const AdminDashboardPage = (): JSX.Element => (
  <DashboardSummaryM Slave={AdminDashboard} />
);