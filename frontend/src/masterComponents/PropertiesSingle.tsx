import { useCallback } from 'react';
import { useAsync } from 'react-use';
import { useParams } from 'react-router-dom';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';

type PropertyRow = Database['public']['Tables']['properties']['Row'];
type PropertyInsert = Database['public']['Tables']['properties']['Insert'];
type PropertyInput = Readonly<Omit<PropertyInsert, 'created_at' | 'updated_at' | 'created_by'>>;

type FormProps = {
  readonly initial?: PropertyRow;
  readonly onSave: (data: PropertyInput) => Promise<Readonly<{ error?: string }>>;
};

type Props = {
  readonly FormFieldsComponent: ComponentType<FormProps>;
  readonly LoadingComponent: JSX.Element;
  readonly ErrorComponent: JSX.Element;
};

export const PropertiesSingle = ({
  FormFieldsComponent,
  LoadingComponent,
  ErrorComponent,
}: Props): JSX.Element => {
  const { id } = useParams<{ readonly id: string }>();

  const { loading, error, value } = useAsync(async (): Promise<PropertyRow | null> => {
    const shouldFetch = id !== undefined && id !== 'new';
    const result: PropertyRow | null =
      shouldFetch ?
        await (async (): Promise<PropertyRow> => {
          const { data, error: dbError } = await backendConnector
            .from('properties')
            .select('*')
            .eq('id', id)
            .single();
          return dbError !== null ? Promise.reject(dbError) : data;
        })() :
        null;
    return result;
  }, [id]);

  const handleSave = useCallback(
    async (data: PropertyInput): Promise<Readonly<{ error?: string }>> => {
      const shouldUpdate = id !== undefined && id !== 'new';
      const result =
        shouldUpdate ?
          await backendConnector.from('properties').update(data).eq('id', id).select().single() :
          await backendConnector.from('properties').insert(data).select().single();

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