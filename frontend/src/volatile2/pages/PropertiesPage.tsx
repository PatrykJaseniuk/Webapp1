import { useState } from 'react';
import { useAsync, useAsyncFn } from 'react-use';
import { backendConnector } from '@/backend/backendConnector';
import type { Tables, TablesInsert } from '@/backend';
import { PropertiesList } from '@/features/properties/PropertiesList';
import { PropertyForm } from '@/features/properties/PropertyForm';

export const PropertiesPage = (): JSX.Element => {
  const [editingProperty, setEditingProperty] = useState<Tables<'properties'> | undefined>(undefined);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [refetchKey, setRefetchKey] = useState(0);

  const propertiesState = useAsync(
    async () =>
      backendConnector
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false }),
    [refetchKey],
  );

  const [, saveProperty] = useAsyncFn(
    async (input: TablesInsert<'properties'>) =>
      backendConnector.from('properties').insert(input).select().single(),
  );

  const [, updateProperty] = useAsyncFn(
    async ({
      id,
      patch,
    }: {
      readonly id: string;
      readonly patch: TablesInsert<'properties'>;
    }) =>
      backendConnector
        .from('properties')
        .update(patch)
        .eq('id', id)
        .select()
        .single(),
  );

  const [, deletePropertyFn] = useAsyncFn(
    async (id: string) =>
      backendConnector.from('properties').delete().eq('id', id),
  );

  const triggerRefetch = (): void => {
    setRefetchKey((k) => k + 1);
  };

  const handleCreate = (input: TablesInsert<'properties'>): Promise<void> =>
    saveProperty(input).then((result) =>
      result.error !== null
        ? Promise.reject(result.error)
        : (setShowCreateForm(false), triggerRefetch(), undefined),
    );

  const handleEdit = (property: Tables<'properties'>): void => {
    setShowCreateForm(false);
    setEditingProperty(property);
  };

  const handleUpdate = (input: TablesInsert<'properties'>): Promise<void> => {
    const id = editingProperty?.id;
    return id === undefined
      ? Promise.resolve()
      : updateProperty({ id, patch: input }).then((result) =>
          result.error !== null
            ? Promise.reject(result.error)
            : (setEditingProperty(undefined), triggerRefetch(), undefined),
        );
  };

  const handleDelete = (id: string): void => {
    deletePropertyFn(id).then((result) =>
      result.error === null ? triggerRefetch() : undefined,
    );
  };

  const isLoading = propertiesState.loading;
  const isError = !propertiesState.loading && propertiesState.error !== undefined;
  const properties: readonly Tables<'properties'>[] =
    !propertiesState.loading &&
    propertiesState.value !== undefined &&
    propertiesState.value.data !== null
      ? (propertiesState.value.data as readonly Tables<'properties'>[])
      : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Nieruchomości</h1>
        {!showCreateForm && editingProperty === undefined && (
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
        <PropertiesList
          properties={properties}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {showCreateForm && (
        <PropertyForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {editingProperty !== undefined && (
        <PropertyForm
          property={editingProperty}
          onSubmit={handleUpdate}
          onCancel={() => setEditingProperty(undefined)}
        />
      )}
    </div>
  );
};