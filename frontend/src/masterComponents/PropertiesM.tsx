import { match } from 'ts-pattern';
import { useQuery } from '@tanstack/react-query';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import { useUrls } from '@/hooks/useUrls';
import type { Database } from '@/backendConnector';
import { toAsyncData, type AsyncData as DataFetchMode } from '@/generic';

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
  const urls = useUrls();

  const query = useQuery({
    queryKey: ['properties'],
    queryFn: async (): Promise<readonly PropertyOccupancyRow[]> => {
      const r = await backendConnector
        .from('property_occupancy')
        .select('*')
        .order('name');
      if (r.error !== null) throw r.error;
      return r.data ?? [];
    },
  });

  const asyncData = toAsyncData(query, () => { query.refetch(); });

  return match(urls)
    .with({ tag: 'pending' }, () => (
      <Slave
        asyncData={{ tag: 'pending' }}
        getDetailUrl={() => ''}
        getTenantUrl={() => ''}
      />
    ))
    .with({ tag: 'ready' }, ({ url }) => (
      <Slave
        asyncData={asyncData}
        getDetailUrl={url.propertyDetail}
        getTenantUrl={url.tenantDetail}
      />
    ))
    .exhaustive();
};