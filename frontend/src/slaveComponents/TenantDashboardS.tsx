import { match } from 'ts-pattern';
import type { TenantDashboardSProps } from '@/masterComponents/TenantDashboardM';
import { LoadingSpinner } from './LoadingSpinnerS';
import { ErrorMessage } from './ErrorMessageS';
import { cardLinkClass, navCardStyle, statCardClass, statValueClass, statLabelClass } from './DashboardStatCardsS';
import { formatPln } from './format';

type Props = TenantDashboardSProps;

export const TenantDashboardS = ({
  asyncData,
  navLinkTo,
}: Props): JSX.Element => (
  <div className="flex flex-col items-center justify-center py-16">
    <h1 className="mb-2 text-3xl font-bold text-gray-900">Panel Najemcy</h1>
    <p className="text-gray-500">Twoje umowy i płatności</p>

    <div className="mt-6 w-full max-w-3xl min-h-[300px]">
      {match(asyncData)
        .with({ tag: 'pending' }, () => <LoadingSpinner />)
        .with({ tag: 'rejected' }, ({ message, onRetry }) => (
          <ErrorMessage message={message} onRetry={onRetry} />
        ))
        .with({ tag: 'fulfilled' }, ({ data }) => (
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className={statCardClass}>
              <p className={`${statValueClass} text-blue-700`}>{data.activeLeases}</p>
              <p className={statLabelClass}>Aktywne umowy</p>
            </div>
            <div className={statCardClass}>
              <p className={`${statValueClass} text-red-700`}>{data.overdueItems}</p>
              <p className={statLabelClass}>Zaległe pozycje</p>
            </div>
            <div className={statCardClass}>
              <p className={`${statValueClass} text-amber-700`}>{formatPln(data.totalUnpaidAmount)}</p>
              <p className={statLabelClass}>Nieopłacone</p>
            </div>
          </div>
        ))
        .exhaustive()}
    </div>

    <div className="mt-4 grid w-full max-w-3xl gap-4 sm:grid-cols-2">
      <div className={cardLinkClass}>
        {navLinkTo.leases({ style: navCardStyle(), content: 'Moje umowy' })}
      </div>
      <div className={cardLinkClass}>
        {navLinkTo.financialEntries({ style: navCardStyle(), content: 'Finanse' })}
      </div>
    </div>
  </div>
);