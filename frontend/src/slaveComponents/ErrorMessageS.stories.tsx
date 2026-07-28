import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, userEvent, within, expect } from 'storybook/test';
import { ErrorMessage } from './ErrorMessageS';

const meta: Meta<typeof ErrorMessage> = {
  title: 'slave/ErrorMessage',
  component: ErrorMessage,
  args: {
    onRetry: fn(),
  },
};
export default meta;

type Story = StoryObj<typeof ErrorMessage>;

export const Default: Story = {
  args: {
    message: 'Nie udało się zapisać danych.',
  },
};

export const LongMessage: Story = {
  args: {
    message:
      'Wystąpił nieoczekiwany błąd serwera. Spróbuj ponownie za kilka minut. Jeśli problem się powtarza, skontaktuj się z administratorem.',
  },
};

export const ClickRetry: Story = {
  args: {
    message: 'Błąd sieci.',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Spróbuj ponownie' }));
    await expect(args.onRetry).toHaveBeenCalledOnce();
  },
};