import { match } from 'ts-pattern';
import type { DashboardSummarySProps } from '@/masterComponents/DashboardSummaryM';
import { LoadingSpinner } from './LoadingSpinnerS';
import { cardLinkClass, DashboardStatCardsS, navCardStyle } from './DashboardStatCardsS';

type Props = DashboardSummarySProps;

export const AdminDashboard = ({
  asyncData,
  navLinkTo
}: Props): JSX.Element => (
  <div className="flex flex-col items-center justify-center py-16">
    <h1 className="mb-2 text-3xl font-bold text-gray-900">Panel Administratora</h1>
    <p className="text-gray-500">System zarządzania najmem</p>

    <div className="mt-6 w-full max-w-3xl min-h-[200px]">
      {match(asyncData)
        .with({ tag: 'pending' }, () => <LoadingSpinner />)
        .with({ tag: 'rejected' }, () => undefined)
        .with({ tag: 'fulfilled' }, ({ data }) => <DashboardStatCardsS summary={data} />)
        .exhaustive()}
    </div>

    <div className="mt-4 grid gap-4 sm:grid-cols-3">
      <div className={cardLinkClass}>
        {navLinkTo.leases({ style: navCardStyle(), content: 'Umowy' })}
      </div>
      <div className={cardLinkClass}>
        {navLinkTo.tenants({ style: navCardStyle(), content: 'Najemcy' })}
      </div>
      <div className={cardLinkClass}>
        {navLinkTo.properties({ style: navCardStyle(), content: 'Nieruchomości' })}
      </div>
    </div>
  </div>
);