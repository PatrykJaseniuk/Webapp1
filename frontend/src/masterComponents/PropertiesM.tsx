import { useCallback } from 'react';
import { useAsync } from 'react-use';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import { useUrls } from '@/hooks/useUrls';
import type { Database } from '@/backendConnector';
import type { AsyncData as DataFetchMode } from '@/generic';

type PropertyOccupancyRow = Database['public']['Views']['property_occupancy']['Row']

export type PropertiesSProps = {
  readonly asyncData: DataFetchMode<readonly PropertyOccupancyRow[]>;
  readonly getDetailUrl: (id: string) => string;
  readonly getTenantUrl: (tenantId: string) => string;
};

type Props = {
  readonly Slave: ComponentType<PropertiesSProps>;
};

export const PropertiesM = ({
  Slave,
}: Props): JSX.Element => {
  const { url } = useUrls();

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

  const asyncData: DataFetchMode<readonly PropertyOccupancyRow[]> =
    loading ?
      { tag: 'pending' } :
      error ?
        { tag: 'rejected', message: error.message, onRetry: handleRetry } :
        { tag: 'fulfilled', data };

  return (
    <Slave
      asyncData={asyncData}
      getDetailUrl={url.propertyDetail}
      getTenantUrl={url.tenantDetail}
    />
  );
};