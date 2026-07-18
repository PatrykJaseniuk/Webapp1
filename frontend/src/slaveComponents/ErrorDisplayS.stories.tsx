import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouterProvider } from '@/test-router-utils';
import { ErrorDisplay } from './ErrorDisplayS';

const meta: Meta<typeof ErrorDisplay> = {
  title: 'slave/ErrorDisplay',
  component: ErrorDisplay,
  decorators: [
    (Story) => (
      <MemoryRouterProvider>
        <Story />
      </MemoryRouterProvider>
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