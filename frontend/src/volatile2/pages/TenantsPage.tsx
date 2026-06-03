import { useState } from 'react';
import { useAsync, useAsyncFn } from 'react-use';
import { backendConnector } from '@/backend/backendConnector';
import type { Tables, TablesInsert } from '@/backend';
import { TenantsList } from '@/features/tenants/TenantsList';
import { TenantForm } from '@/features/tenants/TenantForm';

export const TenantsPage = (): JSX.Element => {
  const [editingTenant, setEditingTenant] = useState<Tables<'tenants'> | undefined>(undefined);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [refetchKey, setRefetchKey] = useState(0);

  const tenantsState = useAsync(
    async () =>
      backendConnector
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false }),
    [refetchKey],
  );

  const [, saveTenant] = useAsyncFn(
    async (input: TablesInsert<'tenants'>) =>
      backendConnector.from('tenants').insert(input).select().single(),
  );

  const [, updateTenant] = useAsyncFn(
    async ({
      id,
      patch,
    }: {
      readonly id: string;
      readonly patch: TablesInsert<'tenants'>;
    }) =>
      backendConnector
        .from('tenants')
        .update(patch)
        .eq('id', id)
        .select()
        .single(),
  );

  const [, deleteTenantFn] = useAsyncFn(
    async (id: string) =>
      backendConnector.from('tenants').delete().eq('id', id),
  );

  const triggerRefetch = (): void => {
    setRefetchKey((k) => k + 1);
  };

  const handleCreate = (input: TablesInsert<'tenants'>): Promise<void> =>
    saveTenant(input).then((result) =>
      result.error !== null
        ? Promise.reject(result.error)
        : (setShowCreateForm(false), triggerRefetch(), undefined),
    );

  const handleEdit = (tenant: Tables<'tenants'>): void => {
    setShowCreateForm(false);
    setEditingTenant(tenant);
  };

  const handleUpdate = (input: TablesInsert<'tenants'>): Promise<void> => {
    const id = editingTenant?.id;
    return id === undefined
      ? Promise.resolve()
      : updateTenant({ id, patch: input }).then((result) =>
          result.error !== null
            ? Promise.reject(result.error)
            : (setEditingTenant(undefined), triggerRefetch(), undefined),
        );
  };

  const handleDelete = (id: string): void => {
    deleteTenantFn(id).then((result) =>
      result.error === null ? triggerRefetch() : undefined,
    );
  };

  const isLoading = tenantsState.loading;
  const isError = !tenantsState.loading && tenantsState.error !== undefined;
  const tenants: readonly Tables<'tenants'>[] =
    !tenantsState.loading &&
    tenantsState.value !== undefined &&
    tenantsState.value.data !== null
      ? (tenantsState.value.data as readonly Tables<'tenants'>[])
      : [];

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

      {isLoading && <p className="text-gray-500">Ładowanie...</p>}

      {isError && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          Błąd ładowania danych
        </div>
      )}

      {isError || isLoading || (
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