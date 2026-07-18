import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouterProvider } from '@/test-router-utils';
import { NotFound } from './NotFoundS';

describe('NotFound', () => {
  it('renders 404 heading', () => {
    render(
      <MemoryRouterProvider>
        <NotFound />
      </MemoryRouterProvider>,
    );

    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('renders the descriptive message', () => {
    render(
      <MemoryRouterProvider>
        <NotFound />
      </MemoryRouterProvider>,
    );

    expect(screen.getByText('Page not found')).toBeInTheDocument();
    expect(
      screen.getByText('The page you are looking for does not exist or has been moved.'),
    ).toBeInTheDocument();
  });

  it('renders a link to login', () => {
    render(
      <MemoryRouterProvider>
        <NotFound />
      </MemoryRouterProvider>,
    );

    const link = screen.getByText('Go to login');
    expect(link.closest('a')).toHaveAttribute('href', '/login');
  });
});