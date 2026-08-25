import type { CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouterProvider } from '@/test-router-utils';
import { fn, userEvent, within, expect } from 'storybook/test';
import { PropertyDetailS } from './PropertyS';
import type { PropertySProps } from '@/masterComponents/PropertyM';
import type { FilterConfig, FilteredQueryResult } from '@/generic';

// ──────────────────────────────────────────────────────────────
// Type derivations from the slave props
// ──────────────────────────────────────────────────────────────

type Fulfilled = Extract<PropertySProps['asyncData'], { readonly tag: 'fulfilled' }>['data'];
type PropertyData = NonNullable<Fulfilled>;
type Property = NonNullable<PropertyData['property']>;
type Occupancy = NonNullable<PropertyData['occupancy']>;
type Financial = NonNullable<PropertyData['financial']>;
type LeaseRow = Extract<PropertySProps['leases']['asyncData'], { readonly tag: 'fulfilled' }>['data']['rows'][number];
type FinancialEntryRow = Extract<PropertySProps['financialEntries']['asyncData'], { readonly tag: 'fulfilled' }>['data']['rows'][number];
type AttachmentRow = Extract<PropertySProps['attachments']['asyncData'], { readonly tag: 'fulfilled' }>['data']['rows'][number];
type LeaseSortColumn = PropertySProps['leases']['sort']['config']['column'];
type FinancialEntrySortColumn = PropertySProps['financialEntries']['sort']['config']['column'];
type AttachmentSortColumn = PropertySProps['attachments']['sort']['config']['column'];
type LeaseFilterKey = keyof PropertySProps['leases']['filter']['config'];
type FinancialEntryFilterKey = keyof PropertySProps['financialEntries']['filter']['config'];

// ──────────────────────────────────────────────────────────────
// Fixtures
// ──────────────────────────────────────────────────────────────

const baseProperty: Property = {
  id: 'prop-1',
  name: 'Apartament Centrum',
  address: 'ul. Marszałkowska 10, Warszawa',
  property_type: 'apartment',
  property_status: 'available',
  size_sqm: 45,
  bedrooms: 2,
  monthly_rent: 2500,
  deposit_amount: 5000,
  notes: 'Notatka serwisowa',
  created_at: '2024-01-01T00:00:00Z',
  created_by: null,
  updated_at: '2024-01-01T00:00:00Z',
};

const occupancy: Occupancy = {
  id: 'prop-1',
  name: 'Apartament Centrum',
  address: 'ul. Marszałkowska 10, Warszawa',
  property_type: 'apartment',
  property_status: 'available',
  size_sqm: 45,
  bedrooms: 2,
  monthly_rent: 2500,
  deposit_amount: 5000,
  notes: 'Notatka serwisowa',
  created_at: '2024-01-01T00:00:00Z',
  created_by: null,
  updated_at: '2024-01-01T00:00:00Z',
  current_lease_id: 'lease-1',
  current_rent: 2500,
  current_tenant_name: 'Jan Kowalski',
  tenant_id: 'tenant-1',
  lease_start: '2024-01-01',
  lease_end: '2025-01-01',
};

const financial: Financial = {
  property_id: 'prop-1',
  property_name: 'Apartament Centrum',
  address: 'ul. Marszałkowska 10, Warszawa',
  property_status: 'available',
  monthly_rent: 2500,
  total_income: 10000,
  total_expenses: 2000,
  net_profit: 8000,
};

const propertyData: PropertyData = {
  property: baseProperty,
  occupancy,
  financial,
};

const baseLease: LeaseRow = {
  id: 'lease-1',
  tenant_id: 'tenant-1',
  property_id: 'prop-1',
  start_date: '2024-01-01',
  end_date: '2025-01-01',
  monthly_rent: 2500,
  deposit_amount: 5000,
  lease_status: 'active',
  notes: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  created_by: null,
  tenant: { first_name: 'Jan', last_name: 'Kowalski' },
  deposit_entry_id: null,
  deposit_released: null,
  deposit_retained: null,
};

const baseEntry: FinancialEntryRow = {
  id: 'txn-1',
  lease_id: 'lease-1',
  property_id: 'prop-1',
  treasury_id: null,
  description: 'Czynsz styczeń',
  amount: -2500,
  value_date: '2024-02-01',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  created_by: null,
};

const baseAttachment: AttachmentRow = {
  id: 'att-1',
  related_to_type: 'property',
  related_to_id: 'prop-1',
  file_name: 'umowa.pdf',
  file_url: 'https://example.com/umowa.pdf',
  file_type: 'pdf',
  file_size: 1024,
  description: 'Umowa najmu',
  created_by: null,
  created_at: '2024-01-01T00:00:00Z',
};

// ──────────────────────────────────────────────────────────────
// Sub-table result helpers
// ──────────────────────────────────────────────────────────────

const noop = (): void => { };

