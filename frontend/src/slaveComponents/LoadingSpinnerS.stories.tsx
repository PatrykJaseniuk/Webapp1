import type { Meta, StoryObj } from '@storybook/react-vite';
import { LoadingSpinner } from './LoadingSpinnerS';

const meta: Meta<typeof LoadingSpinner> = {
  title: 'slave/LoadingSpinner',
  component: LoadingSpinner,
};
export default meta;

type Story = StoryObj<typeof LoadingSpinner>;

export const Default: Story = {};