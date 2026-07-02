import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAsync, useAsyncFn } from 'react-use';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import type { SlaveAsyncProps } from '@/generic';

type TenantRow = Database['public']['Tables']['tenants']['Row'];
type TenantInsert = Database['public']['Tables']['tenants']['Insert'];
export type TenantStatus = Database['public']['Enums']['tenant_status'];
export type TenantInput = Readonly<Omit<TenantInsert, 'created_at' | 'updated_at'>>;

export const emptyTenantInput: TenantInput = Object.freeze({
  user_id: null,
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  id_document_number: null,
  emergency_contact_name: null,
  emergency_contact_phone: null,
  notes: null,
  tenant_status: 'active' as TenantStatus,
});

export const toTenantInput = (row: TenantRow): TenantInput => ({
  user_id: row.user_id,
  first_name: row.first_name,
  last_name: row.last_name,
  email: row.email,
  phone: row.phone,
  id_document_number: row.id_document_number,
  emergency_contact_name: row.emergency_contact_name,
  emergency_contact_phone: row.emergency_contact_phone,
  notes: row.notes,
  tenant_status: row.tenant_status,
});

export type FormProps = SlaveAsyncProps<TenantInput> & {
  readonly isEditing: boolean;
  readonly onSave: (data: TenantInput) => void;
  readonly onCancel: () => void;
};

type Props = {
  readonly FormFieldsComponent: ComponentType<FormProps>;
  readonly LoadingComponent: JSX.Element;
  readonly ErrorComponent: JSX.Element;
  readonly id: string | undefined;
};

export const TenantsSingle = ({
  FormFieldsComponent,
  LoadingComponent,
  ErrorComponent,
  id,
}: Props): JSX.Element => {
  const navigate = useNavigate();

  const isEditing = id !== undefined && id !== 'new';

  const { loading: fetchLoading, error: fetchError, value: fetchedRow } = useAsync(
    async (): Promise<TenantRow | null> => {
      const result: TenantRow | null =
        isEditing ?
          await (async (): Promise<TenantRow> => {
            const { data, error: dbError } = await backendConnector
              .from('tenants')
              .select('*')
              .eq('id', id)
              .single();
            return dbError !== null ? Promise.reject(dbError) : data;
          })() :
          null;
      return result;
    },
    [id, isEditing],
  );

  const [saveState, save] = useAsyncFn(
    async (data: TenantInput) => {
      const result =
        isEditing ?
          await backendConnector.from('tenants').update(data).eq('id', id).select().single() :
          await backendConnector.from('tenants').insert(data).select().single();
      return result.error !== null ? Promise.reject(result.error) : undefined;
    },
    [id, isEditing],
  );

  const handleSave = useCallback(
    (data: TenantInput) => {
      save(data).then(() => {
        navigate(-1);
      });
    },
    [save, navigate],
  );

  const handleCancel = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  return fetchLoading ?
    LoadingComponent :
    fetchError !== undefined ?
      ErrorComponent :
      (
        <FormFieldsComponent
          data={fetchedRow !== null && fetchedRow !== undefined ? toTenantInput(fetchedRow) : emptyTenantInput}
          isEditing={isEditing}
          onSave={handleSave}
          isLoading={saveState.loading}
          error={saveState.error?.message ?? null}
          onCancel={handleCancel}
        />
      );
};
