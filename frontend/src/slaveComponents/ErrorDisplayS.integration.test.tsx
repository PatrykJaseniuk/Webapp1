import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ErrorDisplay } from './ErrorDisplayS';

describe('ErrorDisplay', () => {
  it('renders 404 heading when is404 is true', () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ErrorDisplay is404={true} />
      </MemoryRouter>,
    );

    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('renders "Page not found" when is404 is true', () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ErrorDisplay is404={true} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Page not found')).toBeInTheDocument();
  });

  it('renders a login link when is404 is true', () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ErrorDisplay is404={true} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Go to login')).toBeInTheDocument();
  });

  it('renders generic error heading when is404 is false', () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ErrorDisplay is404={false} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders a login link when is404 is false', () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ErrorDisplay is404={false} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Go to login')).toBeInTheDocument();
  });
});