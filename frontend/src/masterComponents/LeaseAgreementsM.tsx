import { useCallback } from 'react';
import { useAsync } from 'react-use';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import type { DataMode, LeaseSummary } from '@/generic';

export type EnrichedLeaseAgreementRow = LeaseSummary;



const enrich = (row: Database['public']['Views']['active_leases']['Row']): EnrichedLeaseAgreementRow => ({
  id: row.id ?? '',
  propertyName: row.property_name ?? '',
  propertyId: row.property_id ?? '',
  tenantName: row.tenant_name ?? '',
  tenantId: row.tenant_id ?? '',
  startDate: row.start_date ?? '',
  endDate: row.end_date,
  monthlyRent: row.monthly_rent ?? 0,
  depositAmount: row.deposit_amount ?? 0,
  leaseStatus: row.lease_status ?? 'active',
});

type TableProps = {
  readonly dataMode: DataMode<readonly EnrichedLeaseAgreementRow[]>;
  readonly getDetailUrl: (id: string) => string;
  readonly getTenantUrl: (tenantId: string) => string;
  readonly getPropertyUrl: (propertyId: string) => string;
};

type Props = {
  readonly TableComponent: ComponentType<TableProps>;
  readonly getDetailUrl: (id: string) => string;
  readonly getTenantUrl: (tenantId: string) => string;
  readonly getPropertyUrl: (propertyId: string) => string;
};

export const LeaseAgreementsList = ({
  TableComponent,
  getDetailUrl,
  getTenantUrl,
  getPropertyUrl,
}: Props): JSX.Element => {
  const { loading, error, value } = useAsync(async (): Promise<readonly EnrichedLeaseAgreementRow[]> => {
    const { data, error: dbError } = await backendConnector
      .from('active_leases')
      .select('*')
      .order('start_date', { ascending: false });
    return dbError !== null ? [] : (data ?? []).map(enrich);
  }, []);

  const handleRetry = useCallback((): void => {
    window.location.reload();
  }, []);

  const dataMode: DataMode<readonly EnrichedLeaseAgreementRow[]> =
    loading ?
      { tag: 'pending' } :
      error !== undefined ?
        { tag: 'rejected', message: error.message, onRetry: handleRetry } :
        { tag: 'fulfilled', data: value ?? [] };

  return (
    <TableComponent
      dataMode={dataMode}
      getDetailUrl={getDetailUrl}
      getTenantUrl={getTenantUrl}
      getPropertyUrl={getPropertyUrl}
    />
  );
};