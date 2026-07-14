import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { NotFound } from './NotFoundS';

const meta: Meta<typeof NotFound> = {
  title: 'slave/NotFound',
  component: NotFound,
  decorators: [
    (Story) => (
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Story />
      </MemoryRouter>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof NotFound>;

export const Default: Story = {};