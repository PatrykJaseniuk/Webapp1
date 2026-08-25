import type { Meta, StoryObj } from '@storybook/react-vite';
import { TenantDashboardS } from './TenantDashboardS';
import type { NavLink } from '@/generic';

const mockNavLink: NavLink = ({ content, style }) => (
  <span style={style}>{content}</span>
);

const mockSummary = {
  activeLeases: 1,
  totalUnpaidAmount: 1200,
  overdueItems: 2,
};

const meta: Meta<typeof TenantDashboardS> = {
  title: 'slave/TenantDashboardS',
  component: TenantDashboardS,
  args: {
    navLinkTo: {
      leases: mockNavLink,
      financialEntries: mockNavLink,
    },
    asyncData: { tag: 'fulfilled', data: mockSummary },
  },
};
export default meta;

type Story = StoryObj<typeof TenantDashboardS>;

export const Default: Story = {};

export const Pending: Story = {
  args: { asyncData: { tag: 'pending' } },
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
