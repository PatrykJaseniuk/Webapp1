import type { CSSProperties } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouterProvider } from '@/test-router-utils';
import { ErrorDisplay } from './ErrorDisplayS';

const navLinkTo = {
  login: ({ content, style: _style }: { readonly content: string; readonly style: CSSProperties }) => (
    <a href="/login">{content}</a>
  ),
};

describe('ErrorDisplay', () => {
  it('renders 404 heading when is404 is true', () => {
    render(
      <MemoryRouterProvider>
        <ErrorDisplay is404={true} navLinkTo={navLinkTo} />
      </MemoryRouterProvider>,
    );

    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('renders "Page not found" when is404 is true', () => {
    render(
      <MemoryRouterProvider>
        <ErrorDisplay is404={true} navLinkTo={navLinkTo} />
      </MemoryRouterProvider>,
    );

    expect(screen.getByText('Page not found')).toBeInTheDocument();
  });

  it('renders a login link when is404 is true', () => {
    render(
      <MemoryRouterProvider>
        <ErrorDisplay is404={true} navLinkTo={navLinkTo} />
      </MemoryRouterProvider>,
    );

    expect(screen.getByText('Go to login')).toBeInTheDocument();
  });

  it('renders generic error heading when is404 is false', () => {
    render(
      <MemoryRouterProvider>
        <ErrorDisplay is404={false} navLinkTo={navLinkTo} />
      </MemoryRouterProvider>,
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders a login link when is404 is false', () => {
    render(
      <MemoryRouterProvider>
        <ErrorDisplay is404={false} navLinkTo={navLinkTo} />
      </MemoryRouterProvider>,
    );

    expect(screen.getByText('Go to login')).toBeInTheDocument();
  });
});
