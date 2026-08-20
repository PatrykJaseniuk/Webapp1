import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { match } from 'ts-pattern';
import type { PropertySProps, SubmitState } from '@/masterComponents/PropertyM';
import { LoadingSpinner } from './LoadingSpinnerS';
import { ErrorMessage } from './ErrorMessageS';
import {
  LEASE_STATUS_LABEL,
  PROPERTY_STATUS_LABEL,
  PROPERTY_TYPE_LABEL,
  TRANSACTION_STATUS_LABEL,
  TRANSACTION_TYPE_LABEL,
} from './domain';
import { buttonClass, FormErrorS, inputClass, labelClass as formLabelClass } from './formUi';
import {
  amountClass,
  leaseStatusPillClass,
  propertyStatusPillClass,
  txnStatusPillClass,
} from './pills';
import { formatDate, formatPln } from './format';
import { labelClass, sectionClass, sectionTitleClass, valueClass } from './detail';
import { AsyncStateTableS } from './AsyncStateTableS';
import type { ColumnDef } from './DataTableS';
import { EmptyStateS, FilterEmptyStateS } from './EmptyStateS';
import { FilterToolbarS } from './FilterToolbarS';
import {
  activeFilterCount,
  inputClass as filterInputClass,
  isFilterActive,
  labelClass as filterLabelClass,
  onFilterInput,
  onSelectInput,
  optionEntries,
  setFilterString,
  type FilterChip,
} from './filter';
import { AttachmentsTableS } from './AttachmentsTableS';

type Fulfilled = Extract<PropertySProps['asyncData'], { readonly tag: 'fulfilled' }>['data'];
type PropertyData = NonNullable<Fulfilled>;
type Property = NonNullable<PropertyData['property']>;
type PropertyType = Property['property_type'];
type PropertyStatus = Property['property_status'];
type PropertyInsert = Parameters<PropertySProps['doEdit']>[0];
type NavLinkTo = PropertySProps['navLinkTo'];
type Leases = PropertySProps['leases'];
type Transactions = PropertySProps['transactions'];
type Attachments = PropertySProps['attachments'];
type LeaseRow = Extract<Leases['asyncData'], { readonly tag: 'fulfilled' }>['data']['rows'][number];
type LeaseSortColumn = Leases['sort']['config']['column'];
type LeaseFilter = Leases['filter'];
type LeaseStatus = LeaseRow['lease_status'];
type TransactionRow = Extract<Transactions['asyncData'], { readonly tag: 'fulfilled' }>['data']['rows'][number];
type TransactionSortColumn = Transactions['sort']['config']['column'];
type TransactionFilter = Transactions['filter'];
type TxnType = TransactionRow['type'];
type TxnStatus = TransactionRow['transaction_status'];

const LEASE_COLUMNS: readonly ColumnDef<LeaseSortColumn>[] = [
  { key: 'action', label: null, sortColumn: null, align: 'left', className: 'pl-4 w-10 pr-6' },
  { key: 'tenant', label: 'Najemca', sortColumn: null, align: 'left', className: 'pl-4 pr-4' },
  { key: 'start_date', label: 'Od', sortColumn: 'start_date', align: 'left', className: 'pr-4 whitespace-nowrap' },
  { key: 'end_date', label: 'Do', sortColumn: 'end_date', align: 'left', className: 'pr-4 whitespace-nowrap' },
  { key: 'monthly_rent', label: 'Czynsz', sortColumn: 'monthly_rent', align: 'right', className: 'pr-4 whitespace-nowrap' },
  { key: 'lease_status', label: 'Status', sortColumn: 'lease_status', align: 'left', className: 'pr-4 whitespace-nowrap' },
];

