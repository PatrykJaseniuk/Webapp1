import { NavLink } from 'react-router-dom';
import type { LinkComponent } from '@/generic';
import { DashboardSummaryData } from '@/masterComponents/DashboardSummaryM';
import { LandlordDashboard } from '@/slaveComponents/LandlordDashboardS';

const cards = [
  { to: '/landlord/properties', title: 'Nieruchomości', subtitle: 'Zarządzaj nieruchomościami' },
  { to: '/landlord/tenants', title: 'Najemcy', subtitle: 'Zarządzaj najemcami' },
  { to: '/landlord/leases', title: 'Umowy najmu', subtitle: 'Zarządzaj umowami' },
];

export const LandlordDashboardPage = (): JSX.Element => (
  <DashboardSummaryData
    SummaryComponent={({ state }) => (
      <LandlordDashboard
        LinkComponent={NavLink as unknown as LinkComponent}
        cards={cards}
        summaryState={state}
      />
    )}
  />
);