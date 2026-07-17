import { match } from 'ts-pattern';
import { useQuery } from '@tanstack/react-query';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import { useUrls } from '@/hooks/useUrls';
import type { Database } from '@/backendConnector';
import { toAsyncData, type AsyncData } from '@/generic';

type LeaseAgreementDbRow = Database['public']['Tables']['lease_agreements']['Row']
type LeaseAgreementRow = LeaseAgreementDbRow & {
  readonly tenants: { readonly first_name: string; readonly last_name: string; };
  readonly properties: { readonly name: string; };
};


export type LeaseAgreementsSProps = {
  readonly asyncData: AsyncData<readonly LeaseAgreementRow[]>;
  readonly getLeaseAgreementUrl: (id: string) => string;
  readonly getTenantUrl: (tenantId: string) => string;
  readonly getPropertyUrl: (propertyId: string) => string;
};

type Props = {
  readonly Slave: ComponentType<LeaseAgreementsSProps>;
};

export const LeaseAgreementsM = ({
  Slave,
}: Props): JSX.Element => {
  const urls = useUrls();

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

  return match(urls)
    .with({ tag: 'pending' }, () => (
      <Slave
        asyncData={{ tag: 'pending' }}
        getLeaseAgreementUrl={() => ''}
        getTenantUrl={() => ''}
        getPropertyUrl={() => ''}
      />
    ))
    .with({ tag: 'ready' }, ({ url }) => (
      <Slave
        asyncData={asyncData}
        getLeaseAgreementUrl={url.leaseDetail}
        getTenantUrl={url.tenantDetail}
        getPropertyUrl={url.propertyDetail}
      />
    ))
    .exhaustive();
};