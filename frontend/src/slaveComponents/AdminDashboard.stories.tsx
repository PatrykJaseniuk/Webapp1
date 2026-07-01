import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminDashboard } from './AdminDashboard';

const meta: Meta<typeof AdminDashboard> = {
  title: 'slave/AdminDashboard',
  component: AdminDashboard,
  decorators: [
    (Story) => (
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Story />
      </MemoryRouter>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof AdminDashboard>;

export const Default: Story = {};