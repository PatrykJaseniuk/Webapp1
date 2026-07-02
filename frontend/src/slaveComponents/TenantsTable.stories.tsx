import type { Meta, StoryObj } from '@storybook/react';
import { TenantsTable } from './TenantsTable';
import type { Database } from '@/backendConnector';
import type { SlaveDataState } from '@/generic';

type TenantRow = Database['public']['Tables']['tenants']['Row'];

const makeTenant = (overrides?: Partial<TenantRow>): TenantRow => ({
  id: '00000000-0000-0000-0000-000000000001',
  user_id: null,
  first_name: 'Jan',
  last_name: 'Kowalski',
  email: 'jan@example.com',
  phone: '123456789',
  id_document_number: 'ABC123456',
  emergency_contact_name: 'Anna Kowalska',
  emergency_contact_phone: '987654321',
  notes: null,
  tenant_status: 'active',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
});

const noop = (): void => {};

const pendingState: SlaveDataState<readonly TenantRow[]> = { tag: 'pending' };

const rejectedState: SlaveDataState<readonly TenantRow[]> = {
  tag: 'rejected',
  message: 'Błąd sieci',
  onRetry: noop,
};

const meta: Meta<typeof TenantsTable> = {
  component: TenantsTable,
  title: 'slaveComponents/TenantsTable',
};

export default meta;

type Story = StoryObj<typeof TenantsTable>;

export const Pending: Story = {
  args: {
    state: pendingState,
    onDelete: noop,
    getEditUrl: (id: string): string => `#/tenants/${id}`,
  },
};

export const Rejected: Story = {
  args: {
    state: rejectedState,
    onDelete: noop,
    getEditUrl: (id: string): string => `#/tenants/${id}`,
  },
};

export const Empty: Story = {
  args: {
    state: { tag: 'fulfilled', data: [] },
    onDelete: noop,
    getEditUrl: (id: string): string => `#/tenants/${id}`,
  },
};

export const WithRows: Story = {
  args: {
    state: {
      tag: 'fulfilled',
      data: [
        makeTenant({ id: '1', first_name: 'Jan', last_name: 'Kowalski', tenant_status: 'active' }),
        makeTenant({ id: '2', first_name: 'Anna', last_name: 'Nowak', tenant_status: 'applicant', email: 'anna@example.com' }),
        makeTenant({ id: '3', first_name: 'Piotr', last_name: 'Zieliński', tenant_status: 'past', phone: '555555555' }),
      ],
    },
    onDelete: noop,
    getEditUrl: (id: string): string => `#/tenants/${id}`,
  },
};
