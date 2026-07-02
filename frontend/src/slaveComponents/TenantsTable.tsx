import { match } from 'ts-pattern';
import type { TenantRow } from '@/masterComponents/TenantsMany';
import type { SlaveDataState } from '@/generic';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

type StatusLabelMap = Readonly<Record<TenantRow['tenant_status'], string>>;

export const STATUS_LABEL: StatusLabelMap = Object.freeze({
  active: 'Aktywny',
  past: 'Były',
  applicant: 'Kandydat',
});

type Props = {
  readonly state: SlaveDataState<readonly TenantRow[]>;
  readonly onDelete: (id: string) => void;
  readonly getEditUrl: (id: string) => string;
};

const TableBody = ({ tenants, onDelete, getEditUrl }: { readonly tenants: readonly TenantRow[]; readonly onDelete: (id: string) => void; readonly getEditUrl: (id: string) => string }): JSX.Element =>
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
              <th className="py-3 pr-4 font-medium">Status</th>
              <th className="py-3 text-right font-medium">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t: TenantRow) => (
              <tr key={t.id} className="border-b border-gray-100 text-sm">
                <td className="py-3 pr-4 font-medium text-gray-900">{t.last_name}</td>
                <td className="py-3 pr-4 text-gray-600">{t.first_name}</td>
                <td className="py-3 pr-4 text-gray-600">{t.email}</td>
                <td className="py-3 pr-4 text-gray-600">{t.phone}</td>
                <td className="py-3 pr-4 text-gray-600">{STATUS_LABEL[t.tenant_status]}</td>
                <td className="py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <a
                      href={getEditUrl(t.id)}
                      className="rounded px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                    >
                      Edytuj
                    </a>
                    <button
                      type="button"
                      onClick={() => { onDelete(t.id); }}
                      className="rounded px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Usuń
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

export const TenantsTable = ({ state, onDelete, getEditUrl }: Props): JSX.Element =>
  match(state)
    .with({ tag: 'pending' }, () => <LoadingSpinner />)
    .with({ tag: 'rejected' }, ({ message, onRetry }) => (
      <ErrorMessage message={message} onRetry={onRetry} />
    ))
    .with({ tag: 'fulfilled' }, ({ data }) => (
      <TableBody tenants={data} onDelete={onDelete} getEditUrl={getEditUrl} />
    ))
    .exhaustive();
