import { useState } from 'react';
import {
  useTenantsQuery,
  useSaveTenantMutation,
  useUpdateTenantMutation,
  useDeleteTenantMutation,
} from '@/backendConnectorWrapers';
import type { Tenant, TenantInsert } from '@/domain';
import { TenantsList } from '@/features/tenants/TenantsList';
import { TenantForm } from '@/features/tenants/TenantForm';

export const TenantsPage = (): JSX.Element => {
  const [editingTenant, setEditingTenant] = useState<Tenant | undefined>(undefined);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const query = useTenantsQuery();
  const saveMutation = useSaveTenantMutation();
  const updateMutation = useUpdateTenantMutation();
  const deleteMutation = useDeleteTenantMutation();

  const handleCreate = (input: TenantInsert): Promise<void> =>
    saveMutation.mutateAsync(input).then(() => setShowCreateForm(false));

  const handleEdit = (tenant: Tenant): void => {
    setShowCreateForm(false);
    setEditingTenant(tenant);
  };

  const handleUpdate = (input: TenantInsert): Promise<void> => {
    const id = editingTenant?.id;
    return id === undefined
      ? Promise.resolve()
      : updateMutation
        .mutateAsync({ id, patch: input })
        .then(() => setEditingTenant(undefined));
  };

  const handleDelete = (id: string): void => {
    deleteMutation.mutate(id);
  };

  const tenants: readonly Tenant[] = query.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Najemcy</h1>
        {!showCreateForm && editingTenant === undefined && (
          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Dodaj
          </button>
        )}
      </div>

      {query.isLoading && <p className="text-gray-500">Ładowanie...</p>}

      {query.isError && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          Błąd ładowania danych
        </div>
      )}

      {query.isSuccess && (
        <TenantsList
          tenants={tenants}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {showCreateForm && (
        <TenantForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {editingTenant !== undefined && (
        <TenantForm
          tenant={editingTenant}
          onSubmit={handleUpdate}
          onCancel={() => setEditingTenant(undefined)}
        />
      )}
    </div>
  );
};