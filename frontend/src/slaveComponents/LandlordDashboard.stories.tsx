import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentType, ReactNode } from 'react';
import { LandlordDashboard } from './LandlordDashboard';

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

const meta: Meta<typeof LandlordDashboard> = {
  title: 'slave/LandlordDashboard',
  component: LandlordDashboard,
  args: {
    LinkComponent: MockLink,
    cards,
  },
};
export default meta;

type Story = StoryObj<typeof LandlordDashboard>;

export const Default: Story = {};
