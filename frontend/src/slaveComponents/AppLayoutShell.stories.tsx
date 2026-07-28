import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouterProvider } from '@/test-router-utils';
import { AppLayoutShell } from './AppLayouS';
import type { AppLayoutSProps } from '@/masterComponents/AppLayoutM';

const sidebarLinks: readonly JSX.Element[] = [
  <a key="dashboard" href="/app">Dashboard</a>,
  <a key="properties" href="/app/properties">Properties</a>,
  <a key="tenants" href="/app/tenants">Tenants</a>,
  <a key="leases" href="/app/leases">Leases</a>,
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
      <MemoryRouterProvider>
        <Story />
      </MemoryRouterProvider>
    ),
  ],
  args: {
    sidebarLinks,
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