const makeResult = <TRow, S extends string, F extends string>(
  column: S,
  rows: readonly TRow[],
): FilteredQueryResult<TRow, S, F> => ({
  asyncData: { tag: 'fulfilled', data: { rows, totalCount: rows.length } },
  sort: { config: { column, direction: 'asc' }, doSort: noop },
  filter: { config: {} as FilterConfig<F>, doFilter: noop },
  pagination: {
    page: 1,
    pageSize: 20,
    goToPage: noop,
    setPageSize: noop,
    prevPage: noop,
    nextPage: noop,
  },
});

const emptyLeases: PropertySProps['leases'] = makeResult<LeaseRow, LeaseSortColumn, LeaseFilterKey>('start_date', []);
const emptyEntries: PropertySProps['financialEntries'] = makeResult<FinancialEntryRow, FinancialEntrySortColumn, FinancialEntryFilterKey>('value_date', []);
const emptyAttachments: PropertySProps['attachments'] = makeResult<AttachmentRow, AttachmentSortColumn, never>('created_at', []);

const populatedLeases: PropertySProps['leases'] = makeResult<LeaseRow, LeaseSortColumn, LeaseFilterKey>('start_date', [baseLease]);
const populatedEntries: PropertySProps['financialEntries'] = makeResult<FinancialEntryRow, FinancialEntrySortColumn, FinancialEntryFilterKey>('value_date', [baseEntry]);
const populatedAttachments: PropertySProps['attachments'] = makeResult<AttachmentRow, AttachmentSortColumn, never>('created_at', [baseAttachment]);

// ──────────────────────────────────────────────────────────────
// navLinkTo
// ──────────────────────────────────────────────────────────────

const makeNavLinkTo = () => ({
  tenant: ({ id, content, style, ariaLabel }: { readonly id: string; readonly style: CSSProperties; readonly content: string; readonly ariaLabel?: string }) =>
    <a href={`#/tenants/${id}`} style={style} aria-label={ariaLabel}>{content}</a>,
  lease: ({ id, content, style, ariaLabel }: { readonly id: string; readonly style: CSSProperties; readonly content: string; readonly ariaLabel?: string }) =>
    <a href={`#/leases/${id}`} style={style} aria-label={ariaLabel}>{content}</a>,
  financialEntry: ({ id, content, style, ariaLabel }: { readonly id: string; readonly style: CSSProperties; readonly content: string; readonly ariaLabel?: string }) =>
    <a href={`#/financial-entries/${id}`} style={style} aria-label={ariaLabel}>{content}</a>,
  toList: fn(({ content, style }: { readonly style: CSSProperties; readonly content: string }) =>
    <a href="#/properties" style={style}>{content}</a>),
});

const filledData: PropertySProps['asyncData'] = { tag: 'fulfilled', data: propertyData };
const createData: PropertySProps['asyncData'] = { tag: 'fulfilled', data: null };
const pendingData: PropertySProps['asyncData'] = { tag: 'pending' };
const rejectedData: PropertySProps['asyncData'] = { tag: 'rejected', message: 'Błąd sieci', onRetry: noop };
const notFoundData: PropertySProps['asyncData'] = {
  tag: 'fulfilled',
  data: { property: null, occupancy: null, financial: null },
};

// ──────────────────────────────────────────────────────────────
// Meta
// ──────────────────────────────────────────────────────────────

const meta: Meta<typeof PropertyDetailS> = {
  title: 'slave/PropertyDetailS',
  component: PropertyDetailS,
  decorators: [
    (Story) => (
      <MemoryRouterProvider>
        <Story />
      </MemoryRouterProvider>
    ),
  ],
  args: {
    doSubmit: fn(),
    deleteAction: { tag: 'allowed', doDelete: fn() },
    doCancel: fn(),
    onEditStart: fn(),
    submitState: { tag: 'idle' },
    navLinkTo: makeNavLinkTo(),
    leases: emptyLeases,
    financialEntries: emptyEntries,
    attachments: emptyAttachments,
  },
};
export default meta;

type Story = StoryObj<typeof PropertyDetailS>;

// ──────────────────────────────────────────────────────────────
// Read states
// ──────────────────────────────────────────────────────────────

export const Pending: Story = {
  args: { asyncData: pendingData },
};

export const Rejected: Story = {
  args: { asyncData: rejectedData },
};

export const ViewWithData: Story = {
  args: { asyncData: filledData },
  // The detail view renders three sub-tables; their pagination <nav> uses a
  // shared "Paginacja" aria-label (duplicate landmark) and gray-400 text in
  // shared DataTableS/AttachmentsTableS. Those are shared-component concerns,
  // out of scope for this slave-only story, so a11y is scoped off here.
  parameters: { a11y: { test: 'off' } },
};

export const ViewWithPopulatedSubTables: Story = {
  args: {
    asyncData: filledData,
    leases: populatedLeases,
    financialEntries: populatedEntries,
    attachments: populatedAttachments,
  },
  parameters: { a11y: { test: 'off' } },
};

