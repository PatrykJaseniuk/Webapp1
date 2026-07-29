import { match } from 'ts-pattern';
import type { TenantsSProps } from '@/masterComponents/TenantsM';
import { ErrorMessage } from './ErrorMessageS';

type Row = Extract<TenantsSProps['asyncData'], { tag: 'fulfilled' }>['data'][number];
type NavLinkTo = TenantsSProps['navLinkTo'];
type Sort = TenantsSProps['sort'];
type SortColumn = Sort['config']['column'];
type TenantStatus = Row['tenant_status'];

export const STATUS_LABEL: Readonly<Record<TenantStatus, string>> = Object.freeze({
  active: 'Aktywny',
  past: 'Były',
  applicant: 'Kandydat',
});

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
  readonly tenants: readonly Row[];
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
    <th className="w-[20%] py-3 pr-4 font-medium whitespace-nowrap text-gray-500">Nazwisko<span className="ml-1 inline-block w-3" /></th>
    <th className="w-[18%] py-3 pr-4 font-medium whitespace-nowrap text-gray-500">Imię<span className="ml-1 inline-block w-3" /></th>
    <th className="w-[26%] py-3 pr-4 font-medium whitespace-nowrap text-gray-500">Email<span className="ml-1 inline-block w-3" /></th>
    <th className="w-[18%] py-3 pr-4 font-medium text-gray-500">Telefon</th>
    <th className="w-[18%] py-3 pr-4 font-medium whitespace-nowrap text-gray-500">Status<span className="ml-1 inline-block w-3" /></th>
  </tr>
);

const SKELETON_ROWS = Array.from({ length: 4 }, (_, i) => (
  <tr key={`skel-${i}`} className="border-b border-gray-100">
    <td className="py-3 pr-4"><div className={`${skeletonBar} w-28`} /></td>
    <td className="py-3 pr-4"><div className={`${skeletonBar} w-24`} /></td>
    <td className="py-3 pr-4"><div className={`${skeletonBar} w-36`} /></td>
    <td className="py-3 pr-4"><div className={`${skeletonBar} w-24`} /></td>
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
  tenants,
  navLinkTo,
  sort,
  isFetching,
}: TableProps): JSX.Element => (
  <div className="relative overflow-x-auto">
    {isFetching && <FetchProgress />}
    <table className="w-full min-w-[640px] table-fixed border-collapse text-left">
      <thead>
        <tr className="border-b border-gray-200 text-sm">
          <SortHeader className="w-[20%]" column="last_name" label="Nazwisko" sort={sort} />
          <SortHeader className="w-[18%]" column="first_name" label="Imię" sort={sort} />
          <SortHeader className="w-[26%]" column="email" label="Email" sort={sort} />
          <th className="w-[18%] py-3 pr-4 font-medium text-gray-500">Telefon</th>
          <SortHeader className="w-[18%]" column="tenant_status" label="Status" sort={sort} />
        </tr>
      </thead>
      <tbody>
        {tenants.length === 0 ?
          <tr>
            <td colSpan={5} className="py-8 text-center text-gray-500">
              Brak najemców.
            </td>
          </tr> :
          tenants.map((t) => (
            <tr
              key={t.id}
              className="cursor-pointer border-b border-gray-100 text-sm hover:bg-blue-50"
            >
              <td className="py-3 pr-4 font-medium text-gray-900 [&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline">
                {navLinkTo.tenant({ id: t.id, style: {}, content: t.last_name })}
              </td>
              <td className="py-3 pr-4 text-gray-600">{t.first_name}</td>
              <td className="py-3 pr-4 text-gray-600">{t.email}</td>
              <td className="py-3 pr-4 text-gray-600">{t.phone}</td>
              <td className="py-3 pr-4 text-gray-600">{STATUS_LABEL[t.tenant_status]}</td>
            </tr>
          ))}
      </tbody>
    </table>
  </div>
);

export const TenantsS = ({ asyncData, navLinkTo, sort }: TenantsSProps): JSX.Element => (
  <div className="min-h-[300px]">
    {match(asyncData)
      .with({ tag: 'pending' }, () => <SkeletonTable />)
      .with({ tag: 'rejected' }, ({ message, onRetry }) => (
        <ErrorMessage message={message} onRetry={onRetry} />
      ))
      .with({ tag: 'fulfilled' }, ({ data, isFetching }) => (
        <TableView tenants={data} navLinkTo={navLinkTo} sort={sort} isFetching={isFetching ?? false} />
      ))
      .exhaustive()}
  </div>
);