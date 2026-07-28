import { match } from 'ts-pattern';
import type { TenantsSProps } from '@/masterComponents/TenantsM';
import { LoadingSpinner } from './LoadingSpinnerS';
import { ErrorMessage } from './ErrorMessageS';

type Row = Extract<TenantsSProps['asyncData'], { tag: 'fulfilled' }>['data'][number];
type NavLinkTo = TenantsSProps['navLinkTo'];
type TenantStatus = Row['tenant_status'];

export const STATUS_LABEL: Readonly<Record<TenantStatus, string>> = Object.freeze({
  active: 'Aktywny',
  past: 'Były',
  applicant: 'Kandydat',
});

const activePropertyLinks = (row: Row, navLinkTo: NavLinkTo): readonly JSX.Element[] => {
  const activeLeases = (row.lease_agreements ?? []).filter((la) => la.lease_status === 'active');
  return activeLeases
    .filter((la) => la.properties !== null && la.properties.name !== null)
    .map((la) => {
      const propName = la.properties?.name ?? '';
      return (
        <span
          key={la.property_id}
          className="inline-block [&_a]:rounded-full [&_a]:bg-blue-50 [&_a]:px-2 [&_a]:py-0.5 [&_a]:text-xs [&_a]:font-medium [&_a]:text-blue-700 hover:[&_a]:bg-blue-100"
        >
          {navLinkTo.property({ id: la.property_id, style: {}, content: propName })}
        </span>
      );
    });
};

type TableBodyProps = {
  readonly tenants: readonly Row[];
  readonly navLinkTo: NavLinkTo;
};

const TableBody = ({
  tenants,
  navLinkTo,
}: TableBodyProps): JSX.Element =>
  tenants.length === 0 ?
    <p className="py-8 text-center text-gray-500">Brak najemców.</p> :
    (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-200 text-sm text-gray-500">
              <th className="py-3 pr-4 font-medium">Nazwisko</th>
              <th className="py-3 pr-4 font-medium">Imię</th>
              <th className="py-3 pr-4 font-medium">Email</th>
              <th className="py-3 pr-4 font-medium">Telefon</th>
              <th className="py-3 pr-4 font-medium">Nieruchomości</th>
              <th className="py-3 pr-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => {
              const propLinks = activePropertyLinks(t, navLinkTo);
              return (
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
                  <td className="py-3 pr-4 text-gray-600">
                    {propLinks.length > 0 ?
                      <div className="flex flex-wrap gap-1">{propLinks}</div> :
                      <span className="text-gray-400">—</span>}
                  </td>
                  <td className="py-3 pr-4 text-gray-600">{STATUS_LABEL[t.tenant_status]}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );

export const TenantsS = ({ asyncData, navLinkTo }: TenantsSProps): JSX.Element => (
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
        />
      ))
      .exhaustive()}
  </div>
);