const TRANSACTION_COLUMNS: readonly ColumnDef<TransactionSortColumn>[] = [
  { key: 'action', label: null, sortColumn: null, align: 'left', className: 'pl-4 w-10 pr-6' },
  { key: 'due_date', label: 'Termin', sortColumn: 'due_date', align: 'left', className: 'pr-4 whitespace-nowrap' },
  { key: 'type', label: 'Typ', sortColumn: 'type', align: 'left', className: 'pr-4 whitespace-nowrap' },
  { key: 'description', label: 'Opis', sortColumn: null, align: 'left', className: 'min-w-[180px] pr-4' },
  { key: 'status', label: 'Status', sortColumn: 'transaction_status', align: 'left', className: 'pr-4 whitespace-nowrap' },
  { key: 'amount', label: 'Kwota', sortColumn: 'amount', align: 'right', className: 'pr-4 whitespace-nowrap' },
];

const skeletonBar = 'h-4 animate-pulse rounded bg-gray-200';

const LEASE_SKELETON_ROWS = (
  <>
    {Array.from({ length: 5 }, (_, i) => (
      <tr key={`lease-skel-${i}`} className="border-b border-gray-100">
        <td className="pl-4 h-12 py-0 pr-6"><div className={`${skeletonBar} w-6`} /></td>
        <td className="pl-4 h-12 py-0 pr-4"><div className={`${skeletonBar} w-32`} /></td>
        <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} w-20`} /></td>
        <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} w-20`} /></td>
        <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} ml-auto w-16`} /></td>
        <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} w-16`} /></td>
      </tr>
    ))}
  </>
);

