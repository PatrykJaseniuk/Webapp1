import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouterProvider } from '@/test-router-utils';
import { TenantsS } from './TenantsS';
import type { TenantsSProps } from '@/masterComponents/TenantsM';

type PageData = Extract<TenantsSProps['asyncData'], { readonly tag: 'fulfilled' }>['data'];
type Row = PageData['rows'][number];

const makeTenant = (overrides?: Partial<Row>): Row => ({
  id: '00000000-0000-0000-0000-000000000001',
  user_id: null,
  first_name: 'Jan',
  last_name: 'Kowalski',
  email: 'jan@example.com',
  phone: '123456789',
  id_document_number: 'ABC123456',
  emergency_contact_name: 'Anna Kowalska',
  emergency_contact_phone: '987654321',
  notes: null,
  tenant_status: 'active',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
});

const noop = (): void => { };

type SortColumn = TenantsSProps['sort']['config']['column'];
const sort = { config: { column: 'last_name' as SortColumn, direction: 'asc' as const }, doSort: noop };

const pagination: TenantsSProps['pagination'] = {
  page: 1,
  pageSize: 20,
  goToPage: noop,
  setPageSize: noop,
  prevPage: noop,
  nextPage: noop,
};

const pageData = (rows: readonly Row[], totalCount: number): PageData => ({ rows, totalCount });

const pendingDataMode: TenantsSProps['asyncData'] = { tag: 'pending' };

const rejectedDataMode: TenantsSProps['asyncData'] = {
  tag: 'rejected',
  message: 'Błąd sieci',
  onRetry: noop,
};

const filter: TenantsSProps['filter'] = {
  config: {},
  doFilter: noop,
};

const navLinkTo = {
  tenant: ({ id, content, style }: { readonly id: string; readonly style: React.CSSProperties; readonly content: string }) =>
    <a href={`#/tenants/${id}`} style={style}>{content}</a>,
  property: ({ id, content, style }: { readonly id: string; readonly style: React.CSSProperties; readonly content: string }) =>
    <a href={`#/properties/${id}`} style={style}>{content}</a>,
};

const meta: Meta<typeof TenantsS> = {
  component: TenantsS,
  title: 'slaveComponents/TenantsS',
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
    filter,
  },
};

export default meta;

type Story = StoryObj<typeof TenantsS>;

export const Pending: Story = {
  args: { asyncData: pendingDataMode },
};

export const Rejected: Story = {
  args: { asyncData: rejectedDataMode },
};

export const Empty: Story = {
  args: { asyncData: { tag: 'fulfilled', data: pageData([], 0) } },
};

export const WithRows: Story = {
  args: {
    asyncData: {
      tag: 'fulfilled',
      data: pageData([
        makeTenant({ id: '1', first_name: 'Jan', last_name: 'Kowalski', tenant_status: 'active' }),
        makeTenant({ id: '2', first_name: 'Anna', last_name: 'Nowak', tenant_status: 'applicant', email: 'anna@example.com' }),
        makeTenant({ id: '3', first_name: 'Piotr', last_name: 'Zieliński', tenant_status: 'past', phone: '555555555' }),
      ], 3),
    },
  },
};