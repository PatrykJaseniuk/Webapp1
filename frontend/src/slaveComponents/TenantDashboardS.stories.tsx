import type { Meta, StoryObj } from '@storybook/react';
import { TenantDashboardS } from './TenantDashboardS';

const meta: Meta<typeof TenantDashboardS> = {
  title: 'slave/TenantDashboardS',
  component: TenantDashboardS,
};
export default meta;

type Story = StoryObj<typeof TenantDashboardS>;

export const Default: Story = {};