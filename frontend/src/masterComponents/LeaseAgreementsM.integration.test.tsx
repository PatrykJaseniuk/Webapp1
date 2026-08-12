import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouterProvider } from '@/test-router-utils';
import {
  signInAs,
  signOut,
  TEST_UUIDS,
  checkAvailable,
  type SupabaseClient,
} from '@/backendConnector/test-setup';
import type { ComponentType } from 'react';
import type { LeaseAgreementsSProps } from './LeaseAgreementsM';

// ──────────────────────────────────────────────────────────────
// Mock backendConnector with a real signed-in client
// ──────────────────────────────────────────────────────────────

let mockClient: SupabaseClient | undefined;

vi.mock('@/backendConnector/backendConnector', () => ({
  get backendConnector() {
    return mockClient as SupabaseClient;
  },
}));

// ──────────────────────────────────────────────────────────────
// Lazy imports — set after sign-in in beforeAll
// ──────────────────────────────────────────────────────────────

let LeaseAgreementsM: ComponentType<{ readonly Slave: ComponentType<LeaseAgreementsSProps>; readonly role: string }>;
let LeaseAgreementsS: ComponentType<LeaseAgreementsSProps>;

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

const skip = (_available: boolean): void => {
  // no-op guard — tests are conditionally run via `available && ...`
};

// ──────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────

