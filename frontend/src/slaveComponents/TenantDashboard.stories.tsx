import type { Meta, StoryObj } from '@storybook/react';
import { TenantDashboard } from './TenantDashboard';

const meta: Meta<typeof TenantDashboard> = {
  title: 'slave/TenantDashboard',
  component: TenantDashboard,
};
export default meta;

type Story = StoryObj<typeof TenantDashboard>;

export const Default: Story = {};