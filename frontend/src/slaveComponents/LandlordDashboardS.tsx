import { match } from 'ts-pattern';
import type { DashboardSummarySProps } from '@/masterComponents/DashboardSummaryM';
import { LoadingSpinner } from './LoadingSpinnerS';

type Props = DashboardSummarySProps;
type DashboardSummary = Extract<Props['asyncData'], { tag: 'fulfilled' }>['data'];

const cardLinkClass =
  'rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm hover:shadow-md transition-shadow';

const statCardClass = 'rounded-lg border border-gray-200 bg-white p-4 text-center shadow-sm';
const statValueClass = 'text-2xl font-bold';
const statLabelClass = 'mt-1 text-xs text-gray-500';

const StatCards = ({ summary }: { readonly summary: DashboardSummary }): JSX.Element => (
  <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
    <div className={statCardClass}>
      <p className={`${statValueClass} text-blue-700`}>
        {summary.totalProperties}
        <span className="ml-1 text-sm font-normal text-gray-400">/ {summary.occupiedProperties} zajętych</span>
      </p>
      <p className={statLabelClass}>Nieruchomości</p>
    </div>
    <div className={statCardClass}>
      <p className={`${statValueClass} text-green-700`}>
        {summary.totalTenants}
        <span className="ml-1 text-sm font-normal text-gray-400">/ {summary.activeTenants} aktywnych</span>
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
        {summary.totalUnpaidAmount.toLocaleString('pl-PL')} zł
      </p>
      <p className={statLabelClass}>Nieopłacone</p>
    </div>
  </div>
);

const navCardStyle = (): React.CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.25rem',
  height: '100%',
});

export const LandlordDashboard = ({
  asyncData,
  navLinkTo,
}: Props): JSX.Element => (
  <div className="flex flex-col items-center justify-center py-16">
    <h1 className="mb-2 text-3xl font-bold text-gray-900">Panel Wynajmującego</h1>
    <p className="text-gray-500">System zarządzania najmem</p>

    <div className="mt-6 w-full max-w-3xl min-h-[200px]">
      {match(asyncData)
        .with({ tag: 'pending' }, () => <LoadingSpinner />)
        .with({ tag: 'rejected' }, () => undefined)
        .with({ tag: 'fulfilled' }, ({ data }) => <StatCards summary={data} />)
        .exhaustive()}
    </div>

    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <div className={cardLinkClass}>
        {navLinkTo.leases({ style: navCardStyle(), content: 'Umowy' })}
      </div>
      <div className={cardLinkClass}>
        {navLinkTo.tenants({ style: navCardStyle(), content: 'Najemcy' })}
      </div>
    </div>
  </div>
);