const TRANSACTION_SKELETON_ROWS = (
  <>
    {Array.from({ length: 5 }, (_, i) => (
      <tr key={`txn-skel-${i}`} className="border-b border-gray-100">
        <td className="pl-4 h-12 py-0 pr-6"><div className={`${skeletonBar} w-6`} /></td>
        <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} w-20`} /></td>
        <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} w-16`} /></td>
        <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} w-32`} /></td>
        <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} w-16`} /></td>
        <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} ml-auto w-20`} /></td>
      </tr>
    ))}
  </>
);

const LEASE_EMPTY = (
  <EmptyStateS
    iconPath="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h8l5 5v11a2 2 0 01-2 2z"
    title="Brak umów najmu"
    description="Ten budynek nie posiada jeszcze historii najmu."
  />
);

const TRANSACTION_EMPTY = (
  <EmptyStateS
    iconPath="M3 10h18M3 14h18M9 6h.01M15 18h.01M3 6v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2z"
    title="Brak transakcji do wyświetlenia"
    description="Brak transakcji powiązanych z tą nieruchomością."
  />
);

type PropertyDraft = {
  readonly name: string;
  readonly address: string;
  readonly property_type: PropertyType;
  readonly property_status: PropertyStatus;
  readonly size_sqm: string;
  readonly bedrooms: string;
  readonly monthly_rent: string;
  readonly deposit_amount: string;
  readonly notes: string;
};

const toDraft = (p: Property): PropertyDraft => ({
  name: p.name,
  address: p.address,
  property_type: p.property_type,
  property_status: p.property_status,
  size_sqm: p.size_sqm !== null ? String(p.size_sqm) : '',
  bedrooms: p.bedrooms !== null ? String(p.bedrooms) : '',
  monthly_rent: String(p.monthly_rent),
  deposit_amount: String(p.deposit_amount),
  notes: p.notes ?? '',
});

const EMPTY_DRAFT: PropertyDraft = Object.freeze({
  name: '',
  address: '',
  property_type: 'apartment',
  property_status: 'available',
  size_sqm: '',
  bedrooms: '',
  monthly_rent: '',
  deposit_amount: '',
  notes: '',
});

const toInsert = (d: PropertyDraft): PropertyInsert => ({
  name: d.name,
  address: d.address,
  property_type: d.property_type,
  property_status: d.property_status,
  size_sqm: d.size_sqm === '' ? null : Number(d.size_sqm),
  bedrooms: d.bedrooms === '' ? null : Number(d.bedrooms),
  monthly_rent: d.monthly_rent === '' ? 0 : Number(d.monthly_rent),
  deposit_amount: d.deposit_amount === '' ? 0 : Number(d.deposit_amount),
  notes: d.notes === '' ? null : d.notes,
});

const buildLeaseFilterChips = (filter: LeaseFilter): readonly FilterChip[] => {
  const base: ReadonlyArray<{ readonly key: string; readonly label: string | null; readonly onRemove: () => void }> = Object.freeze([
    { key: 'status', label: (filter.config.status ?? '').length > 0 ? `Status: ${LEASE_STATUS_LABEL[(filter.config.status ?? '') as LeaseStatus] ?? (filter.config.status ?? '')}` : null, onRemove: () => filter.doFilter(setFilterString(filter.config, 'status', '')) },
    { key: 'dateFrom', label: (filter.config.dateFrom ?? '').length > 0 ? `Od: ${formatDate(filter.config.dateFrom ?? '')}` : null, onRemove: () => filter.doFilter(setFilterString(filter.config, 'dateFrom', '')) },
    { key: 'dateTo', label: (filter.config.dateTo ?? '').length > 0 ? `Do: ${formatDate(filter.config.dateTo ?? '')}` : null, onRemove: () => filter.doFilter(setFilterString(filter.config, 'dateTo', '')) },
  ]);
  return base.filter((c): c is FilterChip => c.label !== null);
};

const buildTransactionFilterChips = (filter: TransactionFilter): readonly FilterChip[] => {
  const base: ReadonlyArray<{ readonly key: string; readonly label: string | null; readonly onRemove: () => void }> = Object.freeze([
    { key: 'text', label: (filter.config.text ?? '').length > 0 ? `Opis: ${filter.config.text ?? ''}` : null, onRemove: () => filter.doFilter(setFilterString(filter.config, 'text', '')) },
    { key: 'type', label: (filter.config.type ?? '').length > 0 ? `Typ: ${TRANSACTION_TYPE_LABEL[(filter.config.type ?? '') as TxnType] ?? (filter.config.type ?? '')}` : null, onRemove: () => filter.doFilter(setFilterString(filter.config, 'type', '')) },
    { key: 'status', label: (filter.config.status ?? '').length > 0 ? `Status: ${TRANSACTION_STATUS_LABEL[(filter.config.status ?? '') as TxnStatus] ?? (filter.config.status ?? '')}` : null, onRemove: () => filter.doFilter(setFilterString(filter.config, 'status', '')) },
    { key: 'dateFrom', label: (filter.config.dateFrom ?? '').length > 0 ? `Od: ${formatDate(filter.config.dateFrom ?? '')}` : null, onRemove: () => filter.doFilter(setFilterString(filter.config, 'dateFrom', '')) },
    { key: 'dateTo', label: (filter.config.dateTo ?? '').length > 0 ? `Do: ${formatDate(filter.config.dateTo ?? '')}` : null, onRemove: () => filter.doFilter(setFilterString(filter.config, 'dateTo', '')) },
  ]);
  return base.filter((c): c is FilterChip => c.label !== null);
};

const financialLabelClass = 'text-xs font-medium text-gray-500';
const financialValueClass = 'text-lg font-semibold';

type DetailContentProps = {
  readonly data: PropertyData;
  readonly property: Property;
  readonly navLinkTo: NavLinkTo;
  readonly leases: Leases;
  readonly transactions: Transactions;
  readonly attachments: Attachments;
  readonly onEdit: () => void;
};

const DetailContent = ({
  data,
  property: p,
  navLinkTo,
  leases,
  transactions,
  attachments,
  onEdit,
}: DetailContentProps): JSX.Element => {
  const occupancy = data.occupancy;
  const financial = data.financial;
  const leaseFilter = leases.filter;
  const transactionFilter = transactions.filter;
  return (
    <div className="mx-auto max-w-4xl space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div className="[&_a]:text-sm [&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline">
          {navLinkTo.toList({ style: {}, content: '← Powrót' })}
          <h1 className="mt-1 text-2xl font-bold text-gray-900">{p.name}</h1>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onEdit} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Edytuj
          </button>
        </div>
      </div>

      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Dane nieruchomości</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div><p className={labelClass}>Adres</p><p className={valueClass}>{p.address}</p></div>
          <div><p className={labelClass}>Typ</p><p className={valueClass}>{PROPERTY_TYPE_LABEL[p.property_type] ?? p.property_type}</p></div>
          <div><p className={labelClass}>Status</p><span className={propertyStatusPillClass(p.property_status)}>{PROPERTY_STATUS_LABEL[p.property_status]}</span></div>
          <div><p className={labelClass}>Powierzchnia</p><p className={valueClass}>{p.size_sqm !== null ? `${p.size_sqm} m²` : '—'}</p></div>
          <div><p className={labelClass}>Sypialnie</p><p className={valueClass}>{p.bedrooms ?? '—'}</p></div>
          <div>
            <p className={labelClass}>Aktualny najemca</p>
            {occupancy?.current_tenant_name !== null && occupancy?.current_tenant_name !== undefined && occupancy?.tenant_id !== null && occupancy?.tenant_id !== undefined ?
              <div className="[&_a]:text-sm [&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline">{navLinkTo.tenant({ id: occupancy.tenant_id as string, style: {}, content: occupancy.current_tenant_name })}</div> :
              <p className={`${valueClass} text-gray-400`}>—</p>}
          </div>
          <div>
            <p className={labelClass}>Aktualna umowa</p>
            {occupancy?.current_lease_id !== null && occupancy?.current_lease_id !== undefined ?
              <div className="[&_a]:text-sm [&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline">{navLinkTo.lease({ id: occupancy.current_lease_id as string, style: {}, content: 'Umowa najmu' })}</div> :
              <p className={`${valueClass} text-gray-400`}>—</p>}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div><p className={labelClass}>Czynsz miesięczny</p><p className={valueClass}>{formatPln(p.monthly_rent)}</p></div>
          <div><p className={labelClass}>Kaucja</p><p className={valueClass}>{formatPln(p.deposit_amount)}</p></div>
        </div>
        {p.notes !== null ? <div className="mt-4"><p className={labelClass}>Notatki</p><p className={`${valueClass} mt-1 whitespace-pre-wrap`}>{p.notes}</p></div> : undefined}
      </div>

      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Podsumowanie finansowe</h2>
        <div className="grid grid-cols-3 gap-6">
          <div className="rounded-lg bg-green-50 p-4 text-center"><p className={financialLabelClass}>Przychody</p><p className={`${financialValueClass} text-green-700`}>{formatPln(financial?.total_income ?? 0)}</p></div>
          <div className="rounded-lg bg-red-50 p-4 text-center"><p className={financialLabelClass}>Wydatki</p><p className={`${financialValueClass} text-red-700`}>{formatPln(financial?.total_expenses ?? 0)}</p></div>
          <div className="rounded-lg bg-blue-50 p-4 text-center"><p className={financialLabelClass}>Bilans</p><p className={`${financialValueClass} ${(financial?.net_profit ?? 0) >= 0 ? 'text-blue-700' : 'text-red-700'}`}>{formatPln(financial?.net_profit ?? 0)}</p></div>
        </div>
      </div>

      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Historia najmu</h2>
        <FilterToolbarS
          isFilterActive={isFilterActive(leaseFilter.config)}
          activeFilterCount={activeFilterCount(leaseFilter.config)}
          clearFilter={() => leaseFilter.doFilter({})}
          chips={buildLeaseFilterChips(leaseFilter)}
          resultCount={match(leases.asyncData)
            .with({ tag: 'fulfilled' }, ({ data: pageData }) => `Znaleziono: ${pageData.totalCount}${isFilterActive(leaseFilter.config) ? ' (filtrowane)' : ''}`)
            .otherwise(() => null)}
          panel={
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label htmlFor="property-lease-status" className={filterLabelClass}>Status</label>
                <select
                  id="property-lease-status"
                  value={leaseFilter.config.status ?? ''}
                  onChange={onSelectInput((v) => leaseFilter.doFilter(setFilterString(leaseFilter.config, 'status', v)))}
                  className={filterInputClass}
                >
                  <option value="">Wszystkie</option>
                  {optionEntries(LEASE_STATUS_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="property-lease-date-from" className={filterLabelClass}>Od</label>
                <input
                  id="property-lease-date-from"
                  type="date"
                  value={leaseFilter.config.dateFrom ?? ''}
                  onChange={onFilterInput((v) => leaseFilter.doFilter(setFilterString(leaseFilter.config, 'dateFrom', v)))}
                  className={filterInputClass}
                />
              </div>
              <div>
                <label htmlFor="property-lease-date-to" className={filterLabelClass}>Do</label>
                <input
                  id="property-lease-date-to"
                  type="date"
                  value={leaseFilter.config.dateTo ?? ''}
                  onChange={onFilterInput((v) => leaseFilter.doFilter(setFilterString(leaseFilter.config, 'dateTo', v)))}
                  className={filterInputClass}
                />
              </div>
            </div>
          }
        />
        <AsyncStateTableS<LeaseRow, LeaseSortColumn>
          asyncData={leases.asyncData}
          columns={LEASE_COLUMNS}
          sort={leases.sort}
          pagination={leases.pagination}
          skeletonRows={LEASE_SKELETON_ROWS}
          emptyState={LEASE_EMPTY}
          filteredEmptyState={<FilterEmptyStateS clearFilter={() => leaseFilter.doFilter({})} />}
          isFilterActive={isFilterActive(leaseFilter.config)}
          maxHeight={null}
          pageSizeOptions={[5, 20, 50, 100]}
          renderRow={(l) => (
            <tr key={l.id} className="group border-b border-gray-100 text-sm hover:bg-gray-50">
              <td className="pl-4 h-12 py-0 pr-6 [&_a]:text-blue-600 hover:[&_a]:text-blue-800 focus-visible:[&_a]:outline-none focus-visible:[&_a]:ring-2 focus-visible:[&_a]:ring-blue-500">
                {navLinkTo.lease({ id: l.id, style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', borderRadius: '6px' }, content: '→', ariaLabel: 'Szczegóły umowy' })}
              </td>
              <td className="pl-4 h-12 py-0 pr-4 [&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline">
                {navLinkTo.tenant({ id: l.tenant_id, style: {}, content: `${l.tenants.first_name} ${l.tenants.last_name}` })}
              </td>
              <td className="h-12 py-0 pr-4 [&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline">
                {navLinkTo.lease({ id: l.id, style: {}, content: formatDate(l.start_date) })}
              </td>
              <td className="h-12 py-0 pr-4 text-gray-600 whitespace-nowrap">{l.end_date !== null ? formatDate(l.end_date) : '—'}</td>
              <td className="h-12 py-0 pr-4 text-right text-gray-900">{formatPln(l.monthly_rent)}</td>
              <td className="h-12 py-0 pr-4"><span className={leaseStatusPillClass(l.lease_status)}>{LEASE_STATUS_LABEL[l.lease_status] ?? l.lease_status}</span></td>
            </tr>
          )}
        />
      </div>

      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Ostatnie transakcje</h2>
        <FilterToolbarS
          isFilterActive={isFilterActive(transactionFilter.config)}
          activeFilterCount={activeFilterCount(transactionFilter.config)}
          clearFilter={() => transactionFilter.doFilter({})}
          chips={buildTransactionFilterChips(transactionFilter)}
          resultCount={match(transactions.asyncData)
            .with({ tag: 'fulfilled' }, ({ data: pageData }) => `Znaleziono: ${pageData.totalCount}${isFilterActive(transactionFilter.config) ? ' (filtrowane)' : ''}`)
            .otherwise(() => null)}
          panel={
            <div className="flex flex-wrap items-end gap-4">
              <div className="min-w-[220px]">
                <label htmlFor="property-txn-filter" className={filterLabelClass}>Szukaj (opis)</label>
                <input
                  id="property-txn-filter"
                  type="search"
                  value={transactionFilter.config.text ?? ''}
                  onChange={onFilterInput((v) => transactionFilter.doFilter(setFilterString(transactionFilter.config, 'text', v)))}
                  placeholder="Wpisz fragment opisu…"
                  className={`${filterInputClass} w-full`}
                />
              </div>
              <div>
                <label htmlFor="property-txn-type" className={filterLabelClass}>Typ</label>
                <select
                  id="property-txn-type"
                  value={transactionFilter.config.type ?? ''}
                  onChange={onSelectInput((v) => transactionFilter.doFilter(setFilterString(transactionFilter.config, 'type', v)))}
                  className={filterInputClass}
                >
                  <option value="">Wszystkie</option>
                  {optionEntries(TRANSACTION_TYPE_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="property-txn-status" className={filterLabelClass}>Status</label>
                <select
                  id="property-txn-status"
                  value={transactionFilter.config.status ?? ''}
                  onChange={onSelectInput((v) => transactionFilter.doFilter(setFilterString(transactionFilter.config, 'status', v)))}
                  className={filterInputClass}
                >
                  <option value="">Wszystkie</option>
                  {optionEntries(TRANSACTION_STATUS_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="property-txn-date-from" className={filterLabelClass}>Termin od</label>
                <input
                  id="property-txn-date-from"
                  type="date"
                  value={transactionFilter.config.dateFrom ?? ''}
                  onChange={onFilterInput((v) => transactionFilter.doFilter(setFilterString(transactionFilter.config, 'dateFrom', v)))}
                  className={filterInputClass}
                />
              </div>
              <div>
                <label htmlFor="property-txn-date-to" className={filterLabelClass}>Termin do</label>
                <input
                  id="property-txn-date-to"
                  type="date"
                  value={transactionFilter.config.dateTo ?? ''}
                  onChange={onFilterInput((v) => transactionFilter.doFilter(setFilterString(transactionFilter.config, 'dateTo', v)))}
                  className={filterInputClass}
                />
              </div>
            </div>
          }
        />
        <AsyncStateTableS<TransactionRow, TransactionSortColumn>
          asyncData={transactions.asyncData}
          columns={TRANSACTION_COLUMNS}
          sort={transactions.sort}
          pagination={transactions.pagination}
          skeletonRows={TRANSACTION_SKELETON_ROWS}
          emptyState={TRANSACTION_EMPTY}
          filteredEmptyState={<FilterEmptyStateS clearFilter={() => transactionFilter.doFilter({})} />}
          isFilterActive={isFilterActive(transactionFilter.config)}
          maxHeight={null}
          pageSizeOptions={[5, 20, 50, 100]}
          renderRow={(tx) => (
            <tr key={tx.id} className="group border-b border-gray-100 text-sm hover:bg-gray-50">
              <td className="pl-4 h-12 py-0 pr-6 [&_a]:text-blue-600 hover:[&_a]:text-blue-800 focus-visible:[&_a]:outline-none focus-visible:[&_a]:ring-2 focus-visible:[&_a]:ring-blue-500">
                {navLinkTo.transaction({ id: tx.id, style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', borderRadius: '6px' }, content: '→', ariaLabel: `Szczegóły transakcji${tx.description !== null ? ': ' + tx.description : ''}` })}
              </td>
              <td className="h-12 py-0 pr-4 text-gray-600 whitespace-nowrap">{formatDate(tx.due_date)}</td>
              <td className="h-12 py-0 pr-4 text-gray-600 whitespace-nowrap">{TRANSACTION_TYPE_LABEL[tx.type] ?? tx.type}</td>
              <td className="h-12 py-0 pr-4 text-gray-600" title={tx.description ?? undefined}>
                <div className="truncate">{tx.description !== null ? tx.description : <span className="text-gray-400">—</span>}</div>
              </td>
              <td className="h-12 py-0 pr-4">
                <span className={txnStatusPillClass(tx.transaction_status)}>{TRANSACTION_STATUS_LABEL[tx.transaction_status] ?? tx.transaction_status}</span>
              </td>
              <td className={`h-12 py-0 pr-4 text-right whitespace-nowrap font-mono ${amountClass(tx.amount)}`}>{formatPln(tx.amount)}</td>
            </tr>
          )}
        />
      </div>

      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Załączniki</h2>
        <AttachmentsTableS
          asyncData={attachments.asyncData}
          sort={attachments.sort}
          pagination={attachments.pagination}
          emptyMessage="Brak załączników."
        />
      </div>
    </div>
  );
};

type FormProps = {
  readonly initial: PropertyDraft;
  readonly submitState: SubmitState;
  readonly doEdit: (newRecord: PropertyInsert) => void;
  readonly doDelete: (() => void) | null;
  readonly onCancel: () => void;
};

const PropertyForm = ({
  initial,
  submitState,
  doEdit,
  doDelete,
  onCancel,
}: FormProps): JSX.Element => {
  const [form, setForm] = useState<PropertyDraft>(initial);

  const setField = (field: keyof PropertyDraft) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }) as PropertyDraft);
    };

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    doEdit(toInsert(form));
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900">{doDelete === null ? 'Nowa nieruchomość' : 'Edytuj nieruchomość'}</h1>
      {match(submitState)
        .with({ tag: 'idle' }, () => null)
        .with({ tag: 'submitting' }, () => null)
        .with({ tag: 'success' }, () => null)
        .with({ tag: 'error' }, ({ message }) => <FormErrorS message={message} />)
        .exhaustive()}
      <form onSubmit={handleSubmit} className={`${sectionClass} space-y-4`}>
        <div>
          <label htmlFor="property-name" className={formLabelClass}>Nazwa</label>
          <input id="property-name" name="name" type="text" required value={form.name} onChange={setField('name')} className={inputClass} />
        </div>
        <div>
          <label htmlFor="property-address" className={formLabelClass}>Adres</label>
          <input id="property-address" name="address" type="text" required value={form.address} onChange={setField('address')} className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="property-type" className={formLabelClass}>Typ</label>
            <select id="property-type" name="property_type" value={form.property_type} onChange={setField('property_type')} className={inputClass}>
              {optionEntries(PROPERTY_TYPE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="property-status" className={formLabelClass}>Status</label>
            <select id="property-status" name="property_status" value={form.property_status} onChange={setField('property_status')} className={inputClass}>
              {optionEntries(PROPERTY_STATUS_LABEL).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="property-size" className={formLabelClass}>Powierzchnia (m²)</label>
            <input id="property-size" name="size_sqm" type="number" step="0.01" min="0" value={form.size_sqm} onChange={setField('size_sqm')} className={inputClass} />
          </div>
          <div>
            <label htmlFor="property-bedrooms" className={formLabelClass}>Sypialnie</label>
            <input id="property-bedrooms" name="bedrooms" type="number" step="1" min="0" value={form.bedrooms} onChange={setField('bedrooms')} className={inputClass} />
          </div>
          <div>
            <label htmlFor="property-rent" className={formLabelClass}>Czynsz miesięczny (zł)</label>
            <input id="property-rent" name="monthly_rent" type="number" step="0.01" min="0" required value={form.monthly_rent} onChange={setField('monthly_rent')} className={inputClass} />
          </div>
          <div>
            <label htmlFor="property-deposit" className={formLabelClass}>Kaucja (zł)</label>
            <input id="property-deposit" name="deposit_amount" type="number" step="0.01" min="0" required value={form.deposit_amount} onChange={setField('deposit_amount')} className={inputClass} />
          </div>
        </div>
        <div>
          <label htmlFor="property-notes" className={formLabelClass}>Notatki</label>
          <textarea id="property-notes" name="notes" rows={3} value={form.notes} onChange={setField('notes')} className={inputClass} />
        </div>
        <div className="flex items-center justify-between gap-4 pt-2">
          <div className="flex gap-2">
            <button type="submit" disabled={submitState.tag === 'submitting'} className={buttonClass}>
              {submitState.tag === 'submitting' ? 'Przetwarzanie...' : 'Zapisz'}
            </button>
            <button type="button" onClick={onCancel} disabled={submitState.tag === 'submitting'} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              Anuluj
            </button>
          </div>
          {doDelete !== null ?
            <button
              type="button"
              onClick={() => { window.confirm('Usunąć nieruchomość?') && doDelete !== null && doDelete(); }}
              disabled={submitState.tag === 'submitting'}
              className="rounded-md border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
            >
              Usuń
            </button> :
            null}
        </div>
      </form>
    </div>
  );
};

const PropertyDetail = ({
  data,
  navLinkTo,
  leases,
  transactions,
  attachments,
  doEdit,
  doDelete,
  submitState,
}: {
  readonly data: PropertyData;
  readonly navLinkTo: NavLinkTo;
  readonly leases: Leases;
  readonly transactions: Transactions;
  readonly attachments: Attachments;
  readonly doEdit: (newRecord: PropertyInsert) => void;
  readonly doDelete: (() => void) | null;
  readonly submitState: SubmitState;
}): JSX.Element => {
  const [editing, setEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const property = data.property;

  useEffect(() => {
    const isSuccess = submitState.tag === 'success';
    isSuccess ? setEditing(false) : undefined;
    isSuccess ? setShowSuccess(true) : undefined;
    const timer = isSuccess ? setTimeout(() => setShowSuccess(false), 4000) : null;
    return () => (timer !== null ? clearTimeout(timer) : undefined);
  }, [submitState.tag]);

  return (
    <>
      {showSuccess ? (
        <div role="status" className="fixed top-4 right-4 z-50 flex items-center justify-between gap-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 shadow-md">
          <span>✓ Zapisano zmiany</span>
          <button type="button" onClick={() => setShowSuccess(false)} className="rounded px-1 text-green-700 hover:text-green-900" aria-label="Zamknij powiadomienie">
            ×
          </button>
        </div>
      ) : null}
      {match(property)
        .with(null, () => (
          <div className="flex items-center justify-center min-h-[300px]">
            <p className="text-sm text-gray-500">Nie znaleziono nieruchomości.</p>
          </div>
        ))
        .otherwise((p) =>
          editing ?
            <PropertyForm
              initial={toDraft(p)}
              submitState={submitState}
              doEdit={doEdit}
              doDelete={doDelete}
              onCancel={() => setEditing(false)}
            /> :
            <DetailContent
              data={data}
              property={p}
              navLinkTo={navLinkTo}
              leases={leases}
              transactions={transactions}
              attachments={attachments}
              onEdit={() => { setEditing(true); setShowSuccess(false); }}
            />
        )}
    </>
  );
};

export const PropertyDetailS = (props: PropertySProps): JSX.Element => (
  <div className="flex min-h-[400px] flex-col">
    {match(props.asyncData)
      .with({ tag: 'pending' }, () => <LoadingSpinner />)
      .with({ tag: 'rejected' }, ({ message, onRetry }) => (<ErrorMessage message={message} onRetry={onRetry} />))
      .with({ tag: 'fulfilled' }, ({ data }) =>
        data === null ?
          <PropertyForm
            initial={EMPTY_DRAFT}
            submitState={props.submitState}
            doEdit={props.doEdit}
            doDelete={null}
            onCancel={props.doCancel}
          /> :
          <PropertyDetail
            data={data}
            navLinkTo={props.navLinkTo}
            leases={props.leases}
            transactions={props.transactions}
            attachments={props.attachments}
            doEdit={props.doEdit}
            doDelete={props.doDelete}
            submitState={props.submitState}
          />
      )
      .exhaustive()}
  </div>
);