import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouterProvider } from '@/test-router-utils';
import { fn, userEvent, within, expect } from 'storybook/test';
import { SignupForm } from './SignupFormS';

const meta: Meta<typeof SignupForm> = {
  title: 'slave/SignupForm',
  component: SignupForm,
  decorators: [
    (Story) => (
      <MemoryRouterProvider>
        <Story />
      </MemoryRouterProvider>
    ),
  ],
  args: {
    onSubmit: fn(),
    loginUrl: '/login',
  },
};
export default meta;

type Story = StoryObj<typeof SignupForm>;

export const Default: Story = {
  args: {
    isLoading: false,
    error: null,
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
    error: null,
  },
};

export const WithError: Story = {
  args: {
    isLoading: false,
    error: 'Ten email jest już zarejestrowany.',
  },
};

export const SubmitForm: Story = {
  args: {
    isLoading: false,
    error: null,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByRole('textbox', { name: /email/i }),
      'new@example.com',
    );
    await userEvent.type(canvas.getByLabelText('Hasło'), 'StrongPass1!');
    await userEvent.type(canvas.getByLabelText('Imię'), 'Jan');
    await userEvent.type(canvas.getByLabelText('Nazwisko'), 'Kowalski');
    await userEvent.click(canvas.getByRole('button', { name: /zarejestruj/i }));
    await expect(args.onSubmit).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'StrongPass1!',
      firstName: 'Jan',
      lastName: 'Kowalski',
    });
  },
};