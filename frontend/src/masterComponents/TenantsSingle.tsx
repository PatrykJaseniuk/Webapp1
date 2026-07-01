import { useCallback } from 'react';
import { useAsync } from 'react-use';
import { useParams } from 'react-router-dom';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';

type TenantRow = Database['public']['Tables']['tenants']['Row'];
type TenantInsert = Database['public']['Tables']['tenants']['Insert'];
type TenantInput = Readonly<Omit<TenantInsert, 'created_at' | 'updated_at'>>;

type FormProps = {
  readonly initial?: TenantRow;
  readonly onSave: (data: TenantInput) => Promise<Readonly<{ error?: string }>>;
};

type Props = {
  readonly FormFieldsComponent: ComponentType<FormProps>;
  readonly LoadingComponent: JSX.Element;
  readonly ErrorComponent: JSX.Element;
};

export const TenantsSingle = ({
  FormFieldsComponent,
  LoadingComponent,
  ErrorComponent,
}: Props): JSX.Element => {
  const { id } = useParams<{ readonly id: string }>();

  const { loading, error, value } = useAsync(async (): Promise<TenantRow | null> => {
    const shouldFetch = id !== undefined && id !== 'new';
    const result: TenantRow | null =
      shouldFetch ?
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
  }, [id]);

  const handleSave = useCallback(
    async (data: TenantInput): Promise<Readonly<{ error?: string }>> => {
      const shouldUpdate = id !== undefined && id !== 'new';
      const result =
        shouldUpdate ?
          await backendConnector.from('tenants').update(data).eq('id', id).select().single() :
          await backendConnector.from('tenants').insert(data).select().single();

      const msg: Readonly<{ error?: string }> =
        result.error !== null ?
          { error: result.error.message } :
          {};
      return msg;
    },
    [id],
  );

  return loading ?
    LoadingComponent :
    error !== undefined ?
      ErrorComponent :
      (
        <FormFieldsComponent
          initial={value ?? undefined}
          onSave={handleSave}
        />
      );
};