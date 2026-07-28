import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouterProvider } from '@/test-router-utils';
import { LandlordDashboard } from './LandlordDashboardS';
import type { NavLink } from '@/generic/utils';

const mockNavLink: NavLink = ({ content, style }) => (
  <span style={style}>{content}</span>
);

const mockSummary = {
  totalProperties: 12,
  occupiedProperties: 8,
  totalTenants: 45,
  activeTenants: 32,
  totalUnpaidAmount: 15750.50,
  overdueItems: 7,
};

const meta: Meta<typeof LandlordDashboard> = {
  title: 'slave/LandlordDashboard',
  component: LandlordDashboard,
  decorators: [
    (Story) => (
      <MemoryRouterProvider>
        <Story />
      </MemoryRouterProvider>
    ),
  ],
  args: {
    navLinkTo: {
      leases: mockNavLink,
      tenants: mockNavLink,
      properties: mockNavLink,
    },
    asyncData: { tag: 'fulfilled', data: mockSummary },
  },
};
export default meta;

type Story = StoryObj<typeof LandlordDashboard>;

export const Default: Story = {};

export const Pending: Story = {
  args: {
    asyncData: { tag: 'pending' },
  },
};

export const Rejected: Story = {
  args: {
    asyncData: {
      tag: 'rejected',
      message: 'Nie udało się załadować danych dashboardu.',
      onRetry: () => undefined,
    },
  },
};