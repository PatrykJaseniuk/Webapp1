import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { PropertiesS } from './PropertiesS';
import type { PropertiesSProps } from '@/masterComponents/PropertiesM';

type Row = Extract<PropertiesSProps['asyncData'], { tag: 'fulfilled' }>['data'][number];

const property: Row = {
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
  created_at: '2024-01-01T00:00:00Z',
  created_by: null,
  updated_at: '2024-01-01T00:00:00Z',
  current_tenant_name: 'Jan Kowalski',
  tenant_id: 'tenant-1',
  current_lease_id: 'lease-1',
  current_rent: null,
  lease_start: null,
  lease_end: null,
};

const manyProperties: readonly Row[] = [
  property,
  { ...property, id: '2', name: 'Dom z ogrodem', property_type: 'house', monthly_rent: 5000, current_tenant_name: null, tenant_id: null, current_lease_id: null },
  { ...property, id: '3', name: 'Lokal użytkowy', property_type: 'commercial', property_status: 'inactive', current_tenant_name: null, tenant_id: null, current_lease_id: null },
];

const noop = (): void => { };

const pendingDataMode: PropertiesSProps['asyncData'] = { tag: 'pending' };

const rejectedDataMode: PropertiesSProps['asyncData'] = {
  tag: 'rejected',
  message: 'Błąd sieci',
  onRetry: noop,
};

const meta: Meta<typeof PropertiesS> = {
  title: 'slave/PropertiesS',
  component: PropertiesS,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  args: {
    getDetailUrl: (id: string) => `#/properties/${id}`,
    getTenantUrl: (tenantId: string) => `#/tenants/${tenantId}`,
  },
};
export default meta;

type Story = StoryObj<typeof PropertiesS>;

export const Pending: Story = {
  args: { asyncData: pendingDataMode },
};

export const Rejected: Story = {
  args: { asyncData: rejectedDataMode },
};

export const Empty: Story = {
  args: { asyncData: { tag: 'fulfilled', data: [] } },
};

export const Single: Story = {
  args: { asyncData: { tag: 'fulfilled', data: [property] } },
};

export const Many: Story = {
  args: { asyncData: { tag: 'fulfilled', data: manyProperties } },
};