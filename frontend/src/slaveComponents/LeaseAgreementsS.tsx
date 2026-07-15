import { match } from 'ts-pattern';
import type { EnrichedLeaseAgreementRow } from '@/masterComponents/LeaseAgreementsM';
import type { DataMode } from '@/generic';
import { LoadingSpinner } from './LoadingSpinnerS';
import { ErrorMessage } from './ErrorMessageS';

const LEASE_STATUS_LABEL: Readonly<Record<string, string>> = Object.freeze({
  active: 'Aktywna',
  expired: 'Wygasła',
  terminated: 'Rozwiązana',
});

const pillClass = 'inline-block rounded-full px-2 py-0.5 text-xs font-medium';

const leaseStatusPillClass = (status: string): string =>
  status === 'active' ?
    `${pillClass} bg-green-50 text-green-700` :
    status === 'expired' ?
      `${pillClass} bg-gray-50 text-gray-600` :
      `${pillClass} bg-red-50 text-red-700`;

type Props = {
  readonly dataMode: DataMode<readonly EnrichedLeaseAgreementRow[]>;
  readonly getDetailUrl: (id: string) => string;
  readonly getTenantUrl: (tenantId: string) => string;
  readonly getPropertyUrl: (propertyId: string) => string;
};

const TableBody = ({
  leases,
  getDetailUrl,
  getTenantUrl,
  getPropertyUrl,
}: {
  readonly leases: readonly EnrichedLeaseAgreementRow[];
  readonly getDetailUrl: (id: string) => string;
  readonly getTenantUrl: (tenantId: string) => string;
  readonly getPropertyUrl: (propertyId: string) => string;
}): JSX.Element =>
  leases.length === 0 ?
    <p className="py-8 text-center text-gray-500">Brak umów najmu.</p> :
    (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-200 text-sm text-gray-500">
              <th className="py-3 pr-4 font-medium">Najemca</th>
              <th className="py-3 pr-4 font-medium">Nieruchomość</th>
              <th className="py-3 pr-4 font-medium">Od</th>
              <th className="py-3 pr-4 font-medium">Do</th>
              <th className="py-3 pr-4 font-medium text-right">Czynsz</th>
              <th className="py-3 pr-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {leases.map((l: EnrichedLeaseAgreementRow) => (
              <tr key={l.id} className="border-b border-gray-100 text-sm">
                <td className="py-3 pr-4">
                  <a
                    href={getTenantUrl(l.tenantId)}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {l.tenantName}
                  </a>
                </td>
                <td className="py-3 pr-4">
                  <a
                    href={getPropertyUrl(l.propertyId)}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {l.propertyName}
                  </a>
                </td>
                <td className="py-3 pr-4 text-gray-600">{l.startDate}</td>
                <td className="py-3 pr-4 text-gray-600">{l.endDate ?? '—'}</td>
                <td className="py-3 pr-4 text-right text-gray-900">
                  {l.monthlyRent.toLocaleString('pl-PL')} zł
                </td>
                <td className="py-3 pr-4">
                  <span className={leaseStatusPillClass(l.leaseStatus)}>
                    {LEASE_STATUS_LABEL[l.leaseStatus] ?? l.leaseStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

export const LeaseAgreementsTable = ({ state, getDetailUrl, getTenantUrl, getPropertyUrl }: Props): JSX.Element => (
  <div className="min-h-[300px]">
    {match(state)
      .with({ tag: 'pending' }, () => <LoadingSpinner />)
      .with({ tag: 'rejected' }, ({ message, onRetry }) => (
        <ErrorMessage message={message} onRetry={onRetry} />
      ))
      .with({ tag: 'fulfilled' }, ({ data }) => (
        <TableBody
          leases={data}
          getDetailUrl={getDetailUrl}
          getTenantUrl={getTenantUrl}
          getPropertyUrl={getPropertyUrl}
        />
      ))
      .exhaustive()}
  </div>
);