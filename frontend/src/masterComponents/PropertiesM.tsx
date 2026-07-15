import { useCallback } from 'react';
import { useAsync } from 'react-use';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import type { DataMode } from '@/generic';

export type PropertyRow = Database['public']['Tables']['properties']['Row'];

type PropertyOccupancyView = Database['public']['Views']['property_occupancy']['Row'];

export type EnrichedPropertyRow = Readonly<{
  id: string;
  name: string;
  address: string;
  property_type: PropertyRow['property_type'];
  size_sqm: number | null;
  bedrooms: number | null;
  monthly_rent: number;
  deposit_amount: number;
  property_status: PropertyRow['property_status'];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  currentTenantName: string | null;
  currentTenantId: string | null;
  currentLeaseId: string | null;
}>;

const enrich = (row: PropertyOccupancyView): EnrichedPropertyRow => ({
  id: row.id ?? '',
  name: row.name ?? '',
  address: row.address ?? '',
  property_type: row.property_type ?? 'apartment',
  size_sqm: row.size_sqm,
  bedrooms: row.bedrooms,
  monthly_rent: row.monthly_rent ?? 0,
  deposit_amount: row.deposit_amount ?? 0,
  property_status: row.property_status ?? 'available',
  notes: row.notes,
  createdAt: row.created_at ?? '',
  updatedAt: row.updated_at ?? '',
  currentTenantName: row.current_tenant_name,
  currentTenantId: row.tenant_id,
  currentLeaseId: row.current_lease_id,
});

type TableProps = {
  readonly dataMode: DataMode<readonly EnrichedPropertyRow[]>;
  readonly getDetailUrl: (id: string) => string;
  readonly getTenantUrl: (tenantId: string) => string;
};

type Props = {
  readonly TableComponent: ComponentType<TableProps>;
  readonly getDetailUrl: (id: string) => string;
  readonly getTenantUrl: (tenantId: string) => string;
};

export const PropertiesList = ({
  TableComponent,
  getDetailUrl,
  getTenantUrl,
}: Props): JSX.Element => {
  const { loading, error, value } = useAsync(async (): Promise<readonly EnrichedPropertyRow[]> => {
    const { data, error: dbError } = await backendConnector
      .from('property_occupancy')
      .select('*')
      .order('name');
    return dbError !== null ? [] : (data ?? []).map(enrich);
  }, []);

  const handleRetry = useCallback((): void => {
    window.location.reload();
  }, []);

  const dataMode: DataMode<readonly EnrichedPropertyRow[]> =
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
    />
  );
};