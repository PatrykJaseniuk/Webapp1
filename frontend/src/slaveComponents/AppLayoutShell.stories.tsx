import type { CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouterProvider } from '@/test-router-utils';
import { AppLayoutShell } from './AppLayouS';
import type { AppLayoutSProps } from '@/masterComponents/AppLayoutM';

const navLinksTo: AppLayoutSProps['navLinkTo'] = {
  dashboard: ({ content, style: _style }: { readonly content: string; readonly style: CSSProperties }) => <a key="dashboard" href="/app">{content}</a>,
  properties: ({ content, style: _style }: { readonly content: string; readonly style: CSSProperties }) => <a key="properties" href="/app/properties">{content}</a>,
  tenants: ({ content, style: _style }: { readonly content: string; readonly style: CSSProperties }) => <a key="tenants" href="/app/tenants">{content}</a>,
  leases: ({ content, style: _style }: { readonly content: string; readonly style: CSSProperties }) => <a key="leases" href="/app/leases">{content}</a>,
  financialEntries: ({ content, style: _style }: { readonly content: string; readonly style: CSSProperties }) => <a key="financialEntries" href="/app/financial-entries">{content}</a>,
};

const noop = (): void => { };

const fulfilledDataMode: AppLayoutSProps['asyncData'] = {
  tag: 'fulfilled',
  data: { email: 'admin@example.com' },
};

const fulfilledLongEmail: AppLayoutSProps['asyncData'] = {
  tag: 'fulfilled',
  data: { email: 'very.long.email.address@example.com' },
};

const meta: Meta<typeof AppLayoutShell> = {
  title: 'slave/AppLayoutShell',
  component: AppLayoutShell,
  decorators: [
    (Story) => (
      <MemoryRouterProvider>
        <Story />
      </MemoryRouterProvider>
    ),
  ],
  args: {
    navLinkTo: navLinksTo,
    asyncData: fulfilledDataMode,
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
    asyncData: fulfilledLongEmail,
    children: <p className="p-4 text-gray-600">Content area</p>,
  },
};
