import { match } from 'ts-pattern';
import type { LeaseAgreementsSProps } from '@/masterComponents/LeaseAgreementsM';
import { LoadingSpinner } from './LoadingSpinnerS';
import { ErrorMessage } from './ErrorMessageS';

type NavLinkTo = LeaseAgreementsSProps['navLinkTo'];

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

type TableBodyProps = {
  readonly leases: readonly Row[];
  readonly navLinkTo: NavLinkTo;
};

const TableBody = ({
  leases,
  navLinkTo,
}: TableBodyProps): JSX.Element =>
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
              <th className="py-3 pr-4 font-medium">Szczegóły</th>
            </tr>
          </thead>
          <tbody>
            {leases.map((l) => (
              <tr
                key={l.id}
                className="border-b border-gray-100 text-sm"
              >
                <td className="py-3 pr-4">
                  {navLinkTo.tenant({ id: l.tenant_id, content: `${l.tenants.first_name} ${l.tenants.last_name}`, style: { color: '#2563eb' } })}
                </td>
                <td className="py-3 pr-4">
                  {navLinkTo.property({ id: l.property_id, content: l.properties.name, style: { color: '#2563eb' } })}
                </td>
                <td className="py-3 pr-4 text-gray-600">{l.start_date}</td>
                <td className="py-3 pr-4 text-gray-600">{l.end_date ?? '—'}</td>
                <td className="py-3 pr-4 text-right text-gray-900">{l.monthly_rent.toLocaleString('pl-PL')} zł</td>
                <td className="py-3 pr-4">
                  <span className={leaseStatusPillClass(l.lease_status)}>
                    {LEASE_STATUS_LABEL[l.lease_status] ?? l.lease_status}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  {navLinkTo.leaseAgreement({ id: l.id, content: 'Szczegóły', style: { color: '#2563eb' } })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

export const LeaseAgreementsS = ({ asyncData, navLinkTo }: LeaseAgreementsSProps): JSX.Element => (
  <div className="min-h-[300px]">
    {match(asyncData)
      .with({ tag: 'pending' }, () => <LoadingSpinner />)
      .with({ tag: 'rejected' }, ({ message, onRetry }) => (
        <ErrorMessage message={message} onRetry={onRetry} />
      ))
      .with({ tag: 'fulfilled' }, ({ data }) => (
        <TableBody
          leases={data}
          navLinkTo={navLinkTo}
        />
      ))
      .exhaustive()}
  </div>
);