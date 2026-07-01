import type { Meta, StoryObj } from '@storybook/react';
import { fn, userEvent, within, expect } from 'storybook/test';
import { PropertiesTable } from './PropertiesTable';
import type { Database } from '@/backendConnector';

type PropertyRow = Database['public']['Tables']['properties']['Row'];

const property: PropertyRow = {
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

const manyProperties: readonly PropertyRow[] = [
  property,
  { ...property, id: '2', name: 'Dom z ogrodem', property_type: 'house', monthly_rent: 5000 },
  { ...property, id: '3', name: 'Lokal użytkowy', property_type: 'commercial', property_status: 'inactive' },
];

const meta: Meta<typeof PropertiesTable> = {
  title: 'slave/PropertiesTable',
  component: PropertiesTable,
  args: {
    onDelete: fn(),
    getEditUrl: (id: string) => `/property/${id}/edit`,
  },
};
export default meta;

type Story = StoryObj<typeof PropertiesTable>;

export const Empty: Story = {
  args: { properties: [] },
};

export const Single: Story = {
  args: { properties: [property] },
};

export const Many: Story = {
  args: { properties: manyProperties },
};

export const DeleteProperty: Story = {
  args: { properties: [property] },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Usuń' }));
    await expect(args.onDelete).toHaveBeenCalledWith(property.id);
  },
};