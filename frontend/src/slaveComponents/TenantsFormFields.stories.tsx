import type { Meta, StoryObj } from '@storybook/react';
import { TenantsFormFields } from './TenantsFormFields';
import { emptyTenantInput, toTenantInput } from '@/masterComponents/TenantsSingle';
import type { Database } from '@/backendConnector';
import type { SlaveDataState } from '@/generic';
import type { TenantInput } from '@/masterComponents/TenantsSingle';

type TenantRow = Database['public']['Tables']['tenants']['Row'];

const makeTenant = (): TenantRow => ({
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
});

const noop = (): void => {};

const fulfilledState: SlaveDataState<TenantInput> = {
  tag: 'fulfilled',
  data: emptyTenantInput,
};

const pendingState: SlaveDataState<TenantInput> = { tag: 'pending' };

const rejectedState: SlaveDataState<TenantInput> = {
  tag: 'rejected',
  message: 'Błąd sieci',
  onRetry: noop,
};

const meta: Meta<typeof TenantsFormFields> = {
  component: TenantsFormFields,
  title: 'slaveComponents/TenantsFormFields',
};

export default meta;

type Story = StoryObj<typeof TenantsFormFields>;

export const Pending: Story = {
  args: {
    fetchState: pendingState,
    data: emptyTenantInput,
    isEditing: false,
    onSave: noop,
    onCancel: noop,
    isLoading: false,
    error: null,
  },
};

export const Rejected: Story = {
  args: {
    fetchState: rejectedState,
    data: emptyTenantInput,
    isEditing: false,
    onSave: noop,
    onCancel: noop,
    isLoading: false,
    error: null,
  },
};

export const Create: Story = {
  args: {
    fetchState: fulfilledState,
    data: emptyTenantInput,
    isEditing: false,
    onSave: noop,
    onCancel: noop,
    isLoading: false,
    error: null,
  },
};

export const Edit: Story = {
  args: {
    fetchState: fulfilledState,
    data: toTenantInput(makeTenant()),
    isEditing: true,
    onSave: noop,
    onCancel: noop,
    isLoading: false,
    error: null,
  },
};
