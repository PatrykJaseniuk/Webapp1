import { NavLink } from 'react-router-dom';
import type { LinkComponent } from '@/generic';
import { AdminDashboard } from '@/slaveComponents/AdminDashboard';

const cards = [
  { to: '/admin/properties', title: 'Nieruchomości', subtitle: 'Zarządzaj nieruchomościami' },
  { to: '/admin/tenants', title: 'Najemcy', subtitle: 'Zarządzaj najemcami' },
];

export const AdminDashboardPage = (): JSX.Element => (
  <AdminDashboard
    LinkComponent={NavLink as unknown as LinkComponent}
    cards={cards}
  />
);
