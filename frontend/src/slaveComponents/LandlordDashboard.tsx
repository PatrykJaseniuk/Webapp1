import type { LinkComponent } from '@/generic';

type DashboardCard = {
  readonly to: string;
  readonly title: string;
  readonly subtitle: string;
};

type Props = {
  readonly LinkComponent: LinkComponent;
  readonly cards: ReadonlyArray<DashboardCard>;
};

const dashboardCardClass =
  'rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm hover:shadow-md transition-shadow';

export const LandlordDashboard = ({
  LinkComponent,
  cards,
}: Props): JSX.Element => (
  <div className="flex flex-col items-center justify-center py-16">
    <h1 className="mb-2 text-3xl font-bold text-gray-900">Panel Wynajmującego</h1>
    <p className="text-gray-500">System zarządzania najmem</p>
    <div className="mt-8 grid gap-4 sm:grid-cols-2">
      {cards.map((card) => (
        <LinkComponent
          key={card.to}
          to={card.to}
          className={dashboardCardClass}
        >
          <p className="text-lg font-semibold text-gray-800">{card.title}</p>
          <p className="mt-1 text-sm text-gray-500">{card.subtitle}</p>
        </LinkComponent>
      ))}
    </div>
  </div>
);
