import type { Meta, StoryObj } from '@storybook/react';
import { fn, userEvent, within, expect } from 'storybook/test';
import { PropertiesFormFields } from './PropertiesFormFields';
import type { PropertyInput } from '@/masterComponents/PropertiesSingle';
import type { SlaveDataState } from '@/generic';

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

const noop = (): void => {};

const fulfilledState: SlaveDataState<PropertyInput> = {
  tag: 'fulfilled',
  data: emptyDefaults,
};

const pendingState: SlaveDataState<PropertyInput> = { tag: 'pending' };

const rejectedState: SlaveDataState<PropertyInput> = {
  tag: 'rejected',
  message: 'Błąd sieci',
  onRetry: noop,
};

const meta: Meta<typeof PropertiesFormFields> = {
  title: 'slave/PropertiesFormFields',
  component: PropertiesFormFields,
  args: {
    fetchState: fulfilledState,
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

export const Pending: Story = {
  args: {
    fetchState: pendingState,
  },
};

export const Rejected: Story = {
  args: {
    fetchState: rejectedState,
  },
};

export const New: Story = {
  args: {
    fetchState: fulfilledState,
    data: emptyDefaults,
    isEditing: false,
  },
};

export const Editing: Story = {
  args: {
    fetchState: fulfilledState,
    data: existingDefaults,
    isEditing: true,
  },
};

export const Loading: Story = {
  args: {
    fetchState: fulfilledState,
    isLoading: true,
  },
};

export const WithError: Story = {
  args: {
    fetchState: fulfilledState,
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
