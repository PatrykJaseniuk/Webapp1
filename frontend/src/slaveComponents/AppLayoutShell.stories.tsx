import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentType, ReactNode } from 'react';
import { AppLayoutShell } from './AppLayoutShell';

const navItems = {
  dashboard: '/admin',
  properties: '/admin/properties',
  tenants: '/admin/tenants',
};

const noop = (): void => {};

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

const meta: Meta<typeof AppLayoutShell> = {
  title: 'slave/AppLayoutShell',
  component: AppLayoutShell,
  args: {
    navItems,
    email: 'admin@example.com',
    onLogout: noop,
    LinkComponent: MockLink,
    activeTo: '/admin',
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
