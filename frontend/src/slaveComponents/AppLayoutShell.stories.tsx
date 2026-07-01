import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { AppLayoutShell } from './AppLayoutShell';
import type { NavItem } from '@/generic';

const navItems: readonly NavItem[] = [
  { label: 'Dashboard', to: '/admin' },
  { label: 'Properties', to: '/admin/properties' },
  { label: 'Tenants', to: '/admin/tenants' },
];

const noop = (): void => {};

const meta: Meta<typeof AppLayoutShell> = {
  title: 'slave/AppLayoutShell',
  component: AppLayoutShell,
  decorators: [
    (Story) => (
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Story />
      </MemoryRouter>
    ),
  ],
  args: {
    navItems,
    email: 'admin@example.com',
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
    email: 'very.long.email.address@example.com',
    children: <p className="p-4 text-gray-600">Content area</p>,
  },
};