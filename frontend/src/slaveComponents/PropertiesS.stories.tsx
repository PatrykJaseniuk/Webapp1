import type { Meta, StoryObj } from '@storybook/react';
import { PropertiesS } from './PropertiesS';
import type { EnrichedPropertyRow } from '@/masterComponents/PropertiesM';
import type { DataMode } from '@/generic';

const property: EnrichedPropertyRow = {
  id: '1',
  name: 'Apartament Centrum',
  address: 'ul. Marszałkowska 10, Warszawa',
  property_type: 'apartment',
  property_status: 'available',
  monthly_rent: 2500,
  deposit_amount: 5000,
  size_sqm: 45,
  bedrooms: 2,
  notes: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  currentTenantName: 'Jan Kowalski',
  currentTenantId: 'tenant-1',
  currentLeaseId: 'lease-1',
};

const manyProperties: readonly EnrichedPropertyRow[] = [
  property,
  { ...property, id: '2', name: 'Dom z ogrodem', property_type: 'house', monthly_rent: 5000, currentTenantName: null, currentTenantId: null, currentLeaseId: null },
  { ...property, id: '3', name: 'Lokal użytkowy', property_type: 'commercial', property_status: 'inactive', currentTenantName: null, currentTenantId: null, currentLeaseId: null },
];

const noop = (): void => { };

const pendingDataMode: DataMode<readonly EnrichedPropertyRow[]> = { tag: 'pending' };

const rejectedDataMode: DataMode<readonly EnrichedPropertyRow[]> = {
  tag: 'rejected',
  message: 'Błąd sieci',
  onRetry: noop,
};

const meta: Meta<typeof PropertiesS> = {
  title: 'slave/PropertiesS',
  component: PropertiesS,
  args: {
    getDetailUrl: (id: string) => `#/properties/${id}`,
    getTenantUrl: (tenantId: string) => `#/tenants/${tenantId}`,
  },
};
export default meta;

type Story = StoryObj<typeof PropertiesS>;

export const Pending: Story = {
  args: { state: pendingState },
};

export const Rejected: Story = {
  args: { state: rejectedState },
};

export const Empty: Story = {
  args: { state: { tag: 'fulfilled', data: [] } },
};

export const Single: Story = {
  args: { state: { tag: 'fulfilled', data: [property] } },
};

export const Many: Story = {
  args: { state: { tag: 'fulfilled', data: manyProperties } },
};