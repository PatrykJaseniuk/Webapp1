import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouterProvider } from '@/test-router-utils';
import { PropertiesS } from './PropertiesS';
import type { PropertiesSProps } from '@/masterComponents/PropertiesM';

type PageData = Extract<PropertiesSProps['asyncData'], { readonly tag: 'fulfilled' }>['data'];
type Row = PageData['rows'][number];

const property: Row = {
  id: '1',
  name: 'Apartament Centrum',
  address: 'ul. Marszałkowska 10, Warszawa',
  property_type: 'apartment',
  property_status: 'available',
  monthly_rent: 2500,
  deposit_amount: 5000,
  size_sqm: 45,
  bedrooms: 2,
  notes: null,
  created_at: '2024-01-01T00:00:00Z',
  created_by: null,
  updated_at: '2024-01-01T00:00:00Z',
  current_tenant_name: 'Jan Kowalski',
  tenant_id: 'tenant-1',
  current_lease_id: 'lease-1',
  current_rent: null,
  lease_start: null,
  lease_end: null,
};

const manyProperties: readonly Row[] = [
  property,
  { ...property, id: '2', name: 'Dom z ogrodem', property_type: 'house', monthly_rent: 5000, current_tenant_name: null, tenant_id: null, current_lease_id: null },
  { ...property, id: '3', name: 'Lokal użytkowy', property_type: 'commercial', property_status: 'inactive', current_tenant_name: null, tenant_id: null, current_lease_id: null },
];

const noop = (): void => { };

type SortColumn = PropertiesSProps['sort']['config']['column'];
const sort = { config: { column: 'name' as SortColumn, direction: 'asc' as const }, doSort: noop };

const pagination: PropertiesSProps['pagination'] = {
  page: 1,
  pageSize: 20,
  goToPage: noop,
  setPageSize: noop,
  prevPage: noop,
  nextPage: noop,
};

const pageData = (rows: readonly Row[], totalCount: number): PageData => ({ rows, totalCount });

const pendingDataMode: PropertiesSProps['asyncData'] = { tag: 'pending' };

const rejectedDataMode: PropertiesSProps['asyncData'] = {
  tag: 'rejected',
  message: 'Błąd sieci',
  onRetry: noop,
};

const navLinkTo = {
  property: ({ id, content, style }: { readonly id: string; readonly style: React.CSSProperties; readonly content: string }) =>
    <a href={`#/properties/${id}`} style={style}>{content}</a>,
  tenant: ({ id, content, style }: { readonly id: string; readonly style: React.CSSProperties; readonly content: string }) =>
    <a href={`#/tenants/${id}`} style={style}>{content}</a>,
};

const filter: PropertiesSProps['filter'] = {
  text: '',
  propertyType: '',
  propertyStatus: '',
  setText: noop,
  setPropertyType: noop,
  setPropertyStatus: noop,
};

const meta: Meta<typeof PropertiesS> = {
  title: 'slave/PropertiesS',
  component: PropertiesS,
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
    clearFilter: noop,
    isFilterActive: false,
    activeFilterCount: 0,
    filterResetKey: 0,
  },
};
export default meta;

type Story = StoryObj<typeof PropertiesS>;

export const Pending: Story = {
  args: { asyncData: pendingDataMode },
};

export const Rejected: Story = {
  args: { asyncData: rejectedDataMode },
};

export const Empty: Story = {
  args: { asyncData: { tag: 'fulfilled', data: pageData([], 0) } },
};

export const Single: Story = {
  args: { asyncData: { tag: 'fulfilled', data: pageData([property], 1) } },
};

export const Many: Story = {
  args: { asyncData: { tag: 'fulfilled', data: pageData(manyProperties, 3) } },
};