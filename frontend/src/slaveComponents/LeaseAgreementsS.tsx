import { match } from 'ts-pattern';
import type { LeaseAgreementsSProps } from '@/masterComponents/LeaseAgreementsM';
import { ErrorMessage } from './ErrorMessageS';

type NavLinkTo = LeaseAgreementsSProps['navLinkTo'];
type Sort = LeaseAgreementsSProps['sort'];
type SortColumn = Sort['config']['column'];

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

type SortHeaderProps = {
  readonly column: SortColumn;
  readonly label: string;
  readonly sort: Sort;
  readonly align?: 'left' | 'right';
  readonly className?: string;
};

const SortHeader = ({
  column,
  label,
  sort,
  align = 'left',
  className = '',
}: SortHeaderProps): JSX.Element => {
  const isActive = sort.config.column === column;
  const isAsc = isActive && sort.config.direction === 'asc';
  const isDesc = isActive && sort.config.direction === 'desc';
  const alignClass = align === 'right' ? 'text-right' : 'text-left';
  return (
    <th
      className={`${className} cursor-pointer select-none py-3 pr-4 font-medium whitespace-nowrap ${alignClass}`}
      onClick={() => sort.doSort(column)}
    >
      <span className="text-gray-500">{label}</span>
      <span className="ml-1 inline-block w-3 text-xs text-gray-400">
        {isAsc ? '▲' : isDesc ? '▼' : '△'}
      </span>
    </th>
  );
};

type TableProps = {
  readonly leases: readonly Row[];
  readonly navLinkTo: NavLinkTo;
  readonly sort: Sort;
  readonly isFetching: boolean;
};

const FetchProgress = (): JSX.Element => (
  <div className="absolute top-0 left-0 right-0 h-0.5 overflow-hidden bg-blue-100" role="progressbar" aria-label="Ładowanie danych">
    <div className="h-full animate-[indeterminate_1.5s_ease-in-out_infinite] bg-blue-500" />
  </div>
);

const skeletonBar = 'h-4 animate-pulse rounded bg-gray-200';

const HEADERS = (
  <tr className="border-b border-gray-200 text-sm">
    <th className="w-[18%] py-3 pr-4 font-medium whitespace-nowrap text-gray-500">Najemca<span className="ml-1 inline-block w-3" /></th>
    <th className="w-[18%] py-3 pr-4 font-medium whitespace-nowrap text-gray-500">Nieruchomość<span className="ml-1 inline-block w-3" /></th>
    <th className="w-[12%] py-3 pr-4 font-medium whitespace-nowrap text-gray-500">Od<span className="ml-1 inline-block w-3" /></th>
    <th className="w-[12%] py-3 pr-4 font-medium whitespace-nowrap text-gray-500">Do<span className="ml-1 inline-block w-3" /></th>
    <th className="w-[12%] py-3 pr-4 text-right font-medium whitespace-nowrap text-gray-500">Czynsz<span className="ml-1 inline-block w-3" /></th>
    <th className="w-[14%] py-3 pr-4 font-medium whitespace-nowrap text-gray-500">Status<span className="ml-1 inline-block w-3" /></th>
    <th className="w-[14%] py-3 pr-4 font-medium text-gray-500">Szczegóły</th>
  </tr>
);

const SKELETON_ROWS = Array.from({ length: 4 }, (_, i) => (
  <tr key={`skel-${i}`} className="border-b border-gray-100">
    <td className="py-3 pr-4"><div className={`${skeletonBar} w-24`} /></td>
    <td className="py-3 pr-4"><div className={`${skeletonBar} w-28`} /></td>
    <td className="py-3 pr-4"><div className={`${skeletonBar} w-20`} /></td>
    <td className="py-3 pr-4"><div className={`${skeletonBar} w-20`} /></td>
    <td className="py-3 pr-4"><div className={`${skeletonBar} ml-auto w-16`} /></td>
    <td className="py-3 pr-4"><div className={`${skeletonBar} w-20`} /></td>
    <td className="py-3 pr-4"><div className={`${skeletonBar} w-20`} /></td>
  </tr>
));

const SkeletonTable = (): JSX.Element => (
  <div className="relative overflow-x-auto">
    <FetchProgress />
    <table className="w-full min-w-[640px] table-fixed border-collapse text-left">
      <thead>{HEADERS}</thead>
      <tbody>{SKELETON_ROWS}</tbody>
    </table>
  </div>
);

const TableView = ({
  leases,
  navLinkTo,
  sort,
  isFetching,
}: TableProps): JSX.Element => (
  <div className="relative overflow-x-auto">
    {isFetching && <FetchProgress />}
    <table className="w-full min-w-[640px] table-fixed border-collapse text-left">
      <thead>
        <tr className="border-b border-gray-200 text-sm">
          <SortHeader className="w-[18%]" column="tenants" label="Najemca" sort={sort} />
          <SortHeader className="w-[18%]" column="properties" label="Nieruchomość" sort={sort} />
          <SortHeader className="w-[12%]" column="start_date" label="Od" sort={sort} />
          <SortHeader className="w-[12%]" column="end_date" label="Do" sort={sort} />
          <SortHeader className="w-[12%]" column="monthly_rent" label="Czynsz" sort={sort} align="right" />
          <SortHeader className="w-[14%]" column="lease_status" label="Status" sort={sort} />
          <th className="w-[14%] py-3 pr-4 font-medium text-gray-500">Szczegóły</th>
        </tr>
      </thead>
      <tbody>
        {leases.length === 0 ?
          <tr>
            <td colSpan={7} className="py-8 text-center text-gray-500">
              Brak umów najmu.
            </td>
          </tr> :
          leases.map((l) => (
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

export const LeaseAgreementsS = ({ asyncData, navLinkTo, sort }: LeaseAgreementsSProps): JSX.Element => (
  <div className="min-h-[300px]">
    {match(asyncData)
      .with({ tag: 'pending' }, () => <SkeletonTable />)
      .with({ tag: 'rejected' }, ({ message, onRetry }) => (
        <ErrorMessage message={message} onRetry={onRetry} />
      ))
      .with({ tag: 'fulfilled' }, ({ data, isFetching }) => (
        <TableView leases={data} navLinkTo={navLinkTo} sort={sort} isFetching={isFetching ?? false} />
      ))
      .exhaustive()}
  </div>
);