import type { Meta, StoryObj } from '@storybook/react';
import { TenantsS } from './TenantsS';
import type { TenantsSProps } from '@/masterComponents/TenantsM';
import type { DataMode } from '@/generic';

type Row = Extract<TenantsSProps['dataMode'], { tag: 'fulfilled' }>['data'][number];

const makeTenant = (overrides?: Partial<Row>): Row => ({
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

const pendingDataMode: DataMode<readonly Row[]> = { tag: 'pending' };

const rejectedDataMode: DataMode<readonly Row[]> = {
  tag: 'rejected',
  message: 'Błąd sieci',
  onRetry: noop,
};

const meta: Meta<typeof TenantsS> = {
  component: TenantsS,
  title: 'slaveComponents/TenantsS',
  args: {
    getPropertyUrl: (propertyId: string): string => `#/properties/${propertyId}`,
  },
};

export default meta;

type Story = StoryObj<typeof TenantsS>;

export const Pending: Story = {
  args: { dataMode: pendingDataMode },
};

export const Rejected: Story = {
  args: { dataMode: rejectedDataMode },
};

export const Empty: Story = {
  args: { dataMode: { tag: 'fulfilled', data: [] } },
};

export const WithRows: Story = {
  args: {
    dataMode: {
      tag: 'fulfilled',
      data: [
        makeTenant({ id: '1', firstName: 'Jan', lastName: 'Kowalski', tenantStatus: 'active', currentPropertyNames: 'Apartament Centrum', currentPropertyIds: ['prop-1'] }),
        makeTenant({ id: '2', firstName: 'Anna', lastName: 'Nowak', tenantStatus: 'applicant', email: 'anna@example.com' }),
        makeTenant({ id: '3', firstName: 'Piotr', lastName: 'Zieliński', tenantStatus: 'past', phone: '555555555' }),
      ],
    },
  },
};