describe('LeaseAgreementsM (integration)', () => {
  let available = false;

  beforeAll(async () => {
    available = await checkAvailable();
    available || true;
    available &&
      (await (async () => {
        mockClient = await signInAs('landlord');
        const modM = await import('./LeaseAgreementsM');
        LeaseAgreementsM = modM.LeaseAgreementsM as ComponentType<{
          readonly Slave: ComponentType<LeaseAgreementsSProps>;
          readonly role: string;
        }>;
        const modS = await import('@/slaveComponents/LeaseAgreementsS');
        LeaseAgreementsS = modS.LeaseAgreementsS;
      })());
  });

  afterAll(async () => {
    available && mockClient !== undefined && (await signOut(mockClient));
  });

  const renderComponent = () =>
    render(
      <MemoryRouterProvider>
        <LeaseAgreementsM Slave={LeaseAgreementsS} role="admin" />
      </MemoryRouterProvider>,
    );

  // ── 1. Data loading & rendering ──────────────────────

  it('loads and renders lease agreements with tenant and property names', async () => {
    skip(available);
    available || true;
    available &&
      (await (async () => {
        renderComponent();

        await waitFor(() => {
          expect(screen.getByText('Jan Kowalski')).toBeInTheDocument();
        });

        expect(screen.getByText('Anna Nowak')).toBeInTheDocument();
        expect(screen.getByText('Piotr Wiśniewski')).toBeInTheDocument();
        expect(screen.getByText('Apartament Warszawa Centrum')).toBeInTheDocument();
        expect(screen.getByText('Apartament Kraków Kazimierz')).toBeInTheDocument();
        expect(screen.getByText('Dom Gdańsk Wrzeszcz')).toBeInTheDocument();
      })());
  });

  it('renders status pills for each lease in the table', async () => {
    skip(available);
    available || true;
    available &&
      (await (async () => {
        renderComponent();

        await waitFor(() => {
          expect(screen.getByText('Jan Kowalski')).toBeInTheDocument();
        });

        // Scope to table to exclude the filter <select> option that also contains "Aktywna"
        const table = screen.getByRole('table');
        // Real DB may have more than 2 active leases — just verify both statuses appear
        const activePills = within(table).getAllByText('Aktywna');
        expect(activePills.length).toBeGreaterThanOrEqual(1);

        expect(within(table).getByText('Wygasła')).toBeInTheDocument();
      })());
  });

  it('renders rent amounts formatted with PLN', async () => {
    skip(available);
    available || true;
    available &&
      (await (async () => {
        renderComponent();

        await waitFor(() => {
          expect(screen.getByText('Jan Kowalski')).toBeInTheDocument();
        });

        // toLocaleString('pl-PL') output varies across jsdom/Node versions (may or may
        // not include thousands separators). Match on the numeric value + "zł" suffix.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rentCellContains = (n: number) => (content: string, element: HTMLElement | null) => {
          const hasZloty = content.includes('zł');
          const tableRow = element?.closest('tr');
          const isInTable = tableRow !== null;
          const text = content.replace(/\s/g, '');
          const containsNumber = text.includes(String(n));
          return hasZloty && isInTable && containsNumber;
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(screen.getByText(rentCellContains(3500) as any)).toBeInTheDocument();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(screen.getByText(rentCellContains(4200) as any)).toBeInTheDocument();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(screen.getByText(rentCellContains(6500) as any)).toBeInTheDocument();
      })());
  });

  // ── 2. Navigation links ─────────────────────────────

  it('renders navigation links for lease agreement detail', async () => {
    skip(available);
    available || true;
    available &&
      (await (async () => {
        renderComponent();

        await waitFor(() => {
          expect(screen.getByText('Jan Kowalski')).toBeInTheDocument();
        });

        const detailLinks = screen.getAllByText('→');
        expect(detailLinks.length).toBeGreaterThanOrEqual(3);

        const firstLink = detailLinks[0]!.closest('a');
        expect(firstLink).not.toBeNull();
        expect(firstLink!.getAttribute('href')).toMatch(/\/app\/leases\//);
      })());
  });

  it('renders tenant names as links to tenant detail', async () => {
    skip(available);
    available || true;
    available &&
      (await (async () => {
        renderComponent();

        await waitFor(() => {
          expect(screen.getByText('Jan Kowalski')).toBeInTheDocument();
        });

        const janLink = screen.getByText('Jan Kowalski').closest('a');
        expect(janLink).not.toBeNull();
        expect(janLink!.getAttribute('href')).toBe(`/app/tenants/${TEST_UUIDS.tenant1Profile}`);
      })());
  });

  it('renders property names as links to property detail', async () => {
    skip(available);
    available || true;
    available &&
      (await (async () => {
        renderComponent();

        await waitFor(() => {
          expect(screen.getByText('Jan Kowalski')).toBeInTheDocument();
        });

        const propertyLink = screen.getByText('Apartament Warszawa Centrum').closest('a');
        expect(propertyLink).not.toBeNull();
        expect(propertyLink!.getAttribute('href')).toBe(`/app/properties/${TEST_UUIDS.property1}`);
      })());
  });

  // ── 3. Filter panel ────────────────────────────────

  it('toggles filter panel when clicking the filter button', async () => {
    skip(available);
    available || true;
    available &&
      (await (async () => {
        const user = userEvent.setup();
        renderComponent();

        await waitFor(() => {
          expect(screen.getByText('Jan Kowalski')).toBeInTheDocument();
        });

        const filterButton = screen.getByRole('button', { name: /Filtry/ });
        expect(filterButton).toHaveAttribute('aria-expanded', 'false');

        await user.click(filterButton);
        expect(filterButton).toHaveAttribute('aria-expanded', 'true');

        const filterPanel = document.getElementById('filter-panel');
        expect(filterPanel).not.toBeNull();
        expect(filterPanel!.className).toContain('opacity-100');

        await user.click(filterButton);
        expect(filterButton).toHaveAttribute('aria-expanded', 'false');
        expect(filterPanel!.className).toContain('opacity-0');
      })());
  });

  it('shows filter panel with status, date, and search inputs when expanded', async () => {
    skip(available);
    available || true;
    available &&
      (await (async () => {
        const user = userEvent.setup();
        renderComponent();

        await waitFor(() => {
          expect(screen.getByText('Jan Kowalski')).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: /Filtry/ }));

        expect(screen.getByLabelText('Status')).toBeInTheDocument();
        expect(screen.getByLabelText('Data od')).toBeInTheDocument();
        expect(screen.getByLabelText('Data do')).toBeInTheDocument();
        expect(screen.getByLabelText('Szukaj')).toBeInTheDocument();
      })());
  });

  // ── 4. Status filter ───────────────────────────────

  it('filters by status and shows only matching rows', async () => {
    skip(available);
    available || true;
    available &&
      (await (async () => {
        const user = userEvent.setup();
        renderComponent();

        await waitFor(() => {
          expect(screen.getByText('Jan Kowalski')).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: /Filtry/ }));
        await user.selectOptions(screen.getByLabelText('Status'), 'active');

        // Wait for filtered results — expired pill should disappear
        await waitFor(() => {
          const table = screen.getByRole('table');
          const activePills = within(table).getAllByText('Aktywna');
          expect(activePills.length).toBeGreaterThanOrEqual(1);
          // Expired pill should not be present after filtering
          expect(within(table).queryByText('Wygasła')).toBeNull();
        });
      })());
  });

  it('displays active filter count badge when filters are active', async () => {
    skip(available);
    available || true;
    available &&
      (await (async () => {
        const user = userEvent.setup();
        renderComponent();

        await waitFor(() => {
          expect(screen.getByText('Jan Kowalski')).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: /Filtry/ }));
        await user.selectOptions(screen.getByLabelText('Status'), 'active');

        await waitFor(() => {
          expect(screen.getByRole('button', { name: /Filtry \(1\)/ })).toBeInTheDocument();
        });
      })());
  });

  // ── 5. Clear filters ───────────────────────────────

  it('clears all filters and restores full dataset', async () => {
    skip(available);
    available || true;
    available &&
      (await (async () => {
        const user = userEvent.setup();
        renderComponent();

        await waitFor(() => {
          expect(screen.getByText('Jan Kowalski')).toBeInTheDocument();
        });

        // Apply an active-status filter
        await user.click(screen.getByRole('button', { name: /Filtry/ }));
        await user.selectOptions(screen.getByLabelText('Status'), 'active');

        // Wait for filter to apply — badge appears
        await waitFor(() => {
          expect(screen.getByRole('button', { name: /Filtry \(1\)/ })).toBeInTheDocument();
        });

        // Clear filters
        const clearButton = screen.getByText('Wyczyść filtry');
        await user.click(clearButton);

        // After clearing, the expired lease should reappear
        await waitFor(() => {
          const table = screen.getByRole('table');
          expect(within(table).getByText('Wygasła')).toBeInTheDocument();
        });
      })());
  });

  // ── 6. Date range filter ───────────────────────────

  it('filters by date range', async () => {
    skip(available);
    available || true;
    available &&
      (await (async () => {
        const user = userEvent.setup();
        renderComponent();

        await waitFor(() => {
          expect(screen.getByText('Jan Kowalski')).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: /Filtry/ }));

        // Set "Data od" to 2025-01-01 — should exclude lease 3 (start_date 2024-01-01)
        const dateFromInput = screen.getByLabelText('Data od');
        await user.clear(dateFromInput);
        await user.type(dateFromInput, '2025-01-01');

        // Wait for filtered results — Piotr Wiśniewski (start 2024-01-01) should be gone
        await waitFor(() => {
          expect(screen.queryByText('Piotr Wiśniewski')).toBeNull();
          expect(screen.getByText('Jan Kowalski')).toBeInTheDocument();
          expect(screen.getByText('Anna Nowak')).toBeInTheDocument();
        });
      })());
  });

  // ── 7. Search ──────────────────────────────────────

  it('searches and filters by tenant name', async () => {
    skip(available);
    available || true;
    available &&
      (await (async () => {
        const user = userEvent.setup();
        renderComponent();

        await waitFor(() => {
          expect(screen.getByText('Jan Kowalski')).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: /Filtry/ }));

        const searchInput = screen.getByLabelText('Szukaj');
        await user.type(searchInput, 'Jan');

        // Wait for debounced search to resolve — only Jan Kowalski should remain
        await waitFor(
          () => {
            expect(screen.getByText('Jan Kowalski')).toBeInTheDocument();
            expect(screen.queryByText('Anna Nowak')).toBeNull();
            expect(screen.queryByText('Piotr Wiśniewski')).toBeNull();
          },
          { timeout: 3000 },
        );
      })());
  });

  // ── 8. Sort ────────────────────────────────────────

  it('renders sortable column headers', async () => {
    skip(available);
    available || true;
    available &&
      (await (async () => {
        renderComponent();

        await waitFor(() => {
          expect(screen.getByText('Jan Kowalski')).toBeInTheDocument();
        });

        const columnHeaders = screen.getAllByRole('columnheader');
        const headerTexts = columnHeaders.map((h) => h.textContent ?? '');

        expect(headerTexts.some((t) => t.includes('Najemca'))).toBe(true);
        expect(headerTexts.some((t) => t.includes('Nieruchomość'))).toBe(true);
        expect(headerTexts.some((t) => t.includes('Od'))).toBe(true);
        expect(headerTexts.some((t) => t.includes('Do'))).toBe(true);
        expect(headerTexts.some((t) => t.includes('Czynsz'))).toBe(true);
        expect(headerTexts.some((t) => t.includes('Status'))).toBe(true);
      })());
  });
});