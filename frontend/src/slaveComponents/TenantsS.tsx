import { match } from 'ts-pattern';
import type { TenantsSProps } from '@/masterComponents/TenantsM';
import { LoadingSpinner } from './LoadingSpinnerS';
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
};

const SortHeader = ({
  column,
  label,
  sort,
  align = 'left',
}: SortHeaderProps): JSX.Element => {
  const isActive = sort.config.column === column;
  const isAsc = isActive && sort.config.direction === 'asc';
  const isDesc = isActive && sort.config.direction === 'desc';
  const alignClass = align === 'right' ? 'text-right' : 'text-left';
  return (
    <th
      className={`cursor-pointer select-none py-3 pr-4 font-medium ${alignClass}`}
      onClick={() => sort.doSort(column)}
    >
      <span className="text-gray-500">{label}</span>
      <span className="ml-1 inline-block w-3 text-xs text-gray-400">
        {isAsc ? '▲' : isDesc ? '▼' : '△'}
      </span>
    </th>
  );
};

type TableBodyProps = {
  readonly tenants: readonly Row[];
  readonly navLinkTo: NavLinkTo;
  readonly sort: Sort;
};

const TableBody = ({
  tenants,
  navLinkTo,
  sort,
}: TableBodyProps): JSX.Element =>
  tenants.length === 0 ?
    <p className="py-8 text-center text-gray-500">Brak najemców.</p> :
    (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-200 text-sm">
              <SortHeader column="last_name" label="Nazwisko" sort={sort} />
              <SortHeader column="first_name" label="Imię" sort={sort} />
              <SortHeader column="email" label="Email" sort={sort} />
              <th className="py-3 pr-4 font-medium text-gray-500">Telefon</th>
              <SortHeader column="tenant_status" label="Status" sort={sort} />
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => (
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
      .with({ tag: 'pending' }, () => <LoadingSpinner />)
      .with({ tag: 'rejected' }, ({ message, onRetry }) => (
        <ErrorMessage message={message} onRetry={onRetry} />
      ))
      .with({ tag: 'fulfilled' }, ({ data }) => (
        <TableBody
          tenants={data}
          navLinkTo={navLinkTo}
          sort={sort}
        />
      ))
      .exhaustive()}
  </div>
);