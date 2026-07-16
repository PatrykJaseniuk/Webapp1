import { DashboardSummaryM } from '@/masterComponents/DashboardSummaryM';
import { LandlordDashboard } from '@/slaveComponents/LandlordDashboardS';

const cards = [
  { to: '/landlord/properties', title: 'Nieruchomości', subtitle: 'Zarządzaj nieruchomościami' },
  { to: '/landlord/tenants', title: 'Najemcy', subtitle: 'Zarządzaj najemcami' },
  { to: '/landlord/leases', title: 'Umowy najmu', subtitle: 'Zarządzaj umowami' },
];

export const LandlordDashboardPage = (): JSX.Element => (
  <DashboardSummaryM
    Slave={({ asyncData }) => (
      <LandlordDashboard
        cards={cards}
        asyncData={asyncData}
      />
    )}
  />
);
