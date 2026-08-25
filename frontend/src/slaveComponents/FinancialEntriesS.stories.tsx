import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouterProvider } from '@/test-router-utils';
import { within, expect } from 'storybook/test';
import { FinancialEntriesS } from './FinancialEntriesS';
import type { FinancialEntriesSProps } from '@/masterComponents/FinancialEntriesM';

type PageData = Extract<FinancialEntriesSProps['asyncData'], { readonly tag: 'fulfilled' }>['data'];
type Row = PageData['rows'][number];

const makeEntry = (overrides?: Partial<Row>): Row =>
  ({
    id: '00000000-0000-0000-0000-000000000001',
    property_id: '00000000-0000-0000-0000-000000000010',
    lease_id: '00000000-0000-0000-0000-000000000020',
    created_by: '00000000-0000-0000-0000-000000000099',
    value_date: '2026-01-15',
    description: 'Czynsz za styczeń',
    amount: 2500,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    property: { name: 'Apartament Rynek 1' },
    lease_agreement: { start_date: '2025-06-01' },
    ...overrides,
  }) as Row;

const noop = (): void => {};

type SortColumn = FinancialEntriesSProps['sort']['config']['column'];
const sort = { config: { column: 'value_date' as SortColumn, direction: 'desc' as const }, doSort: noop };

const pagination: FinancialEntriesSProps['pagination'] = {
  page: 1,
  pageSize: 20,
  goToPage: noop,
  setPageSize: noop,
  prevPage: noop,
  nextPage: noop,
};

const pageData = (rows: readonly Row[], totalCount: number): PageData => ({ rows, totalCount });

const navLinkTo: FinancialEntriesSProps['navLinkTo'] = {
  financialEntry: ({ id, content, style, ariaLabel }) =>
    <a href={`#/financial-entries/${id}`} style={style} aria-label={ariaLabel}>{content}</a>,
  property: ({ id, content, style }) =>
    <a href={`#/properties/${id}`} style={style}>{content}</a>,
  lease: ({ id, content, style }) =>
    <a href={`#/leases/${id}`} style={style}>{content}</a>,
};

const meta: Meta<typeof FinancialEntriesS> = {
  component: FinancialEntriesS,
  title: 'slaveComponents/FinancialEntriesS',
  decorators: [
    (Story) => (
      <MemoryRouterProvider>
        <Story />
      </MemoryRouterProvider>
    ),
  ],
  args: {
    navLinkTo,
    sort,
    pagination,
    filter: {
      config: {},
      doFilter: noop,
    },
  },
};

export default meta;

type Story = StoryObj<typeof FinancialEntriesS>;

export const Pending: Story = {
  args: { asyncData: { tag: 'pending' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('progressbar')).toBeVisible();
  },
};

export const Rejected: Story = {
  args: { asyncData: { tag: 'rejected', message: 'Błąd sieci', onRetry: noop } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Błąd sieci')).toBeVisible();
    await expect(canvas.getByRole('button', { name: /spróbuj ponownie/i })).toBeVisible();
  },
};

export const Empty: Story = {
  args: { asyncData: { tag: 'fulfilled', data: pageData([], 0), isFetching: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Brak zapisów finansowych')).toBeVisible();
  },
};

export const WithRows: Story = {
  args: {
    asyncData: {
      tag: 'fulfilled',
      isFetching: false,
      data: pageData([
        makeEntry({ id: '1', amount: 2500, value_date: '2026-01-15', description: 'Czynsz za styczeń' }),
        makeEntry({ id: '2', amount: 320.5, value_date: '2026-02-01', description: 'Prąd i gaz — bardzo długa nazwa która powinna być obcięta przez truncate', property: { name: 'Kawalerka Gdańska 12' }, property_id: 'prop-2' }),
        makeEntry({ id: '3', amount: 2820.5, value_date: '2026-01-10', description: 'Wpłata od najemcy', lease_agreement: null, lease_id: null }),
        makeEntry({ id: '4', amount: 150, value_date: '2026-01-05', description: 'Naprawa pieca' }),
        makeEntry({ id: '5', amount: 45, value_date: '2026-01-20', description: 'Opłata administracyjna' }),
        makeEntry({ id: '6', amount: 800, value_date: '2026-01-08', description: 'Wypłata dla właściciela' }),
      ], 6),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('row')).toHaveLength(7); // header + 6 data rows
    const navLinks = canvas.getAllByRole('link', { name: /Szczegóły zapisu finansowego/i });
    await expect(navLinks).toHaveLength(6);
  },
};

export const Fetching: Story = {
  args: {
    asyncData: {
      tag: 'fulfilled',
      isFetching: true,
      data: pageData([
        makeEntry({ id: '1', amount: 2500, }),
        makeEntry({ id: '2', amount: 150, }),
      ], 2),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('progressbar')).toBeVisible();
    await expect(canvas.getAllByRole('row')).toHaveLength(3); // header + 2 rows visible during refetch
  },
};

export const SingleEntry: Story = {
  args: {
    asyncData: {
      tag: 'fulfilled',
      isFetching: false,
      data: pageData([
        makeEntry({ id: '1', amount: 2500, value_date: '2026-01-15' }),
      ], 1),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('row')).toHaveLength(2); // header + 1 row
  },
};

export const AllTypes: Story = {
  args: {
    asyncData: {
      tag: 'fulfilled',
      isFetching: false,
      data: pageData([
        makeEntry({ id: '1', amount: 2500, description: 'Czynsz' }),
        makeEntry({ id: '2', amount: 320, description: 'Media' }),
        makeEntry({ id: '3', amount: 500, description: 'Wydatek' }),
        makeEntry({ id: '4', amount: 2820, description: 'Wpłata' }),
        makeEntry({ id: '5', amount: 1000, description: 'Wypłata' }),
        makeEntry({ id: '6', amount: 45, description: 'Opłata' }),
        makeEntry({ id: '7', amount: -50, description: 'Inne (ujemne)' }),
      ], 7),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('row')).toHaveLength(8); // header + 7 rows
  },
};