import { match } from 'ts-pattern';
import type { LeaseAgreementSProps } from '@/masterComponents/LeaseAgreementM';
import { LoadingSpinner } from './LoadingSpinnerS';
import { ErrorMessage } from './ErrorMessageS';
import {
  LEASE_STATUS_LABEL,
  TRANSACTION_STATUS_LABEL,
  TRANSACTION_TYPE_LABEL,
} from './domain';
import { amountClass, leaseStatusPillClass, txnStatusPillClass } from './pills';
import { formatDate, formatPln } from './format';
import { labelClass, sectionClass, sectionTitleClass, valueClass } from './detail';
import { AsyncStateTableS } from './AsyncStateTableS';
import type { ColumnDef } from './DataTableS';
import { EmptyStateS, FilterEmptyStateS } from './EmptyStateS';
import { FilterToolbarS } from './FilterToolbarS';
import {
  inputClass as filterInputClass,
  labelClass as filterLabelClass,
  onFilterInput,
  onSelectInput,
  optionEntries,
  type FilterChip,
} from './filter';
import { AttachmentsSectionS } from './AttachmentsListS';

type Data = Extract<LeaseAgreementSProps['asyncData'], { readonly tag: 'fulfilled' }>['data'];
type NavLinkTo = LeaseAgreementSProps['navLinkTo'];
type Transactions = LeaseAgreementSProps['transactions'];
type TransactionFilter = Transactions['filter'];
type TransactionRow = Extract<Transactions['asyncData'], { readonly tag: 'fulfilled' }>['data']['rows'][number];
type TransactionSortColumn = Transactions['sort']['config']['column'];
type TxnType = TransactionRow['type'];
type TxnStatus = TransactionRow['transaction_status'];

const COLUMNS: readonly ColumnDef<TransactionSortColumn>[] = [
  { key: 'action', label: null, sortColumn: null, align: 'left', className: 'pl-4 w-10 pr-6' },
  { key: 'due_date', label: 'Termin', sortColumn: 'due_date', align: 'left', className: 'pr-4 whitespace-nowrap' },
  { key: 'type', label: 'Typ', sortColumn: 'type', align: 'left', className: 'pr-4 whitespace-nowrap' },
  { key: 'description', label: 'Opis', sortColumn: null, align: 'left', className: 'min-w-[180px] pr-4' },
  { key: 'status', label: 'Status', sortColumn: 'transaction_status', align: 'left', className: 'pr-4 whitespace-nowrap' },
  { key: 'amount', label: 'Kwota', sortColumn: 'amount', align: 'right', className: 'pr-4 whitespace-nowrap' },
];

const skeletonBar = 'h-4 animate-pulse rounded bg-gray-200';

