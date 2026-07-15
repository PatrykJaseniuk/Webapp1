import { match } from 'ts-pattern';
import type { TenantsSProps } from '@/masterComponents/TenantsM';
import { LoadingSpinner } from './LoadingSpinnerS';
import { ErrorMessage } from './ErrorMessageS';

type Row = Extract<TenantsSProps['dataMode'], { tag: 'fulfilled' }>['data'][number];
type TenantStatus = Row['tenantStatus'];

export const STATUS_LABEL: Readonly<Record<TenantStatus, string>> = Object.freeze({
  active: 'Aktywny',
  past: 'Były',
  applicant: 'Kandydat',
});

type Props = {
  readonly dataMode: TenantsSProps['dataMode'];
  readonly getPropertyUrl: (propertyId: string) => string;
};

const TableBody = ({
  tenants,
  getPropertyUrl,
}: {
  readonly tenants: readonly Row[];
  readonly getPropertyUrl: (propertyId: string) => string;
}): JSX.Element =>
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
            {tenants.map((t) => (
              <tr key={t.id} className="border-b border-gray-100 text-sm">
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
                          <a
                            key={propId || idx}
                            href={getPropertyUrl(propId)}
                            className="inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                          >
                            {propName}
                          </a>
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

export const TenantsS = ({ dataMode, getPropertyUrl }: Props): JSX.Element => (
  <div className="min-h-[300px]">
    {match(dataMode)
      .with({ tag: 'pending' }, () => <LoadingSpinner />)
      .with({ tag: 'rejected' }, ({ message, onRetry }) => (
        <ErrorMessage message={message} onRetry={onRetry} />
      ))
      .with({ tag: 'fulfilled' }, ({ data }) => (
        <TableBody tenants={data} getPropertyUrl={getPropertyUrl} />
      ))
      .exhaustive()}
  </div>
);