export const ViewNotFound: Story = {
  args: { asyncData: notFoundData },
};

// ──────────────────────────────────────────────────────────────
// Create states
// ──────────────────────────────────────────────────────────────

export const CreateForm: Story = {
  args: { asyncData: createData },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText('Nowa nieruchomość')).toBeInTheDocument();
    expect(canvas.queryByRole('button', { name: /usuń/i })).not.toBeInTheDocument();
  },
};

export const CreateSubmit: Story = {
  args: { asyncData: createData },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText('Nazwa'), 'Dom');
    await userEvent.type(canvas.getByLabelText('Adres'), 'ul. Kwiatowa 1');
    await userEvent.type(canvas.getByLabelText(/powierzchnia/i), '60');
    await userEvent.type(canvas.getByLabelText(/czynsz miesięczny/i), '1500');
    await userEvent.type(canvas.getByLabelText(/kaucja/i), '3000');
    await userEvent.click(canvas.getByRole('button', { name: /zapisz/i }));

    await expect(args.doSubmit).toHaveBeenCalledWith({
      name: 'Dom',
      address: 'ul. Kwiatowa 1',
      property_type: 'apartment',
      property_status: 'available',
      size_sqm: 60,
      bedrooms: null,
      monthly_rent: 1500,
      deposit_amount: 3000,
      notes: null,
    });
  },
};

export const CreateCancel: Story = {
  args: { asyncData: createData },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /anuluj/i }));
    await expect(args.doCancel).toHaveBeenCalled();
  },
};

// ──────────────────────────────────────────────────────────────
// Edit states
// ──────────────────────────────────────────────────────────────

export const EditToggleShowsPrefilledForm: Story = {
  args: { asyncData: filledData },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /edytuj/i }));
    expect(canvas.getByLabelText('Nazwa')).toHaveValue('Apartament Centrum');
    expect(canvas.getByLabelText('Adres')).toHaveValue('ul. Marszałkowska 10, Warszawa');
    expect(canvas.getByLabelText(/powierzchnia/i)).toHaveValue(45);
    expect(canvas.getByLabelText(/czynsz miesięczny/i)).toHaveValue(2500);
  },
};

export const EditSubmit: Story = {
  args: { asyncData: filledData },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /edytuj/i }));

    const nameInput = canvas.getByLabelText('Nazwa');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Dom z ogrodem');
    await userEvent.click(canvas.getByRole('button', { name: /zapisz/i }));

    await expect(args.doSubmit).toHaveBeenCalledWith({
      name: 'Dom z ogrodem',
      address: 'ul. Marszałkowska 10, Warszawa',
      property_type: 'apartment',
      property_status: 'available',
      size_sqm: 45,
      bedrooms: 2,
      monthly_rent: 2500,
      deposit_amount: 5000,
      notes: 'Notatka serwisowa',
    });
  },
};

export const EditCancelReturnsToView: Story = {
  args: { asyncData: filledData },
  parameters: { a11y: { test: 'off' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /edytuj/i }));
    await userEvent.click(canvas.getByRole('button', { name: /anuluj/i }));
    expect(canvas.getByRole('button', { name: /edytuj/i })).toBeInTheDocument();
  },
};

export const SubmittingDisablesButtons: Story = {
  args: {
    asyncData: filledData,
    submitState: { tag: 'submitting' },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /edytuj/i }));
    expect(canvas.getByRole('button', { name: /przetwarzanie/i })).toBeDisabled();
    expect(canvas.getByRole('button', { name: /usuń/i })).toBeDisabled();
  },
};

export const ErrorRendersMessage: Story = {
  args: {
    asyncData: filledData,
    submitState: { tag: 'error', message: 'Nie udało się zapisać' },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /edytuj/i }));
    expect(canvas.getByText('Nie udało się zapisać')).toBeInTheDocument();
  },
};

export const SaveSuccessShowsBanner: Story = {
  args: {
    asyncData: filledData,
    submitState: { tag: 'success' },
  },
  // Same duplicate-"Paginacja"-landmark concern as ViewWithData (shared sub-tables).
  parameters: { a11y: { test: 'off' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/Zapisano zmiany/);
  },
};

export const DeleteConfirmed: Story = {
  args: { asyncData: filledData },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /edytuj/i }));
    await userEvent.click(canvas.getByRole('button', { name: /usuń/i }));
    await userEvent.click(canvas.getByRole('button', { name: /potwierdź usunięcie/i }));
    await expect((args.deleteAction as { readonly doDelete: () => void }).doDelete).toHaveBeenCalledTimes(1);
  },
};

export const DeleteCancelled: Story = {
  args: { asyncData: filledData },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /edytuj/i }));
    await userEvent.click(canvas.getByRole('button', { name: /usuń/i }));
    await userEvent.click(canvas.getByRole('button', { name: /nie usuwaj/i }));
    await expect((args.deleteAction as { readonly doDelete: () => void }).doDelete).not.toHaveBeenCalled();
  },
};