const SKELETON_ROWS = (
  <>
    {Array.from({ length: 6 }, (_, i) => (
      <tr key={`skel-${i}`} className="border-b border-gray-100">
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

const EMPTY_DATABASE = (
  <EmptyStateS
    iconPath="M3 10h18M3 14h18M9 6h.01M15 18h.01M3 6v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2z"
    title="Brak transakcji do wyświetlenia"
    description="Dodaj pierwszą transakcję, aby zobaczyć ją na liście."
  />
);

const buildFilterChips = (filter: TransactionFilter): readonly FilterChip[] => {
  const base: ReadonlyArray<{ readonly key: string; readonly label: string | null; readonly onRemove: () => void }> = Object.freeze([
    { key: 'text', label: filter.text.length > 0 ? `Opis: ${filter.text}` : null, onRemove: () => filter.setText('') },
    { key: 'type', label: filter.type.length > 0 ? `Typ: ${TRANSACTION_TYPE_LABEL[filter.type as TxnType] ?? filter.type}` : null, onRemove: () => filter.setType('') },
    { key: 'status', label: filter.status.length > 0 ? `Status: ${TRANSACTION_STATUS_LABEL[filter.status as TxnStatus] ?? filter.status}` : null, onRemove: () => filter.setStatus('') },
    { key: 'dateFrom', label: filter.dateFrom.length > 0 ? `Od: ${formatDate(filter.dateFrom)}` : null, onRemove: () => filter.setDateFrom('') },
    { key: 'dateTo', label: filter.dateTo.length > 0 ? `Do: ${formatDate(filter.dateTo)}` : null, onRemove: () => filter.setDateTo('') },
  ]);

  return base.filter((c): c is FilterChip => c.label !== null);
};

type DetailContentProps = {
  readonly data: Data;
  readonly navLinkTo: NavLinkTo;
  readonly transactions: Transactions;
  readonly clearFilter: () => void;
  readonly isFilterActive: boolean;
  readonly activeFilterCount: number;
  readonly filterResetKey: number;
};

const DetailContent = ({
  data,
  navLinkTo,
  transactions,
  clearFilter,
  isFilterActive,
  activeFilterCount,
  filterResetKey,
}: DetailContentProps): JSX.Element => {
  const l = data.leaseAgreement;
  const filter = transactions.filter;
  return l === null ?
    (
      <div className="flex items-center justify-center min-h-[300px]">
        <p className="text-sm text-gray-500">Nie znaleziono umowy.</p>
      </div>
    ) :
    (
      <div className="mx-auto max-w-4xl space-y-6 py-8">
        <div className="flex items-center justify-between">
          <div className="[&_a]:text-sm [&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline">
            {navLinkTo.leases({ style: {}, content: '← Wszystkie umowy' })}
            <h1 className="mt-1 text-2xl font-bold text-gray-900">{`Umowa najmu: ${l.properties?.name ?? ''}${l.tenants !== null ? ` — ${l.tenants.first_name} ${l.tenants.last_name}` : ''}`}</h1>
          </div>
          <div className="flex gap-2 [&_a]:rounded [&_a]:bg-blue-600 [&_a]:px-4 [&_a]:py-2 [&_a]:text-sm [&_a]:font-medium [&_a]:text-white hover:[&_a]:bg-blue-700">{navLinkTo.edit({ style: {}, content: 'Edytuj' })}</div>
        </div>

        <div className={sectionClass}>
          <h2 className={sectionTitleClass}>Dane umowy</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="[&_a]:text-sm [&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline"><p className={labelClass}>Najemca</p>{navLinkTo.tenant({ id: l.tenant_id, style: {}, content: (l.tenants ? `${l.tenants.first_name ?? ''} ${l.tenants.last_name ?? ''}`.trim() : '') })}</div>
            <div className="[&_a]:text-sm [&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline"><p className={labelClass}>Nieruchomość</p>{navLinkTo.property({ id: l.property_id, style: {}, content: l.properties?.name ?? '' })}</div>
            <div><p className={labelClass}>Status</p><span className={leaseStatusPillClass(l.lease_status)}>{LEASE_STATUS_LABEL[l.lease_status] ?? l.lease_status}</span></div>
            <div><p className={labelClass}>Data rozpoczęcia</p><p className={valueClass}>{formatDate(l.start_date)}</p></div>
            <div><p className={labelClass}>Data zakończenia</p><p className={valueClass}>{l.end_date !== null ? formatDate(l.end_date) : 'Bezterminowo'}</p></div>
            <div><p className={labelClass}>Czynsz miesięczny</p><p className={valueClass}>{formatPln(l.monthly_rent)}</p></div>
            <div><p className={labelClass}>Kaucja</p><p className={valueClass}>{formatPln(l.deposit_amount)}</p></div>
          </div>
          {l.notes !== null ? <div className="mt-4"><p className={labelClass}>Notatki</p><p className={`${valueClass} mt-1 whitespace-pre-wrap`}>{l.notes}</p></div> : undefined}
        </div>

        <div className={sectionClass}>
          <h2 className={sectionTitleClass}>Ostatnie transakcje</h2>
          <FilterToolbarS
            isFilterActive={isFilterActive}
            activeFilterCount={activeFilterCount}
            clearFilter={clearFilter}
            chips={buildFilterChips(filter)}
            resultCount={match(transactions.asyncData)
              .with({ tag: 'fulfilled' }, ({ data: pageData }) => `Znaleziono: ${pageData.totalCount}${isFilterActive ? ' (filtrowane)' : ''}`)
              .otherwise(() => null)}
            filterResetKey={filterResetKey}
            panel={
              <>
                <div className="min-w-[220px]">
                  <label htmlFor="lease-txn-filter" className={filterLabelClass}>
                    Szukaj (opis)
                  </label>
                  <input
                    id="lease-txn-filter"
                    type="search"
                    defaultValue={filter.text}
                    onChange={onFilterInput(filter.setText)}
                    placeholder="Wpisz fragment opisu…"
                    className={`${filterInputClass} w-full`}
                  />
                </div>
                <div>
                  <label htmlFor="lease-txn-type" className={filterLabelClass}>
                    Typ
                  </label>
                  <select
                    id="lease-txn-type"
                    defaultValue={filter.type}
                    onChange={onSelectInput(filter.setType)}
                    className={filterInputClass}
                  >
                    <option value="">Wszystkie</option>
                    {optionEntries(TRANSACTION_TYPE_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="lease-txn-status" className={filterLabelClass}>
                    Status
                  </label>
                  <select
                    id="lease-txn-status"
                    defaultValue={filter.status}
                    onChange={onSelectInput(filter.setStatus)}
                    className={filterInputClass}
                  >
                    <option value="">Wszystkie</option>
                    {optionEntries(TRANSACTION_STATUS_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="lease-txn-date-from" className={filterLabelClass}>
                    Termin od
                  </label>
                  <input
                    id="lease-txn-date-from"
                    type="date"
                    defaultValue={filter.dateFrom}
                    onChange={onFilterInput(filter.setDateFrom)}
                    className={filterInputClass}
                  />
                </div>
                <div>
                  <label htmlFor="lease-txn-date-to" className={filterLabelClass}>
                    Termin do
                  </label>
                  <input
                    id="lease-txn-date-to"
                    type="date"
                    defaultValue={filter.dateTo}
                    onChange={onFilterInput(filter.setDateTo)}
                    className={filterInputClass}
                  />
                </div>
              </>
            }
          />
          <AsyncStateTableS<TransactionRow, TransactionSortColumn>
            asyncData={transactions.asyncData}
            columns={COLUMNS}
            sort={transactions.sort}
            pagination={transactions.pagination}
            skeletonRows={SKELETON_ROWS}
            emptyState={EMPTY_DATABASE}
            filteredEmptyState={<FilterEmptyStateS clearFilter={clearFilter} />}
            isFilterActive={isFilterActive}
            renderRow={(tx) => (
              <tr
                key={tx.id}
                className="group border-b border-gray-100 text-sm hover:bg-gray-50"
              >
                <td className="pl-4 h-12 py-0 pr-6 [&_a]:text-blue-600 hover:[&_a]:text-blue-800 focus-visible:[&_a]:outline-none focus-visible:[&_a]:ring-2 focus-visible:[&_a]:ring-blue-500">
                  {navLinkTo.transaction({ id: tx.id, style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', borderRadius: '6px' }, content: '→', ariaLabel: `Szczegóły transakcji${tx.description !== null ? ': ' + tx.description : ''}` })}
                </td>
                <td className="h-12 py-0 pr-4 text-gray-600 whitespace-nowrap">{formatDate(tx.due_date)}</td>
                <td className="h-12 py-0 pr-4 text-gray-600 whitespace-nowrap">{TRANSACTION_TYPE_LABEL[tx.type] ?? tx.type}</td>
                <td className="h-12 py-0 pr-4 text-gray-600" title={tx.description ?? undefined}>
                  <div className="truncate">
                    {tx.description !== null ? tx.description : <span className="text-gray-400">—</span>}
                  </div>
                </td>
                <td className="h-12 py-0 pr-4">
                  <span className={txnStatusPillClass(tx.transaction_status)}>
                    {TRANSACTION_STATUS_LABEL[tx.transaction_status] ?? tx.transaction_status}
                  </span>
                </td>
                <td className={`h-12 py-0 pr-4 text-right whitespace-nowrap font-mono ${amountClass(tx.amount)}`}>{formatPln(tx.amount)}</td>
              </tr>
            )}
          />
        </div>

        <div className={sectionClass}>
          <h2 className={sectionTitleClass}>Załączniki</h2>
          <AttachmentsSectionS attachments={data.attachments} emptyMessage="Brak załączników." />
        </div>
      </div>
    );
};

export const LeaseAgreementDetailS = (props: LeaseAgreementSProps): JSX.Element => {
  const { asyncData, navLinkTo, transactions, clearFilter, isFilterActive, activeFilterCount, filterResetKey } = props;

  return (
    <div className="min-h-[400px]">
      {match(asyncData)
        .with({ tag: 'pending' }, () => <LoadingSpinner />)
        .with({ tag: 'rejected' }, ({ message, onRetry }) => (<ErrorMessage message={message} onRetry={onRetry} />))
        .with({ tag: 'fulfilled' }, ({ data }) => (
          <DetailContent
            data={data}
            navLinkTo={navLinkTo}
            transactions={transactions}
            clearFilter={clearFilter}
            isFilterActive={isFilterActive}
            activeFilterCount={activeFilterCount}
            filterResetKey={filterResetKey}
          />
        ))
        .exhaustive()}
    </div>
  );
};