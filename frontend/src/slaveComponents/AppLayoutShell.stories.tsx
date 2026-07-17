import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { AppLayoutShell } from './AppLayouS';
import type { AppLayoutSProps, NavItem } from '@/masterComponents/AppLayoutM';

const navItems: readonly NavItem[] = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/properties', label: 'Properties' },
  { to: '/admin/tenants', label: 'Tenants' },
  { to: '/admin/leases', label: 'Leases' },
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
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  args: {
    navItems,
    asyncData: fulfilledDataMode,
    onLogout: noop,
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