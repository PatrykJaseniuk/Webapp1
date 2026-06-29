import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorMessage } from './ErrorMessage';

describe('ErrorMessage', () => {
  it('renders the error message', () => {
    render(<ErrorMessage message="Something broke" onRetry={vi.fn()} />);

    expect(screen.getByText('Something broke')).toBeInTheDocument();
  });

  it('renders the retry button', () => {
    render(<ErrorMessage message="Error" onRetry={vi.fn()} />);

    expect(screen.getByText('Spróbuj ponownie')).toBeInTheDocument();
  });

  it('calls onRetry when button is clicked', async () => {
    const onRetry = vi.fn();
    render(<ErrorMessage message="Error" onRetry={onRetry} />);

    const user = userEvent.setup();
    await user.click(screen.getByText('Spróbuj ponownie'));

    expect(onRetry).toHaveBeenCalledOnce();
  });
});