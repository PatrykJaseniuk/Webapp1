import type { Meta, StoryObj } from '@storybook/react';
import { fn, userEvent, within, expect } from 'storybook/test';
import { PropertiesFormFields } from './PropertiesFormFields';
import type { PropertyInput } from '@/masterComponents/PropertiesSingle';

const emptyDefaults: PropertyInput = Object.freeze({
  name: '',
  address: '',
  property_type: 'apartment',
  property_status: 'available',
  monthly_rent: 0,
  deposit_amount: 0,
  size_sqm: null,
  bedrooms: null,
  notes: null,
});

const existingDefaults: PropertyInput = Object.freeze({
  name: 'Apartament Centrum',
  address: 'ul. Marszałkowska 10, Warszawa',
  property_type: 'apartment',
  property_status: 'available',
  monthly_rent: 2500,
  deposit_amount: 5000,
  size_sqm: 45,
  bedrooms: 2,
  notes: null,
});

const meta: Meta<typeof PropertiesFormFields> = {
  title: 'slave/PropertiesFormFields',
  component: PropertiesFormFields,
  args: {
    data: emptyDefaults,
    isEditing: false,
    onSubmit: fn(),
    onCancel: fn(),
    isLoading: false,
    error: null,
  },
};
export default meta;

type Story = StoryObj<typeof PropertiesFormFields>;

export const New: Story = {
  args: {
    data: emptyDefaults,
    isEditing: false,
  },
};

export const Editing: Story = {
  args: {
    data: existingDefaults,
    isEditing: true,
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

export const WithError: Story = {
  args: {
    error: 'Wystąpił błąd podczas zapisywania.',
  },
};

export const SubmitNew: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText('Nazwa'), 'Nowa Nieruchomość');
    await userEvent.type(canvas.getByLabelText('Adres'), 'ul. Nowa 1');
    await userEvent.click(canvas.getByRole('button', { name: 'Zapisz' }));
    await expect(args.onSubmit).toHaveBeenCalled();
  },
};