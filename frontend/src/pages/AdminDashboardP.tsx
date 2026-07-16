import { DashboardSummaryM } from '@/masterComponents/DashboardSummaryM';
import { AdminDashboard } from '@/slaveComponents/AdminDashboardS';

const cards = [
  { to: '/admin/properties', title: 'Nieruchomości', subtitle: 'Zarządzaj nieruchomościami' },
  { to: '/admin/tenants', title: 'Najemcy', subtitle: 'Zarządzaj najemcami' },
  { to: '/admin/leases', title: 'Umowy najmu', subtitle: 'Zarządzaj umowami' },
];

export const AdminDashboardPage = (): JSX.Element => (
  <DashboardSummaryM
    Slave={({ asyncData }) => (
      <AdminDashboard
        cards={cards}
        asyncData={asyncData}
      />
    )}
  />
);
