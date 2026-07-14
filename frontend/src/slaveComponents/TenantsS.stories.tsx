import type { Meta, StoryObj } from '@storybook/react';
import { TenantsS } from './TenantsS';
import type { EnrichedTenantRow } from '@/masterComponents/TenantsM';
import type { SlaveDataState } from '@/generic';

const makeTenant = (overrides?: Partial<EnrichedTenantRow>): EnrichedTenantRow => ({
  id: '00000000-0000-0000-0000-000000000001',
  userId: null,
  firstName: 'Jan',
  lastName: 'Kowalski',
  email: 'jan@example.com',
  phone: '123456789',
  idDocumentNumber: 'ABC123456',
  emergencyContactName: 'Anna Kowalska',
  emergencyContactPhone: '987654321',
  notes: null,
  tenantStatus: 'active',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  currentPropertyNames: '',
  currentPropertyIds: [],
  ...overrides,
});

const noop = (): void => { };

const pendingState: SlaveDataState<readonly EnrichedTenantRow[]> = { tag: 'pending' };

const rejectedState: SlaveDataState<readonly EnrichedTenantRow[]> = {
  tag: 'rejected',
  message: 'Błąd sieci',
  onRetry: noop,
};

const meta: Meta<typeof TenantsS> = {
  component: TenantsS,
  title: 'slaveComponents/TenantsS',
  args: {
    getDetailUrl: (id: string): string => `#/tenants/${id}`,
    getPropertyUrl: (propertyId: string): string => `#/properties/${propertyId}`,
  },
};

export default meta;

type Story = StoryObj<typeof TenantsS>;

export const Pending: Story = {
  args: { state: pendingState },
};

export const Rejected: Story = {
  args: { state: rejectedState },
};

export const Empty: Story = {
  args: { state: { tag: 'fulfilled', data: [] } },
};

export const WithRows: Story = {
  args: {
    state: {
      tag: 'fulfilled',
      data: [
        makeTenant({ id: '1', firstName: 'Jan', lastName: 'Kowalski', tenantStatus: 'active', currentPropertyNames: 'Apartament Centrum', currentPropertyIds: ['prop-1'] }),
        makeTenant({ id: '2', firstName: 'Anna', lastName: 'Nowak', tenantStatus: 'applicant', email: 'anna@example.com' }),
        makeTenant({ id: '3', firstName: 'Piotr', lastName: 'Zieliński', tenantStatus: 'past', phone: '555555555' }),
      ],
    },
  },
};