import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouterProvider } from '@/test-router-utils';
import { AccessDenied } from './AccessDeniedS';

describe('AccessDenied', () => {
  it('renders the access denied heading', () => {
    render(
      <MemoryRouterProvider>
        <AccessDenied />
      </MemoryRouterProvider>,
    );

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });

  it('renders the descriptive message', () => {
    render(
      <MemoryRouterProvider>
        <AccessDenied />
      </MemoryRouterProvider>,
    );

    expect(
      screen.getByText('You do not have permission to view this page.'),
    ).toBeInTheDocument();
  });

  it('renders a link to login', () => {
    render(
      <MemoryRouterProvider>
        <AccessDenied />
      </MemoryRouterProvider>,
    );

    const link = screen.getByText('Go to login');
    expect(link.closest('a')).toHaveAttribute('href', '/login');
  });
});