import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode, CSSProperties } from 'react';
import { AdminDashboard } from './AdminDashboardS';

const mockNavLink = (_content: string) =>
  ({ style, content: c }: { readonly style: CSSProperties; readonly content: string }): ReactNode =>
    <a href="#" style={style}>{c}</a>;

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
  args: {
    navLinkTo: {
      leases: mockNavLink('Umowy'),
      tenants: mockNavLink('Najemcy'),
      properties: mockNavLink('Nieruchomości'),
      transactions: mockNavLink('Transakcje'),
    },
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