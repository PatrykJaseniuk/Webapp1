import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';
import { AppLayoutShell } from './AppLayouS';
import type { AppLayoutSProps, NavItem } from '@/masterComponents/AppLayoutM';

const navItems: readonly NavItem[] = [
  { to: '/admin', link: <a href="/admin">Dashboard</a> as ReactNode },
  { to: '/admin/properties', link: <a href="/admin/properties">Properties</a> as ReactNode },
  { to: '/admin/tenants', link: <a href="/admin/tenants">Tenants</a> as ReactNode },
  { to: '/admin/leases', link: <a href="/admin/leases">Leases</a> as ReactNode },
];

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