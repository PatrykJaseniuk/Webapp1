import { useNavigate, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import type { ComponentType, ReactNode } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
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
  readonly nav: Readonly<{
    readonly toTenant: (tenantId: string) => void;
    readonly toProperty: (propertyId: string) => void;
    readonly toTransaction: (transactionId: string) => void;
    readonly editLink: ReactNode;
    readonly backLink: ReactNode;
  }>;
};

type Props = {
  readonly Slave: ComponentType<LeaseAgreementSProps>;
  readonly id: string;
};

export const LeaseAgreementDetailM = ({
  Slave,
  id,
}: Props): JSX.Element => {
  const navigate = useNavigate();

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

  const nav = {
    toTenant: (tenantId: string) => { navigate({ to: '/app/tenants/$id', params: { id: tenantId } }); },
    toProperty: (propertyId: string) => { navigate({ to: '/app/properties/$id', params: { id: propertyId } }); },
    toTransaction: (transactionId: string) => { navigate({ to: '/app/transactions/$id', params: { id: transactionId } }); },
    editLink: <Link to="/app/leases/$id" params={{ id }}>Edytuj</Link>,
    backLink: <Link to="/app/leases">← Powrót do listy</Link>,
  } as const;

  return (
    <Slave
      asyncData={asyncData}
      nav={nav}
    />
  );
};