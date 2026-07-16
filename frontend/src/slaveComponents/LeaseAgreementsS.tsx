import { match } from 'ts-pattern';
import type { LeaseAgreementsSProps } from '@/masterComponents/LeaseAgreementsM';
import { LoadingSpinner } from './LoadingSpinnerS';
import { ErrorMessage } from './ErrorMessageS';

type Row = Extract<LeaseAgreementsSProps['asyncData'], { tag: 'fulfilled' }>['data'][number];
type LeaseStatus = Row['lease_status'];

const LEASE_STATUS_LABEL: Readonly<Record<LeaseStatus, string>> = Object.freeze({
  active: 'Aktywna',
  expired: 'Wygasła',
  terminated: 'Rozwiązana',
});

const pillClass = 'inline-block rounded-full px-2 py-0.5 text-xs font-medium';

const leaseStatusPillClass = (status: LeaseStatus): string =>
  status === 'active' ?
    `${pillClass} bg-green-50 text-green-700` :
    status === 'expired' ?
      `${pillClass} bg-gray-50 text-gray-600` :
      `${pillClass} bg-red-50 text-red-700`;

const tenantDisplayName = (r: Row): string =>
  r.tenants ?
    `${r.tenants.first_name ?? ''} ${r.tenants.last_name ?? ''}`.trim() :
    '';

const TableBody = ({
  leases,
  getTenantUrl,
  getPropertyUrl,
}: {
  readonly leases: readonly Row[];
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
            {leases.map((l) => (
              <tr key={l.id} className="border-b border-gray-100 text-sm">
                <td className="py-3 pr-4">
                  <a
                    href={getTenantUrl(l.tenant_id)}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {tenantDisplayName(l)}
                  </a>
                </td>
                <td className="py-3 pr-4">
                  <a
                    href={getPropertyUrl(l.property_id)}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {l.properties?.name ?? ''}
                  </a>
                </td>
                <td className="py-3 pr-4 text-gray-600">{l.start_date}</td>
                <td className="py-3 pr-4 text-gray-600">{l.end_date ?? '—'}</td>
                <td className="py-3 pr-4 text-right text-gray-900">
                  {l.monthly_rent.toLocaleString('pl-PL')} zł
                </td>
                <td className="py-3 pr-4">
                  <span className={leaseStatusPillClass(l.lease_status)}>
                    {LEASE_STATUS_LABEL[l.lease_status] ?? l.lease_status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

export const LeaseAgreementsTable = ({ asyncData, getTenantUrl, getPropertyUrl }: LeaseAgreementsSProps): JSX.Element => (
  <div className="min-h-[300px]">
    {match(asyncData)
      .with({ tag: 'pending' }, () => <LoadingSpinner />)
      .with({ tag: 'rejected' }, ({ message, onRetry }) => (
        <ErrorMessage message={message} onRetry={onRetry} />
      ))
      .with({ tag: 'fulfilled' }, ({ data }) => (
        <TableBody
          leases={data}
          getTenantUrl={getTenantUrl}
          getPropertyUrl={getPropertyUrl}
        />
      ))
      .exhaustive()}
  </div>
);