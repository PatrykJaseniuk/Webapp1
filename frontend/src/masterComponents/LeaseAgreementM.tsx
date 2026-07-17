import { match } from 'ts-pattern';
import { useQuery } from '@tanstack/react-query';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import { useUrls } from '@/hooks/useUrls';
import type { Database } from '@/backendConnector';
import { toAsyncData, type AsyncData } from '@/generic';

type LeaseAgreementDbRow = Database['public']['Tables']['lease_agreements']['Row'];
type TransactionDbRow = Database['public']['Tables']['transactions']['Row'];
type AttachmentDbRow = Database['public']['Tables']['attachments']['Row'];

type LeaseAgreementWithRelationships = Readonly<{
  leaseAgreement: LeaseAgreementDbRow & {
    readonly tenants: { readonly first_name: string; readonly last_name: string; };
    readonly properties: { readonly name: string; };
  } | null;
  transactions: readonly TransactionDbRow[];
  attachments: readonly AttachmentDbRow[];
}>;

export type LeaseAgreementSProps = {
  readonly asyncData: AsyncData<LeaseAgreementWithRelationships>;
  readonly getTenantUrl: (tenantId: string) => string;
  readonly getPropertyUrl: (propertyId: string) => string;
  readonly getTransactionUrl: (transactionId: string) => string;
  readonly getEditUrl: () => string;
  readonly getBackUrl: () => string;
};

type Props = {
  readonly Slave: ComponentType<LeaseAgreementSProps>;
  readonly id: string;
};

export const LeaseAgreementDetailM = ({
  Slave,
  id,
}: Props): JSX.Element => {
  const urls = useUrls();

  const query = useQuery({
    queryKey: ['leaseAgreement', id],
    queryFn: async (): Promise<LeaseAgreementWithRelationships> => {
      const [leaseResult, transactionsResult, attachmentsResult] = await Promise.all([
        backendConnector
          .from('lease_agreements')
          .select('*, tenants(first_name,last_name), properties(name)')
          .eq('id', id)
          .single(),
        backendConnector
          .from('transactions')
          .select('*')
          .eq('lease_id', id)
          .order('due_date', { ascending: false })
          .limit(30),
        backendConnector
          .from('attachments')
          .select('*')
          .eq('related_to_type', 'lease')
          .eq('related_to_id', id),
      ]);

      const combinedError =
        leaseResult.error ??
        transactionsResult.error ??
        attachmentsResult.error;
      if (combinedError !== null) throw combinedError;

      return {
        attachments: attachmentsResult.data ?? [],
        leaseAgreement: leaseResult.data ?? null,
        transactions: transactionsResult.data ?? [],
      };
    },
  });

  const asyncData = toAsyncData(query, () => { query.refetch(); });

  return match(urls)
    .with({ tag: 'pending' }, () => (
      <Slave
        asyncData={{ tag: 'pending' }}
        getTenantUrl={() => ''}
        getPropertyUrl={() => ''}
        getTransactionUrl={() => ''}
        getEditUrl={() => ''}
        getBackUrl={() => ''}
      />
    ))
    .with({ tag: 'ready' }, ({ url }) => (
      <Slave
        asyncData={asyncData}
        getTenantUrl={url.tenantDetail}
        getPropertyUrl={url.propertyDetail}
        getTransactionUrl={url.transactionDetail}
        getEditUrl={() => `${url.leaseDetail(id)}/edit`}
        getBackUrl={url.leasesList}
      />
    ))
    .exhaustive();
};