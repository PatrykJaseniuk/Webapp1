import type { Meta, StoryObj } from '@storybook/react';
import { fn, userEvent, within, expect } from 'storybook/test';
import { MemoryRouter } from 'react-router-dom';
import { PropertiesFormFields } from './PropertiesFormFields';
import type { Database } from '@/backendConnector';

type PropertyRow = Database['public']['Tables']['properties']['Row'];

const existingProperty: PropertyRow = {
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
  updated_at: '2024-01-01T00:00:00Z',
  created_by: 'user-1',
};

const meta: Meta<typeof PropertiesFormFields> = {
  title: 'slave/PropertiesFormFields',
  component: PropertiesFormFields,
  decorators: [
    (Story) => (
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Story />
      </MemoryRouter>
    ),
  ],
  args: {
    onSave: fn(),
  },
};
export default meta;

type Story = StoryObj<typeof PropertiesFormFields>;

export const New: Story = {
  args: {
    initial: undefined,
  },
};

export const Editing: Story = {
  args: {
    initial: existingProperty,
  },
};

export const SubmitNew: Story = {
  args: {
    initial: undefined,
    onSave: fn(async () => ({})),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText('Nazwa'), 'Nowa Nieruchomość');
    await userEvent.type(canvas.getByLabelText('Adres'), 'ul. Nowa 1');
    await userEvent.click(canvas.getByRole('button', { name: 'Zapisz' }));
    await expect(args.onSave).toHaveBeenCalled();
  },
};
