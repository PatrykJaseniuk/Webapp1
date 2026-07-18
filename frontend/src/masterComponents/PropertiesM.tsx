import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from '@tanstack/react-router';
import type { ComponentType, ReactNode } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import { toAsyncData, type AsyncData as DataFetchMode } from '@/generic';

type PropertyOccupancyRow = Database['public']['Views']['property_occupancy']['Row']

export type PropertiesSProps = {
  readonly asyncData: DataFetchMode<readonly PropertyOccupancyRow[]>;
  readonly onDetailClick: (id: string) => void;
  readonly renderTenantLink: (tenantId: string) => ReactNode;
};

type Props = {
  readonly Slave: ComponentType<PropertiesSProps>;
};

export const PropertiesM = ({
  Slave,
}: Props): JSX.Element => {
  const navigate = useNavigate();

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

  const onDetailClick = (id: string): void => {
    navigate({ to: '/app/properties/$id', params: { id } });
  };

  const renderTenantLink = (tenantId: string): ReactNode =>
    <Link to="/app/tenants/$id" params={{ id: tenantId }} className="text-blue-600 hover:text-blue-800 hover:underline" />;

  return <Slave asyncData={asyncData} onDetailClick={onDetailClick} renderTenantLink={renderTenantLink} />;
};
