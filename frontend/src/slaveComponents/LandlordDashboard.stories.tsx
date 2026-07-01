import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { LandlordDashboard } from './LandlordDashboard';

const meta: Meta<typeof LandlordDashboard> = {
  title: 'slave/LandlordDashboard',
  component: LandlordDashboard,
  decorators: [
    (Story) => (
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Story />
      </MemoryRouter>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof LandlordDashboard>;

export const Default: Story = {};