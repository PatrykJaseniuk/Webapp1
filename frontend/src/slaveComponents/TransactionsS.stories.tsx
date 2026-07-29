import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouterProvider } from '@/test-router-utils';
import { TransactionsS } from './TransactionsS';
import type { TransactionsSProps } from '@/masterComponents/TransactionsM';

type Row = Extract<TransactionsSProps['asyncData'], { tag: 'fulfilled' }>['data'][number];

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

const navLinkTo = {
  transaction: ({
    id,
    content,
    style,
    ariaLabel,
  }: {
    readonly id: string;
    readonly style: React.CSSProperties;
    readonly content: string;
    readonly ariaLabel?: string;
  }) => (
    <a href={`#/transactions/${id}`} style={style} aria-label={ariaLabel}>
      {content}
    </a>
  ),
  property: ({
    id,
    content,
    style,
  }: {
    readonly id: string;
    readonly style: React.CSSProperties;
    readonly content: string;
  }) => (
    <a href={`#/properties/${id}`} style={style}>
      {content}
    </a>
  ),
  lease: ({
    id,
    content,
    style,
  }: {
    readonly id: string;
    readonly style: React.CSSProperties;
    readonly content: string;
  }) => (
    <a href={`#/leases/${id}`} style={style}>
      {content}
    </a>
  ),
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
  },
};

export default meta;

type Story = StoryObj<typeof TransactionsS>;

export const Pending: Story = {
  args: { asyncData: { tag: 'pending' } },
};

export const Rejected: Story = {
  args: { asyncData: { tag: 'rejected', message: 'Błąd sieci', onRetry: noop } },
};

export const Empty: Story = {
  args: { asyncData: { tag: 'fulfilled', data: [], isFetching: false } },
};

export const WithRows: Story = {
  args: {
    asyncData: {
      tag: 'fulfilled',
      isFetching: false,
      data: [
        makeTransaction({ id: '1', type: 'rent', amount: 2500, transaction_status: 'paid', due_date: '2026-01-15', description: 'Czynsz za styczeń' }),
        makeTransaction({ id: '2', type: 'utility', amount: -320.5, transaction_status: 'pending', due_date: '2026-02-01', description: 'Prąd i gaz', properties: null, property_id: null }),
        makeTransaction({ id: '3', type: 'payment', amount: 2820.5, transaction_status: 'overdue', due_date: '2026-01-10', description: 'Wpłata od najemcy', lease_agreements: null, lease_id: null }),
      ],
    },
  },
};

export const Fetching: Story = {
  args: {
    asyncData: {
      tag: 'fulfilled',
      isFetching: true,
      data: [
        makeTransaction({ id: '1', type: 'rent', amount: 2500, transaction_status: 'paid' }),
        makeTransaction({ id: '2', type: 'expense', amount: -150, transaction_status: 'pending' }),
      ],
    },
  },
};