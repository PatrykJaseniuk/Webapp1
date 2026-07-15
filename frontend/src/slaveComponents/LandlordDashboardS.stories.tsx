import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentType, ReactNode } from 'react';
import { LandlordDashboard } from './LandlordDashboardS';

type LinkProps = {
  readonly to: string | { readonly pathname: string };
  readonly children: ReactNode;
  readonly className?: string;
};

const MockLink: ComponentType<LinkProps> = ({
  children,
  className,
}: LinkProps): JSX.Element => (
  <a className={className}>{children}</a>
);

const cards = [
  { to: '/landlord/properties', title: 'Nieruchomości', subtitle: 'Zarządzaj nieruchomościami' },
  { to: '/landlord/tenants', title: 'Najemcy', subtitle: 'Zarządzaj najemcami' },
];

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
  args: {
    LinkComponent: MockLink,
    cards,
    dataMode: { tag: 'fulfilled', data: mockSummary },
  },
};
export default meta;

type Story = StoryObj<typeof LandlordDashboard>;

export const Default: Story = {};

export const Pending: Story = {
  args: {
    dataMode: { tag: 'pending' },
  },
};

export const Rejected: Story = {
  args: {
    dataMode: {
      tag: 'rejected',
      message: 'Nie udało się załadować danych dashboardu.',
      onRetry: () => undefined,
    },
  },
};
