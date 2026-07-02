import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentType, ReactNode } from 'react';
import { AdminDashboard } from './AdminDashboard';

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
  { to: '/admin/properties', title: 'Nieruchomości', subtitle: 'Zarządzaj nieruchomościami' },
  { to: '/admin/tenants', title: 'Najemcy', subtitle: 'Zarządzaj najemcami' },
];

const meta: Meta<typeof AdminDashboard> = {
  title: 'slave/AdminDashboard',
  component: AdminDashboard,
  args: {
    LinkComponent: MockLink,
    cards,
  },
};
export default meta;

type Story = StoryObj<typeof AdminDashboard>;

export const Default: Story = {};
