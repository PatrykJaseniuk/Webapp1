import { useState } from 'react';
import {
  usePropertiesQuery,
  useSavePropertyMutation,
  useUpdatePropertyMutation,
  useDeletePropertyMutation,
} from '@/backendConnectorWrapers';
import type { Property, PropertyInsert } from '@/domain';
import { PropertiesList } from '@/features/properties/PropertiesList';
import { PropertyForm } from '@/features/properties/PropertyForm';

export const PropertiesPage = (): JSX.Element => {
  const [editingProperty, setEditingProperty] = useState<Property | undefined>(undefined);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const query = usePropertiesQuery();
  const saveMutation = useSavePropertyMutation();
  const updateMutation = useUpdatePropertyMutation();
  const deleteMutation = useDeletePropertyMutation();

  const handleCreate = (input: PropertyInsert): Promise<void> =>
    saveMutation.mutateAsync(input).then(() => setShowCreateForm(false));

  const handleEdit = (property: Property): void => {
    setShowCreateForm(false);
    setEditingProperty(property);
  };

  const handleUpdate = (input: PropertyInsert): Promise<void> => {
    const id = editingProperty?.id;
    return id === undefined
      ? Promise.resolve()
      : updateMutation
        .mutateAsync({ id, patch: input })
        .then(() => setEditingProperty(undefined));
  };

  const handleDelete = (id: string): void => {
    deleteMutation.mutate(id);
  };

  const properties: readonly Property[] = query.data ?? [];

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

      {query.isLoading && <p className="text-gray-500">Ładowanie...</p>}

      {query.isError && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          Błąd ładowania danych
        </div>
      )}

      {query.isSuccess && (
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