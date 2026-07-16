import type { Meta, StoryObj } from '@storybook/react';
import { AppLayoutShell } from './AppLayouS';
import type { AppLayoutSProps } from '@/masterComponents/AppLayoutM';

const navItems = {
  dashboard: '/admin',
  properties: '/admin/properties',
  tenants: '/admin/tenants',
};

const noop = (): void => { };

const fulfilledDataMode: AppLayoutSProps['asyncData'] = {
  tag: 'fulfilled',
  data: { email: 'admin@example.com' },
};

const fulfilledLongEmail: AppLayoutSProps['asyncData'] = {
  tag: 'fulfilled',
  data: { email: 'very.long.email.address@example.com' },
};

const meta: Meta<typeof AppLayoutShell> = {
  title: 'slave/AppLayoutShell',
  component: AppLayoutShell,
  args: {
    navItems,
    asyncData: fulfilledDataMode,
    onLogout: noop,
    activeTo: '/admin',
  },
};
export default meta;

type Story = StoryObj<typeof AppLayoutShell>;

export const Default: Story = {
  args: {
    children: <p className="p-4 text-gray-600">Content area</p>,
  },
};

export const LongEmail: Story = {
  args: {
    asyncData: fulfilledLongEmail,
    children: <p className="p-4 text-gray-600">Content area</p>,
  },
};