import { NavLink } from 'react-router-dom';
import type { LinkComponent } from '@/generic';
import { LandlordDashboard } from '@/slaveComponents/LandlordDashboard';

const cards = [
  { to: '/landlord/properties', title: 'Nieruchomości', subtitle: 'Zarządzaj nieruchomościami' },
  { to: '/landlord/tenants', title: 'Najemcy', subtitle: 'Zarządzaj najemcami' },
];

export const LandlordDashboardPage = (): JSX.Element => (
  <LandlordDashboard
    LinkComponent={NavLink as unknown as LinkComponent}
    cards={cards}
  />
);
