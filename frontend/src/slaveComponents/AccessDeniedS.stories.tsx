import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouterProvider } from '@/test-router-utils';
import { AccessDenied } from './AccessDeniedS';

const meta: Meta<typeof AccessDenied> = {
  title: 'slave/AccessDenied',
  component: AccessDenied,
  decorators: [
    (Story) => (
      <MemoryRouterProvider>
        <Story />
      </MemoryRouterProvider>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof AccessDenied>;

export const Default: Story = {};