import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from '@tanstack/react-router';
import type { ComponentType, ReactNode } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import { toAsyncData, type AsyncData } from '@/generic';

type TenantRow = Database['public']['Tables']['tenants']['Row'];

type EnrichedTenantRow = Readonly<{
  id: string;
  userId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  idDocumentNumber: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  notes: string | null;
  tenantStatus: TenantRow['tenant_status'];
  createdAt: string;
  updatedAt: string;
  currentPropertyNames: string;
  currentPropertyIds: readonly string[];
}>;

type PropertyRef = {
  readonly id: string;
  readonly name: string | null;
};

type LeaseAgreementRef = {
  readonly property_id: string;
  readonly lease_status: string;
  readonly properties: PropertyRef | null;
};

type TenantWithLeases = TenantRow & {
  readonly lease_agreements: readonly LeaseAgreementRef[] | null;
};

const enrich = (row: TenantWithLeases): EnrichedTenantRow => {
  const activeLeases: readonly LeaseAgreementRef[] =
    (row.lease_agreements ?? []).filter(
      (la: LeaseAgreementRef) => la.lease_status === 'active',
    );

  const propertyNames: readonly string[] = activeLeases
    .map((la: LeaseAgreementRef) => la.properties?.name)
    .filter((n: string | null | undefined): n is string => n !== null && n !== undefined);

  const propertyIds: readonly string[] = activeLeases
    .map((la: LeaseAgreementRef) => la.property_id)
    .filter((id: string): id is string => id !== '');

  return {
    id: row.id,
    userId: row.user_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    idDocumentNumber: row.id_document_number,
    emergencyContactName: row.emergency_contact_name,
    emergencyContactPhone: row.emergency_contact_phone,
    notes: row.notes,
    tenantStatus: row.tenant_status,
    createdAt: row.created_at ?? '',
    updatedAt: row.updated_at ?? '',
    currentPropertyNames: propertyNames.join(', '),
    currentPropertyIds: propertyIds,
  };
};

export type TenantsSProps = {
  readonly asyncData: AsyncData<readonly EnrichedTenantRow[]>;
  readonly onDetailClick: (id: string) => void;
  readonly renderPropertyLink: (propertyId: string) => ReactNode;
};

type Props = {
  readonly TableComponent: ComponentType<TenantsSProps>;
};

export const TenantsM = ({
  TableComponent,
}: Props): JSX.Element => {
  const navigate = useNavigate();

  const query = useQuery({
    queryKey: ['tenants'],
    queryFn: async (): Promise<readonly EnrichedTenantRow[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: dbError } = await (backendConnector as any)
        .from('tenants')
        .select('*, lease_agreements(property_id, lease_status, properties(id, name))')
        .order('last_name')
        .order('first_name');
      if (dbError !== null) throw dbError;
      return ((data ?? []) as TenantWithLeases[]).map(enrich);
    },
  });

  const asyncData = toAsyncData(query, () => { query.refetch(); });

  const onDetailClick = (id: string): void => {
    navigate({ to: '/app/tenants/$id', params: { id } });
  };

  const renderPropertyLink = (propertyId: string): ReactNode =>
    <Link to="/app/properties/$id" params={{ id: propertyId }} />;

  return <TableComponent asyncData={asyncData} onDetailClick={onDetailClick} renderPropertyLink={renderPropertyLink} />;
};