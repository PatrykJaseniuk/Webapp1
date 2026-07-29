import type { CSSProperties } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouterProvider } from '@/test-router-utils';
import { AccessDeniedS } from './AccessDeniedS';

const navLinkTo = {
  login: ({ content, style: _style }: { readonly content: string; readonly style: CSSProperties }) => (
    <a href="/login">{content}</a>
  ),
};

describe('AccessDenied', () => {
  it('renders the access denied heading', () => {
    render(
      <MemoryRouterProvider>
        <AccessDeniedS navLinkTo={navLinkTo} />
      </MemoryRouterProvider>,
    );

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });

  it('renders the descriptive message', () => {
    render(
      <MemoryRouterProvider>
        <AccessDeniedS navLinkTo={navLinkTo} />
      </MemoryRouterProvider>,
    );

    expect(
      screen.getByText('You do not have permission to view this page.'),
    ).toBeInTheDocument();
  });

  it('renders a link to login', () => {
    render(
      <MemoryRouterProvider>
        <AccessDeniedS navLinkTo={navLinkTo} />
      </MemoryRouterProvider>,
    );

    const link = screen.getByText('Go to login');
    expect(link.closest('a')).toHaveAttribute('href', '/login');
  });
});
