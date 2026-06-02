import type { Tenant } from '@/domain';

type TenantsListProps = {
  readonly tenants: readonly Tenant[];
  readonly onEdit: (tenant: Tenant) => void;
  readonly onDelete: (id: string) => void;
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  past: 'bg-gray-100 text-gray-800',
};

const STATUS_DEFAULT = 'bg-yellow-100 text-yellow-800';

export const TenantsList = ({
  tenants,
  onEdit,
  onDelete,
}: TenantsListProps): JSX.Element => (
  <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
    <table className="min-w-full divide-y divide-gray-200 text-sm">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-4 py-3 text-left font-medium text-gray-600">Imię i nazwisko</th>
          <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
          <th className="px-4 py-3 text-left font-medium text-gray-600">Telefon</th>
          <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
          <th className="px-4 py-3 text-left font-medium text-gray-600">Nr dokumentu</th>
          <th className="px-4 py-3 text-center font-medium text-gray-600">Akcje</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {tenants.map((tenant) => (
          <tr key={tenant.id} className="hover:bg-gray-50">
            <td className="px-4 py-2.5 font-medium text-gray-900">
              {tenant.first_name} {tenant.last_name}
            </td>
            <td className="px-4 py-2.5 text-gray-600">{tenant.email}</td>
            <td className="px-4 py-2.5 text-gray-600">{tenant.phone}</td>
            <td className="px-4 py-2.5">
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[tenant.tenant_status] ?? STATUS_DEFAULT}`}
              >
                {tenant.tenant_status}
              </span>
            </td>
            <td className="px-4 py-2.5 text-gray-600">
              {tenant.id_document_number ?? '-'}
            </td>
            <td className="px-4 py-2.5 text-center">
              <button
                type="button"
                onClick={() => onEdit(tenant)}
                className="mr-2 rounded px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
              >
                Edytuj
              </button>
              <button
                type="button"
                onClick={() => onDelete(tenant.id)}
                className="rounded px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
              >
                Usuń
              </button>
            </td>
          </tr>
        ))}
        {tenants.length === 0 && (
          <tr>
            <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
              Brak najemców
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);