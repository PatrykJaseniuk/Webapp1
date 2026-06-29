import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AccessDenied } from './AccessDenied';

describe('AccessDenied', () => {
  it('renders the access denied heading', () => {
    render(
      <MemoryRouter>
        <AccessDenied />
      </MemoryRouter>,
    );

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });

  it('renders the descriptive message', () => {
    render(
      <MemoryRouter>
        <AccessDenied />
      </MemoryRouter>,
    );

    expect(
      screen.getByText('You do not have permission to view this page.'),
    ).toBeInTheDocument();
  });

  it('renders a link to login', () => {
    render(
      <MemoryRouter>
        <AccessDenied />
      </MemoryRouter>,
    );

    const link = screen.getByText('Go to login');
    expect(link.closest('a')).toHaveAttribute('href', '/login');
  });
});