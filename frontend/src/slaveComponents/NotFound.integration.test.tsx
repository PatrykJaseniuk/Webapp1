import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NotFound } from './NotFound';

describe('NotFound', () => {
  it('renders 404 heading', () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <NotFound />
      </MemoryRouter>,
    );

    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('renders the descriptive message', () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <NotFound />
      </MemoryRouter>,
    );

    expect(screen.getByText('Page not found')).toBeInTheDocument();
    expect(
      screen.getByText('The page you are looking for does not exist or has been moved.'),
    ).toBeInTheDocument();
  });

  it('renders a link to login', () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <NotFound />
      </MemoryRouter>,
    );

    const link = screen.getByText('Go to login');
    expect(link.closest('a')).toHaveAttribute('href', '/login');
  });
});