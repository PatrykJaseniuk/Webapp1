import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouterProvider } from '@/test-router-utils';
import { NotFound } from './NotFoundS';

const meta: Meta<typeof NotFound> = {
  title: 'slave/NotFound',
  component: NotFound,
  decorators: [
    (Story) => (
      <MemoryRouterProvider>
        <Story />
      </MemoryRouterProvider>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof NotFound>;

export const Default: Story = {};