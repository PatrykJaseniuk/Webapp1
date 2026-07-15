import { NavLink } from 'react-router-dom';
import type { LinkComponent } from '@/generic';
import { DashboardSummaryData } from '@/masterComponents/DashboardSummaryM';
import { AdminDashboard } from '@/slaveComponents/AdminDashboardS';

const cards = [
  { to: '/admin/properties', title: 'Nieruchomości', subtitle: 'Zarządzaj nieruchomościami' },
  { to: '/admin/tenants', title: 'Najemcy', subtitle: 'Zarządzaj najemcami' },
  { to: '/admin/leases', title: 'Umowy najmu', subtitle: 'Zarządzaj umowami' },
];

export const AdminDashboardPage = (): JSX.Element => (
  <DashboardSummaryData
    SummaryComponent={({ dataMode }) => (
      <AdminDashboard
        LinkComponent={NavLink as unknown as LinkComponent}
        cards={cards}
        dataMode={dataMode}
      />
    )}
  />
);