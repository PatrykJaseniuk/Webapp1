import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouterProvider } from '@/test-router-utils';
import { within, expect } from 'storybook/test';
import { TransactionsS } from './TransactionsS';
import type { TransactionsSProps } from '@/masterComponents/TransactionsM';

type PageData = Extract<TransactionsSProps['asyncData'], { readonly tag: 'fulfilled' }>['data'];
type Row = PageData['rows'][number];

const makeTransaction = (overrides?: Partial<Row>): Row =>
  ({
    id: '00000000-0000-0000-0000-000000000001',
    property_id: '00000000-0000-0000-0000-000000000010',
    lease_id: '00000000-0000-0000-0000-000000000020',
    created_by: '00000000-0000-0000-0000-000000000099',
    due_date: '2026-01-15',
    type: 'rent',
    description: 'Czynsz za styczeń',
    amount: 2500,
    transaction_status: 'pending',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    properties: { name: 'Apartament Rynek 1' },
    lease_agreements: { start_date: '2025-06-01' },
    ...overrides,
  }) as Row;

const noop = (): void => {};

type SortColumn = TransactionsSProps['sort']['config']['column'];
const sort = { config: { column: 'due_date' as SortColumn, direction: 'desc' as const }, doSort: noop };

const pagination: TransactionsSProps['pagination'] = {
  page: 1,
  pageSize: 20,
  prevPage: noop,
  nextPage: noop,
};

const pageData = (rows: readonly Row[], totalCount: number): PageData => ({ rows, totalCount });

const navLinkTo: TransactionsSProps['navLinkTo'] = {
  transaction: ({ id, content, style, ariaLabel }) =>
    <a href={`#/transactions/${id}`} style={style} aria-label={ariaLabel}>{content}</a>,
  property: ({ id, content, style }) =>
    <a href={`#/properties/${id}`} style={style}>{content}</a>,
  lease: ({ id, content, style }) =>
    <a href={`#/leases/${id}`} style={style}>{content}</a>,
};

const meta: Meta<typeof TransactionsS> = {
  component: TransactionsS,
  title: 'slaveComponents/TransactionsS',
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
  },
};

export default meta;

type Story = StoryObj<typeof TransactionsS>;

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
    await expect(canvas.getByText('Brak transakcji do wyświetlenia')).toBeVisible();
  },
};

export const WithRows: Story = {
  args: {
    asyncData: {
      tag: 'fulfilled',
      isFetching: false,
      data: pageData([
        makeTransaction({ id: '1', type: 'rent', amount: 2500, transaction_status: 'paid', due_date: '2026-01-15', description: 'Czynsz za styczeń' }),
        makeTransaction({ id: '2', type: 'utility', amount: 320.5, transaction_status: 'pending', due_date: '2026-02-01', description: 'Prąd i gaz — bardzo długa nazwa która powinna być obcięta przez truncate', properties: { name: 'Kawalerka Gdańska 12' }, property_id: 'prop-2' }),
        makeTransaction({ id: '3', type: 'payment', amount: 2820.5, transaction_status: 'overdue', due_date: '2026-01-10', description: 'Wpłata od najemcy', lease_agreements: null, lease_id: null }),
        makeTransaction({ id: '4', type: 'expense', amount: 150, transaction_status: 'paid', due_date: '2026-01-05', description: 'Naprawa pieca' }),
        makeTransaction({ id: '5', type: 'fee', amount: 45, transaction_status: 'pending', due_date: '2026-01-20', description: 'Opłata administracyjna' }),
        makeTransaction({ id: '6', type: 'withdraw', amount: 800, transaction_status: 'paid', due_date: '2026-01-08', description: 'Wypłata dla właściciela' }),
      ], 6),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('row')).toHaveLength(7); // header + 6 data rows
    const navLinks = canvas.getAllByRole('link', { name: /Szczegóły transakcji/i });
    await expect(navLinks).toHaveLength(6);
  },
};

export const Fetching: Story = {
  args: {
    asyncData: {
      tag: 'fulfilled',
      isFetching: true,
      data: pageData([
        makeTransaction({ id: '1', type: 'rent', amount: 2500, transaction_status: 'paid' }),
        makeTransaction({ id: '2', type: 'expense', amount: 150, transaction_status: 'pending' }),
      ], 2),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('progressbar')).toBeVisible();
    await expect(canvas.getAllByRole('row')).toHaveLength(3); // header + 2 rows visible during refetch
  },
};

export const SingleTransaction: Story = {
  args: {
    asyncData: {
      tag: 'fulfilled',
      isFetching: false,
      data: pageData([
        makeTransaction({ id: '1', type: 'rent', amount: 2500, transaction_status: 'paid', due_date: '2026-01-15' }),
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
        makeTransaction({ id: '1', type: 'rent', amount: 2500, transaction_status: 'paid', description: 'Czynsz' }),
        makeTransaction({ id: '2', type: 'utility', amount: 320, transaction_status: 'pending', description: 'Media' }),
        makeTransaction({ id: '3', type: 'expense', amount: 500, transaction_status: 'paid', description: 'Wydatek' }),
        makeTransaction({ id: '4', type: 'payment', amount: 2820, transaction_status: 'paid', description: 'Wpłata' }),
        makeTransaction({ id: '5', type: 'withdraw', amount: 1000, transaction_status: 'paid', description: 'Wypłata' }),
        makeTransaction({ id: '6', type: 'fee', amount: 45, transaction_status: 'pending', description: 'Opłata' }),
        makeTransaction({ id: '7', type: 'other', amount: -50, transaction_status: 'overdue', description: 'Inne (ujemne)' }),
      ], 7),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('row')).toHaveLength(8); // header + 7 rows
  },
};