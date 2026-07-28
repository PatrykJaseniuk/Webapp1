import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import { toAsyncData, type AsyncData } from '@/generic';
import { NavLinkWithId } from '@/generic/utils';

type TenantDbRow = Database['public']['Tables']['tenants']['Row'];

type TenantListRow = TenantDbRow & {
  readonly lease_agreements: ReadonlyArray<{
    readonly property_id: string;
    readonly lease_status: string;
    readonly properties: { readonly id: string; readonly name: string | null } | null;
  }> | null;
};

type NavLinkTo = Readonly<{
  readonly tenant: NavLinkWithId;
  readonly property: NavLinkWithId;
}>;

export type TenantsSProps = {
  readonly asyncData: AsyncData<readonly TenantListRow[]>;
  readonly navLinkTo: NavLinkTo;
};

type Props = {
  readonly Slave: ComponentType<TenantsSProps>;
};

export const TenantsM = ({
  Slave,
}: Props): JSX.Element => {
  const query = useQuery({
    queryKey: ['tenants'],
    queryFn: async (): Promise<readonly TenantListRow[]> => {
      const r = await backendConnector
        .from('tenants')
        .select('*, lease_agreements(property_id, lease_status, properties(id, name))')
        .order('last_name')
        .order('first_name');
      if (r.error !== null) throw r.error;
      return (r.data ?? []) as readonly TenantListRow[];
    },
  });

  const asyncData = toAsyncData(query, () => { query.refetch(); });

  const navLinkTo: NavLinkTo = {
    tenant: ({ id, content, style }) => <Link to="/app/tenants/$id" params={{ id }} style={style}>{content}</Link>,
    property: ({ id, content, style }) => <Link to="/app/properties/$id" params={{ id }} style={style}>{content}</Link>,
  };

  return <Slave asyncData={asyncData} navLinkTo={navLinkTo} />;
};