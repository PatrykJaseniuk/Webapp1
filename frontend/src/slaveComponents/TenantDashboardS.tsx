import { match } from 'ts-pattern';
import type { DashboardSummarySProps } from '@/masterComponents/DashboardSummaryM';
import { LoadingSpinner } from './LoadingSpinnerS';
import { ErrorMessage } from './ErrorMessageS';

type Props = DashboardSummarySProps;

export const TenantDashboardS = ({ asyncData }: Props): JSX.Element => (
  <div className="flex flex-col items-center justify-center py-16">
    <h1 className="mb-2 text-3xl font-bold text-gray-900">Panel Najemcy</h1>
    <p className="text-gray-500">Twoje umowy i płatności</p>
    <div className="mt-6 w-full max-w-3xl min-h-[200px]">
      {match(asyncData)
        .with({ tag: 'pending' }, () => <LoadingSpinner />)
        .with({ tag: 'rejected' }, ({ message, onRetry }) => (
          <ErrorMessage message={message} onRetry={onRetry} />
        ))
        .with({ tag: 'fulfilled' }, () => undefined)
        .exhaustive()}
    </div>
  </div>
);