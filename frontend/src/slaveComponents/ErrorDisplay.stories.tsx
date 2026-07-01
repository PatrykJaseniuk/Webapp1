import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { ErrorDisplay } from './ErrorDisplay';

const meta: Meta<typeof ErrorDisplay> = {
  title: 'slave/ErrorDisplay',
  component: ErrorDisplay,
  decorators: [
    (Story) => (
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Story />
      </MemoryRouter>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof ErrorDisplay>;

export const NotFound: Story = {
  args: { is404: true },
};

export const ServerError: Story = {
  args: { is404: false },
};