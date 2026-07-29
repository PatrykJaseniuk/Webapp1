import type { CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouterProvider } from '@/test-router-utils';
import { NotFound } from './NotFoundS';

const meta: Meta<typeof NotFound> = {
  title: 'slave/NotFound',
  component: NotFound,
  decorators: [
    (Story) => (
      <MemoryRouterProvider>
        <Story />
      </MemoryRouterProvider>
    ),
  ],
  args: {
    navLinkTo: { login: ({ content, style: _style }: { readonly content: string; readonly style: CSSProperties }) => <a href="/login">{content}</a> },
  },
};
export default meta;

type Story = StoryObj<typeof NotFound>;

export const Default: Story = {};
