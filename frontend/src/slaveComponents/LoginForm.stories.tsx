import type { Meta, StoryObj } from '@storybook/react';
import { fn, userEvent, within, expect } from 'storybook/test';
import { LoginForm } from './LoginForm';

const meta: Meta<typeof LoginForm> = {
  title: 'slave/LoginForm',
  component: LoginForm,
  args: {
    onSubmit: fn(),
  },
};
export default meta;

type Story = StoryObj<typeof LoginForm>;

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
    error: 'Nieprawidłowy email lub hasło.',
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
      'test@example.com',
    );
    await userEvent.type(canvas.getByLabelText('Hasło'), 'password123');
    await userEvent.click(canvas.getByRole('button', { name: /zaloguj/i }));
    await expect(args.onSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  },
};