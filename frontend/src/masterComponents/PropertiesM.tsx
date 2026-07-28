import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import { toAsyncData, type AsyncData } from '@/generic';
import type { NavLinkWithId } from '@/generic/utils';

type PropertyOccupancyRow = Database['public']['Views']['property_occupancy']['Row'];

type NavLinkTo = Readonly<{
  readonly property: NavLinkWithId;
  readonly tenant: NavLinkWithId;
}>;

export type PropertiesSProps = {
  readonly asyncData: AsyncData<readonly PropertyOccupancyRow[]>;
  readonly navLinkTo: NavLinkTo;
};

type Props = {
  readonly Slave: ComponentType<PropertiesSProps>;
};

export const PropertiesM = ({
  Slave,
}: Props): JSX.Element => {
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

  const asyncData = toAsyncData(query, () => { void query.refetch(); });

  const navLinkTo: NavLinkTo = {
    property: ({ id, content, style }) => <Link to="/app/properties/$id" params={{ id }} style={style}>{content}</Link>,
    tenant: ({ id, content, style }) => <Link to="/app/tenants/$id" params={{ id }} style={style}>{content}</Link>,
  };

  return <Slave asyncData={asyncData} navLinkTo={navLinkTo} />;
};