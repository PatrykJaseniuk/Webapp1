import type { Meta, StoryObj } from '@storybook/react';
import { TenantsFormFields } from './TenantsFormFields';
import { emptyTenantInput, toTenantInput } from '@/masterComponents/TenantsSingle';
import type { Database } from '@/backendConnector';

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

const meta: Meta<typeof TenantsFormFields> = {
  component: TenantsFormFields,
  title: 'slaveComponents/TenantsFormFields',
};

export default meta;

type Story = StoryObj<typeof TenantsFormFields>;

export const Create: Story = {
  args: {
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
    data: toTenantInput(makeTenant()),
    isEditing: true,
    onSave: noop,
    onCancel: noop,
    isLoading: false,
    error: null,
  },
};