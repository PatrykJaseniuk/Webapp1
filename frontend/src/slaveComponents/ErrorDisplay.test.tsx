import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ErrorDisplay } from './ErrorDisplay';

// ──────────────────────────────────────────────────────────────
// Mock useRouteError to control the error value
// ──────────────────────────────────────────────────────────────

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useRouteError: vi.fn(),
  };
});

const mockUseRouteError = (await import('react-router-dom')).useRouteError as ReturnType<typeof vi.fn>;

describe('ErrorDisplay', () => {
  it('renders 404 heading when route error is 404', () => {
    mockUseRouteError.mockReturnValue({
      status: 404,
      statusText: 'Not Found',
      internal: true,
      data: undefined,
    });

    render(
      <MemoryRouter>
        <ErrorDisplay />
      </MemoryRouter>,
    );

    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('renders "Page not found" for 404 errors', () => {
    mockUseRouteError.mockReturnValue({
      status: 404,
      statusText: 'Not Found',
      internal: true,
      data: undefined,
    });

    render(
      <MemoryRouter>
        <ErrorDisplay />
      </MemoryRouter>,
    );

    expect(screen.getByText('Page not found')).toBeInTheDocument();
  });

  it('renders a login link for 404 errors', () => {
    mockUseRouteError.mockReturnValue({
      status: 404,
      statusText: 'Not Found',
      internal: true,
      data: undefined,
    });

    render(
      <MemoryRouter>
        <ErrorDisplay />
      </MemoryRouter>,
    );

    expect(screen.getByText('Go to login')).toBeInTheDocument();
  });

  it('renders generic error heading for non-404 errors', () => {
    mockUseRouteError.mockReturnValue({ status: 500, statusText: 'Server Error' });

    render(
      <MemoryRouter>
        <ErrorDisplay />
      </MemoryRouter>,
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders a login link for non-404 errors', () => {
    mockUseRouteError.mockReturnValue({ status: 500, statusText: 'Server Error' });

    render(
      <MemoryRouter>
        <ErrorDisplay />
      </MemoryRouter>,
    );

    expect(screen.getByText('Go to login')).toBeInTheDocument();
  });
});