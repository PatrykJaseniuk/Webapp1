import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentType, ReactNode } from 'react';
import { AppLayoutShell } from './AppLayouS';
import type { DataMode } from '@/generic';
import type { AuthContextData } from '@/masterComponents/AppLayoutM';

const navItems = {
  dashboard: '/admin',
  properties: '/admin/properties',
  tenants: '/admin/tenants',
};

const noop = (): void => { };

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

const fulfilledDataMode: DataMode<AuthContextData> = {
  tag: 'fulfilled',
  data: { email: 'admin@example.com', onLogout: noop },
};

const fulfilledAuthLongEmail: DataMode<AuthContextData> = {
  tag: 'fulfilled',
  data: { email: 'very.long.email.address@example.com', onLogout: noop },
};

const meta: Meta<typeof AppLayoutShell> = {
  title: 'slave/AppLayoutShell',
  component: AppLayoutShell,
  args: {
    navItems,
    authState: fulfilledAuth,
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
    authState: fulfilledAuthLongEmail,
    children: <p className="p-4 text-gray-600">Content area</p>,
  },
};
