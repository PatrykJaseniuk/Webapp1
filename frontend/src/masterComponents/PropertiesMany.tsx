import { useCallback, useState } from 'react';
import { useAsync } from 'react-use';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';

type PropertyRow = Database['public']['Tables']['properties']['Row'];

type TableProps = {
  readonly properties: readonly PropertyRow[];
  readonly onDelete: (id: string) => void;
  readonly getEditUrl: (id: string) => string;
};

type Props = {
  readonly TableComponent: ComponentType<TableProps>;
  readonly LoadingComponent: JSX.Element;
  readonly ErrorComponent: ComponentType<{ readonly message: string; readonly onRetry: () => void }>;
  readonly getEditUrl: (id: string) => string;
};

export const PropertiesMany = ({
  TableComponent,
  LoadingComponent,
  ErrorComponent,
  getEditUrl,
}: Props): JSX.Element => {
  const [reloadKey, setReloadKey] = useState(0);

  const { loading, error, value } = useAsync(async (): Promise<readonly PropertyRow[]> => {
    const { data, error: dbError } = await backendConnector
      .from('properties')
      .select('*')
      .order('name');
    return dbError !== null ? data ?? [] : data;
  }, [reloadKey]);

  const handleDelete = useCallback(
    (id: string): void => {
      void backendConnector
        .from('properties')
        .delete()
        .eq('id', id)
        .then(() => {
          setReloadKey((k: number) => k + 1);
        });
    },
    [],
  );

  const handleRetry = useCallback((): void => {
    setReloadKey((k: number) => k + 1);
  }, []);

  return loading ?
    LoadingComponent :
    error !== undefined ?
      <ErrorComponent message={error.message} onRetry={handleRetry} /> :
      <TableComponent properties={value ?? []} onDelete={handleDelete} getEditUrl={getEditUrl} />;
};