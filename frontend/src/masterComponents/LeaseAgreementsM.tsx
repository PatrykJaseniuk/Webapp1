import { useNavigate, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import type { ComponentType, ReactNode } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import { toAsyncData, type AsyncData } from '@/generic';

type LeaseAgreementDbRow = Database['public']['Tables']['lease_agreements']['Row']
type LeaseAgreementRow = LeaseAgreementDbRow & {
  readonly tenants: { readonly first_name: string; readonly last_name: string; };
  readonly properties: { readonly name: string; };
};

export type LeaseAgreementsSProps = {
  readonly asyncData: AsyncData<readonly LeaseAgreementRow[]>;
  readonly onDetailClick: (id: string) => void;
  readonly renderTenantLink: (tenantId: string) => ReactNode;
  readonly renderPropertyLink: (propertyId: string) => ReactNode;
};

type Props = {
  readonly Slave: ComponentType<LeaseAgreementsSProps>;
};

export const LeaseAgreementsM = ({
  Slave,
}: Props): JSX.Element => {
  const navigate = useNavigate();

  const query = useQuery({
    queryKey: ['lease_agreements'],
    queryFn: async (): Promise<readonly LeaseAgreementRow[]> => {
      const r = await backendConnector
        .from('lease_agreements')
        .select('*, tenants(first_name,last_name), properties(name)');
      if (r.error !== null) throw r.error;
      return r.data ?? [];
    },
  });

  const asyncData = toAsyncData(query, () => { query.refetch(); });

  const onDetailClick = (id: string): void => {
    navigate({ to: '/app/leases/$id', params: { id } });
  };

  const renderTenantLink = (tenantId: string): ReactNode =>
    <Link to="/app/tenants/$id" params={{ id: tenantId }} />;

  const renderPropertyLink = (propertyId: string): ReactNode =>
    <Link to="/app/properties/$id" params={{ id: propertyId }} />;

  return (
    <Slave
      asyncData={asyncData}
      onDetailClick={onDetailClick}
      renderTenantLink={renderTenantLink}
      renderPropertyLink={renderPropertyLink}
    />
  );
};