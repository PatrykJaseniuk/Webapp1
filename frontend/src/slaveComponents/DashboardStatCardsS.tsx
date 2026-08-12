import { formatPln } from './format';

export type DashboardSummary = {
  readonly totalProperties: number;
  readonly occupiedProperties: number;
  readonly totalTenants: number;
  readonly activeTenants: number;
  readonly overdueItems: number;
  readonly totalUnpaidAmount: number;
};

export const cardLinkClass =
  'rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm hover:shadow-md transition-shadow';

export const statCardClass = 'rounded-lg border border-gray-200 bg-white p-4 text-center shadow-sm';
export const statValueClass = 'text-2xl font-bold';
export const statLabelClass = 'mt-1 text-xs text-gray-500';

export const navCardStyle = (): React.CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.25rem',
  height: '100%',
});

export const DashboardStatCardsS = ({ summary }: { readonly summary: DashboardSummary }): JSX.Element => (
  <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
    <div className={statCardClass}>
      <p className={`${statValueClass} text-blue-700`}>
        {summary.totalProperties}
        <span className="ml-1 text-sm font-normal text-gray-500">/ {summary.occupiedProperties} zajętych</span>
      </p>
      <p className={statLabelClass}>Nieruchomości</p>
    </div>
    <div className={statCardClass}>
      <p className={`${statValueClass} text-green-700`}>
        {summary.totalTenants}
        <span className="ml-1 text-sm font-normal text-gray-500">/ {summary.activeTenants} aktywnych</span>
      </p>
      <p className={statLabelClass}>Najemcy</p>
    </div>
    <div className={statCardClass}>
      <p className={`${statValueClass} text-red-700`}>
        {summary.overdueItems}
      </p>
      <p className={statLabelClass}>Zaległe pozycje</p>
    </div>
    <div className={statCardClass}>
      <p className={`${statValueClass} text-amber-700`}>
        {formatPln(summary.totalUnpaidAmount)}
      </p>
      <p className={statLabelClass}>Nieopłacone</p>
    </div>
  </div>
);