import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouterProvider } from '@/test-router-utils';
import { AdminDashboard } from './AdminDashboardS';

const cards = [
  { to: '/admin/properties', title: 'Nieruchomości', subtitle: 'Zarządzaj nieruchomościami' },
  { to: '/admin/tenants', title: 'Najemcy', subtitle: 'Zarządzaj najemcami' },
];

const mockSummary = {
  totalProperties: 12,
  occupiedProperties: 8,
  totalTenants: 45,
  activeTenants: 32,
  totalUnpaidAmount: 15750.50,
  overdueItems: 7,
};

const meta: Meta<typeof AdminDashboard> = {
  title: 'slave/AdminDashboard',
  component: AdminDashboard,
  decorators: [
    (Story) => (
      <MemoryRouterProvider>
        <Story />
      </MemoryRouterProvider>
    ),
  ],
  args: {
    cards,
    asyncData: { tag: 'fulfilled', data: mockSummary },
  },
};
export default meta;

type Story = StoryObj<typeof AdminDashboard>;

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