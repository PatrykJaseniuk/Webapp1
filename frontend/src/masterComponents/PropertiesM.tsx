import { useCallback } from 'react';
import { useAsync } from 'react-use';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import type { DataMode as DataFetchMode } from '@/generic';

type PropertyOccupancyRow = Database['public']['Views']['property_occupancy']['Row']

type Url = {
  readonly getDetailUrl: (id: string) => string;
  readonly getTenantUrl: (tenantId: string) => string;
};

export type PropertiesSProps = {
  readonly dataMode: DataFetchMode<readonly PropertyOccupancyRow[]>;
} & Url;

type Props = {
  readonly Slave: ComponentType<PropertiesSProps>;
} & Url;

export const PropertiesM = ({
  Slave,
  getDetailUrl,
  getTenantUrl,
}: Props): JSX.Element => {
  const { loading, error: FetchError, value } = useAsync(async () =>
    await backendConnector
      .from('property_occupancy')
      .select('*')
      .order('name')
    , []);

  const error = FetchError ?? value?.error
  const data = value?.data ?? []

  const handleRetry = useCallback((): void => {
    window.location.reload();
  }, []);

  const dataMode: DataFetchMode<readonly PropertyOccupancyRow[]> =
    loading ?
      { tag: 'pending' } :
      error ?
        { tag: 'rejected', message: error.message, onRetry: handleRetry } :
        { tag: 'fulfilled', data };

  return (
    <Slave
      dataMode={dataMode}
      getDetailUrl={getDetailUrl}
      getTenantUrl={getTenantUrl}
    />
  );
};