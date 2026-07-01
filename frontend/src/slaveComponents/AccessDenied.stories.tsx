import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { AccessDenied } from './AccessDenied';

const meta: Meta<typeof AccessDenied> = {
  title: 'slave/AccessDenied',
  component: AccessDenied,
  decorators: [
    (Story) => (
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Story />
      </MemoryRouter>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof AccessDenied>;

export const Default: Story = {};