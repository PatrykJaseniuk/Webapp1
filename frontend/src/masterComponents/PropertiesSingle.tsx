import { useCallback } from 'react';
import { useAsync, useAsyncFn } from 'react-use';
import { useNavigate } from 'react-router-dom';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import type { SlaveAsyncProps, SlaveDataState } from '@/generic';

type PropertyRow = Database['public']['Tables']['properties']['Row'];
type PropertyInsert = Database['public']['Tables']['properties']['Insert'];

export type PropertyInput = Readonly<Omit<PropertyInsert, 'created_at' | 'updated_at' | 'created_by'>>;

export const emptyInput: PropertyInput = Object.freeze({
  name: '',
  address: '',
  property_type: 'apartment' as PropertyRow['property_type'],
  property_status: 'available' as PropertyRow['property_status'],
  monthly_rent: 0,
  deposit_amount: 0,
  size_sqm: null,
  bedrooms: null,
  notes: null,
});

export type FormProps = SlaveAsyncProps<PropertyInput> & {
  readonly fetchState: SlaveDataState<PropertyInput>;
  readonly isEditing: boolean;
  readonly onSubmit: (data: PropertyInput) => void;
  readonly onCancel: () => void;
};

type Props = {
  readonly FormFieldsComponent: ComponentType<FormProps>;
  readonly id: string | undefined;
};

export const PropertiesSingle = ({
  FormFieldsComponent,
  id,
}: Props): JSX.Element => {
  const navigate = useNavigate();

  const isEditing = id !== undefined && id !== 'new';

  const { loading: fetchLoading, error: fetchError, value: fetchedRow } = useAsync(
    async (): Promise<PropertyRow | null> => {
      const result: PropertyRow | null =
        isEditing ?
          await backendConnector
            .from('properties')
            .select('*')
            .eq('id', id)
            .single()
            .then(({ data, error: dbError }) =>
              dbError !== null ? Promise.reject(dbError) : data,
            ) :
          null;
      return result;
    },
    [id, isEditing],
  );

  const [saveState, save] = useAsyncFn(
    async (data: PropertyInput) => {
      const result =
        isEditing ?
          await backendConnector.from('properties').update(data).eq('id', id).select().single() :
          await backendConnector.from('properties').insert(data).select().single();
      return result.error !== null ? Promise.reject(result.error) : undefined;
    },
    [id, isEditing],
  );

  const handleSubmit = useCallback(
    (data: PropertyInput) => {
      save(data).then(() => {
        navigate(-1);
      });
    },
    [save, navigate],
  );

  const handleCancel = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleRetry = useCallback((): void => {
    navigate(0);
  }, [navigate]);

  const fetchState: SlaveDataState<PropertyInput> =
    fetchLoading ?
      { tag: 'pending' } :
      fetchError !== undefined ?
        { tag: 'rejected', message: fetchError.message, onRetry: handleRetry } :
        { tag: 'fulfilled', data: fetchedRow ?? emptyInput };

  return (
    <FormFieldsComponent
      fetchState={fetchState}
      data={fetchedRow ?? emptyInput}
      isEditing={isEditing}
      onSubmit={handleSubmit}
      isLoading={saveState.loading}
      error={saveState.error?.message ?? null}
      onCancel={handleCancel}
    />
  );
};
