import { useUrls } from '@/hooks/useUrls';
import { DashboardSummaryM } from '@/masterComponents/DashboardSummaryM';
import { AdminDashboard } from '@/slaveComponents/AdminDashboardS';

export const AdminDashboardPage = (): JSX.Element => {
  const { url } = useUrls();
  const cards = [
    { to: url.propertiesList(), title: 'Nieruchomości', subtitle: 'Zarządzaj nieruchomościami' },
    { to: url.tenantsList(), title: 'Najemcy', subtitle: 'Zarządzaj najemcami' },
    { to: url.leasesList(), title: 'Umowy najmu', subtitle: 'Zarządzaj umowami' },
  ];

  return (
    <DashboardSummaryM
      Slave={({ asyncData }) => (
        <AdminDashboard
          cards={cards}
          asyncData={asyncData}
        />
      )}
    />
  );
};
