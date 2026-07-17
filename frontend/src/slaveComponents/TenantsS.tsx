import { Link, useNavigate } from 'react-router-dom';
import { match } from 'ts-pattern';
import type { TenantsSProps } from '@/masterComponents/TenantsM';
import { LoadingSpinner } from './LoadingSpinnerS';
import { ErrorMessage } from './ErrorMessageS';

type Row = Extract<TenantsSProps['asyncData'], { tag: 'fulfilled' }>['data'][number];
type TenantStatus = Row['tenantStatus'];

export const STATUS_LABEL: Readonly<Record<TenantStatus, string>> = Object.freeze({
  active: 'Aktywny',
  past: 'Były',
  applicant: 'Kandydat',
});

type TableBodyProps = {
  readonly tenants: readonly Row[];
  readonly getDetailUrl: (id: string) => string;
  readonly getPropertyUrl: (propertyId: string) => string;
};

const TableBody = ({
  tenants,
  getDetailUrl,
  getPropertyUrl,
}: TableBodyProps): JSX.Element => {
  const navigate = useNavigate();
  return tenants.length === 0 ?
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
            {tenants.map((t) => (
              <tr
                key={t.id}
                className="cursor-pointer border-b border-gray-100 text-sm hover:bg-blue-50"
                onClick={() => { navigate(getDetailUrl(t.id)); }}
              >
                <td className="py-3 pr-4 font-medium text-gray-900">{t.lastName}</td>
                <td className="py-3 pr-4 text-gray-600">{t.firstName}</td>
                <td className="py-3 pr-4 text-gray-600">{t.email}</td>
                <td className="py-3 pr-4 text-gray-600">{t.phone}</td>
                <td className="py-3 pr-4 text-gray-600">
                  {t.currentPropertyIds.length > 0 ?
                    <div className="flex flex-wrap gap-1">
                      {t.currentPropertyNames.split(', ').map((propName: string, idx: number) => {
                        const propId = t.currentPropertyIds[idx] ?? '';
                        return (
                          <Link
                            key={propId || idx}
                            to={getPropertyUrl(propId)}
                            onClick={(e) => { e.stopPropagation(); }}
                            className="inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                          >
                            {propName}
                          </Link>
                        );
                      })}
                    </div> :
                    <span className="text-gray-400">—</span>}
                </td>
                <td className="py-3 pr-4 text-gray-600">{STATUS_LABEL[t.tenantStatus]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
};

export const TenantsS = ({ asyncData, getDetailUrl, getPropertyUrl }: TenantsSProps): JSX.Element => (
  <div className="min-h-[300px]">
    {match(asyncData)
      .with({ tag: 'pending' }, () => <LoadingSpinner />)
      .with({ tag: 'rejected' }, ({ message, onRetry }) => (
        <ErrorMessage message={message} onRetry={onRetry} />
      ))
      .with({ tag: 'fulfilled' }, ({ data }) => (
        <TableBody
          tenants={data}
          getDetailUrl={getDetailUrl}
          getPropertyUrl={getPropertyUrl}
        />
      ))
      .exhaustive()}
  </div>
);