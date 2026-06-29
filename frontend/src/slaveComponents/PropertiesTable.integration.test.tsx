import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PropertiesTable } from './PropertiesTable';
import type { Database } from '@/backendConnector';

type PropertyRow = Database['public']['Tables']['properties']['Row'];

const makeRow = (overrides?: Partial<PropertyRow>): PropertyRow => ({
  id: 'prop-1',
  name: 'Test Property',
  address: 'ul. Testowa 1',
  property_type: 'apartment',
  property_status: 'available',
  monthly_rent: 2000,
  deposit_amount: 4000,
  size_sqm: 50.5,
  bedrooms: 2,
  notes: null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  created_by: 'user-1',
  ...overrides,
});

describe('PropertiesTable (integration)', () => {
  it('shows empty message when no properties', () => {
    render(<PropertiesTable properties={[]} onDelete={vi.fn()} />);

    expect(screen.getByText('Brak nieruchomości.')).toBeInTheDocument();
  });

  it('renders property data in table rows', () => {
    const properties: readonly PropertyRow[] = [
      makeRow({ id: 'p1', name: 'Mieszkanie Centrum', address: 'Rynek 5', monthly_rent: 2500 }),
    ];

    render(<PropertiesTable properties={properties} onDelete={vi.fn()} />);

    expect(screen.getByText('Mieszkanie Centrum')).toBeInTheDocument();
    expect(screen.getByText('Rynek 5')).toBeInTheDocument();
    expect(screen.getByText('2500 zł')).toBeInTheDocument();
  });

  it('shows property type label from TYPE_LABEL map', () => {
    const properties: readonly PropertyRow[] = [makeRow({ id: 'p1', property_type: 'house' })];

    render(<PropertiesTable properties={properties} onDelete={vi.fn()} />);

    expect(screen.getByText('Dom')).toBeInTheDocument();
  });

  it('shows property status label from STATUSB_LABEL map', () => {
    const properties: readonly PropertyRow[] = [makeRow({ id: 'p1', property_status: 'occupied' })];

    render(<PropertiesTable properties={properties} onDelete={vi.fn()} />);

    expect(screen.getByText('Zajęta')).toBeInTheDocument();
  });

  it('renders Edytuj link with correct href', () => {
    const properties: readonly PropertyRow[] = [makeRow({ id: 'prop-42' })];

    render(<PropertiesTable properties={properties} onDelete={vi.fn()} />);

    const editLink = screen.getByText('Edytuj');
    expect(editLink.closest('a')).toHaveAttribute('href', '#/properties/prop-42');
  });

  it('calls onDelete with the correct id when Usuń is clicked', async () => {
    const onDelete = vi.fn();
    const properties: readonly PropertyRow[] = [makeRow({ id: 'prop-to-delete' })];

    render(<PropertiesTable properties={properties} onDelete={onDelete} />);

    const user = userEvent.setup();
    await user.click(screen.getByText('Usuń'));

    expect(onDelete).toHaveBeenCalledWith('prop-to-delete');
  });

  it('renders multiple rows for multiple properties', () => {
    const properties: readonly PropertyRow[] = [
      makeRow({ id: 'p1', name: 'A' }),
      makeRow({ id: 'p2', name: 'B' }),
      makeRow({ id: 'p3', name: 'C' }),
    ];

    render(<PropertiesTable properties={properties} onDelete={vi.fn()} />);

    const rows = screen.getAllByRole('row');
    // 1 header + 3 data rows
    expect(rows).toHaveLength(4);
  });
});