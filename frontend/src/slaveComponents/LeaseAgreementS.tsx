import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { match } from 'ts-pattern';
import type { LeaseAgreementSProps } from '@/masterComponents/LeaseAgreementM';
import { LoadingSpinner } from './LoadingSpinnerS';
import { ErrorMessage } from './ErrorMessageS';
import { LEASE_STATUS_LABEL } from './domain';
import { amountClass, leaseStatusPillClass } from './pills';
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
  optionEntries,
  setFilterString,
  type FilterChip,
} from './filter';
import { AttachmentsTableS } from './AttachmentsTableS';
import { buttonClass, FormErrorS, inputClass, labelClass as formLabelClass } from './formUi';

type Fulfilled = Extract<LeaseAgreementSProps['asyncData'], { readonly tag: 'fulfilled' }>['data'];
type LeaseAgreementData = NonNullable<Fulfilled>;
type Lease = NonNullable<LeaseAgreementData['leaseAgreement']>;
type LeaseStatus = Lease['lease_status'];
type FormOptions = LeaseAgreementSProps['formOptions'];
type LeaseInsert = Parameters<LeaseAgreementSProps['doSubmit']>[0];
type SubmitState = LeaseAgreementSProps['submitState'];
type DeleteAction = LeaseAgreementSProps['deleteAction'];
type NavLinkTo = LeaseAgreementSProps['navLinkTo'];
type FinancialEntries = LeaseAgreementSProps['financialEntries'];
type LeaseData = NonNullable<Extract<LeaseAgreementSProps['asyncData'], { readonly tag: 'fulfilled' }>['data']>;
type ClosingStatement = NonNullable<LeaseData['closingStatement']>;
type Attachments = LeaseAgreementSProps['attachments'];
type FinancialEntryFilter = FinancialEntries['filter'];
type FinancialEntryRow = Extract<FinancialEntries['asyncData'], { readonly tag: 'fulfilled' }>['data']['rows'][number];
type FinancialEntrySortColumn = FinancialEntries['sort']['config']['column'];

const COLUMNS: readonly ColumnDef<FinancialEntrySortColumn>[] = [
  { key: 'action', label: null, sortColumn: null, align: 'left', className: 'pl-4 w-10 pr-6' },
  { key: 'value_date', label: 'Termin', sortColumn: 'value_date', align: 'left', className: 'pr-4 whitespace-nowrap' },
  { key: 'description', label: 'Opis', sortColumn: null, align: 'left', className: 'min-w-[180px] pr-4' },
  { key: 'amount', label: 'Kwota', sortColumn: 'amount', align: 'right', className: 'pr-4 whitespace-nowrap' },
];

const skeletonBar = 'h-4 animate-pulse rounded bg-gray-200';

const SKELETON_ROWS = (
  <>
    {Array.from({ length: 6 }, (_, i) => (
      <tr key={`skel-${i}`} className="border-b border-gray-100">
        <td className="pl-4 h-12 py-0 pr-6"><div className={`${skeletonBar} w-6`} /></td>
        <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} w-20`} /></td>
        <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} w-32`} /></td>
        <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} ml-auto w-20`} /></td>
      </tr>
    ))}
  </>
);

const EMPTY_DATABASE = (
  <EmptyStateS
    iconPath="M3 10h18M3 14h18M9 6h.01M15 18h.01M3 6v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2z"
    title="Brak zapisów finansowych"
    description="Dodaj pierwszy zapis finansowy, aby zobaczyć go na liście."
  />
);

const buildFilterChips = (filter: FinancialEntryFilter): readonly FilterChip[] => {
  const base: ReadonlyArray<{ readonly key: string; readonly label: string | null; readonly onRemove: () => void }> = Object.freeze([
    { key: 'text', label: (filter.config.text ?? '').length > 0 ? `Opis: ${filter.config.text ?? ''}` : null, onRemove: () => filter.doFilter(setFilterString(filter.config, 'text', '')) },
    { key: 'dateFrom', label: (filter.config.dateFrom ?? '').length > 0 ? `Od: ${formatDate(filter.config.dateFrom ?? '')}` : null, onRemove: () => filter.doFilter(setFilterString(filter.config, 'dateFrom', '')) },
    { key: 'dateTo', label: (filter.config.dateTo ?? '').length > 0 ? `Do: ${formatDate(filter.config.dateTo ?? '')}` : null, onRemove: () => filter.doFilter(setFilterString(filter.config, 'dateTo', '')) },
  ]);

  return base.filter((c): c is FilterChip => c.label !== null);
};

type LeaseDraft = {
  readonly tenant_id: string;
  readonly property_id: string;
  readonly start_date: string;
  readonly end_date: string;
  readonly monthly_rent: string;
  readonly deposit_amount: string;
  readonly lease_status: LeaseStatus;
  readonly notes: string;
};

const toDraft = (l: Lease): LeaseDraft => ({
  tenant_id: l.tenant_id,
  property_id: l.property_id,
  start_date: l.start_date,
  end_date: l.end_date ?? '',
  monthly_rent: String(l.monthly_rent),
  deposit_amount: String(l.deposit_amount),
  lease_status: l.lease_status,
  notes: l.notes ?? '',
});

const EMPTY_DRAFT: LeaseDraft = Object.freeze({
  tenant_id: '',
  property_id: '',
  start_date: '',
  end_date: '',
  monthly_rent: '',
  deposit_amount: '',
  lease_status: 'active',
  notes: '',
});

const toInsert = (d: LeaseDraft): LeaseInsert => ({
  tenant_id: d.tenant_id,
  property_id: d.property_id,
  start_date: d.start_date,
  end_date: d.end_date === '' ? null : d.end_date,
  monthly_rent: d.monthly_rent === '' ? 0 : Number(d.monthly_rent),
  deposit_amount: d.deposit_amount === '' ? 0 : Number(d.deposit_amount),
  lease_status: d.lease_status,
  notes: d.notes === '' ? null : d.notes,
});

// Deposit settlement panel: every figure comes from lease_closing_statement,
// so the slave performs no arithmetic of its own.
const DepositPanel = ({ statement }: { readonly statement: ClosingStatement }): JSX.Element => {
  const outstanding = statement.deposit_outstanding ?? 0;
  const settled = statement.deposit_released !== null;
  return (
    <div className={sectionClass}>
      <h2 className={sectionTitleClass}>Kaucja</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div>
          <p className={labelClass}>Naliczona</p>
          <p className={valueClass}>{formatPln(statement.deposit_charged ?? 0)}</p>
        </div>
        <div>
          <p className={labelClass}>Wpłacona</p>
          <p className={valueClass}>{formatPln(statement.deposit_paid ?? 0)}</p>
        </div>
        <div>
          <p className={labelClass}>W posiadaniu</p>
          <p className={valueClass}>{formatPln(statement.deposit_held ?? 0)}</p>
        </div>
        {settled ? (
          <div>
            <p className={labelClass}>Zwrócona najemcy</p>
            <p className={valueClass}>{formatPln(statement.deposit_released ?? 0)}</p>
          </div>
        ) : undefined}
        {settled ? (
          <div>
            <p className={labelClass}>Zatrzymana</p>
            <p className={valueClass}>{formatPln(statement.deposit_retained ?? 0)}</p>
          </div>
        ) : undefined}
        <div>
          <p className={labelClass}>Do zwrotu</p>
          <p className={`text-sm font-semibold ${outstanding > 0 ? 'text-amber-700' : 'text-green-700'}`}>
            <span aria-hidden="true">{outstanding > 0 ? '● ' : '✓ '}</span>
            {formatPln(outstanding)}
          </p>
        </div>
      </div>
    </div>
  );
};

type DetailContentProps = {
  readonly data: LeaseAgreementData;
  readonly navLinkTo: NavLinkTo;
  readonly financialEntries: FinancialEntries;
  readonly attachments: Attachments;
  readonly onEdit: () => void;
};

const DetailContent = ({
  data,
  navLinkTo,
  financialEntries,
  attachments,
  onEdit,
}: DetailContentProps): JSX.Element => {
  const l = data.leaseAgreement;
  const closingStatement = data.closingStatement;
  const filter = financialEntries.filter;
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
            {navLinkTo.toList({ style: {}, content: '← Powrót' })}
            <h1 className="mt-1 text-2xl font-bold text-gray-900">{`Umowa najmu: ${l.property?.name ?? ''}${l.tenant !== null ? ` — ${l.tenant.first_name} ${l.tenant.last_name}` : ''}`}</h1>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onEdit} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Edytuj
            </button>
          </div>
        </div>

        <div className={sectionClass}>
          <h2 className={sectionTitleClass}>Dane umowy</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="[&_a]:text-sm [&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline"><p className={labelClass}>Najemca</p>{navLinkTo.tenant({ id: l.tenant_id, style: {}, content: (l.tenant ? `${l.tenant.first_name ?? ''} ${l.tenant.last_name ?? ''}`.trim() : '') })}</div>
            <div className="[&_a]:text-sm [&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline"><p className={labelClass}>Nieruchomość</p>{navLinkTo.property({ id: l.property_id, style: {}, content: l.property?.name ?? '' })}</div>
            <div><p className={labelClass}>Status</p><span className={leaseStatusPillClass(l.lease_status)}>{LEASE_STATUS_LABEL[l.lease_status] ?? l.lease_status}</span></div>
            <div><p className={labelClass}>Data rozpoczęcia</p><p className={valueClass}>{formatDate(l.start_date)}</p></div>
            <div><p className={labelClass}>Data zakończenia</p><p className={valueClass}>{l.end_date !== null ? formatDate(l.end_date) : 'Bezterminowo'}</p></div>
            <div><p className={labelClass}>Czynsz miesięczny</p><p className={valueClass}>{formatPln(l.monthly_rent)}</p></div>
            <div><p className={labelClass}>Kaucja</p><p className={valueClass}>{formatPln(l.deposit_amount)}</p></div>
          </div>
          {l.notes !== null ? <div className="mt-4"><p className={labelClass}>Notatki</p><p className={`${valueClass} mt-1 whitespace-pre-wrap`}>{l.notes}</p></div> : undefined}
        </div>

        {closingStatement !== null ? <DepositPanel statement={closingStatement} /> : undefined}

        <div className={sectionClass}>
          <h2 className={sectionTitleClass}>Zapisy finansowe</h2>
          <FilterToolbarS
            isFilterActive={isFilterActive(filter.config)}
            activeFilterCount={activeFilterCount(filter.config)}
            clearFilter={() => filter.doFilter({})}
            chips={buildFilterChips(filter)}
            resultCount={match(financialEntries.asyncData)
              .with({ tag: 'fulfilled' }, ({ data: pageData }) => `Znaleziono: ${pageData.totalCount}${isFilterActive(filter.config) ? ' (filtrowane)' : ''}`)
              .otherwise(() => null)}
            panel={
              <>
                <div className="min-w-[220px]">
                  <label htmlFor="lease-txn-filter" className={filterLabelClass}>
                    Szukaj (opis)
                  </label>
                  <input
                    id="lease-txn-filter"
                    type="search"
                    value={filter.config.text ?? ''}
                    onChange={onFilterInput((v) => filter.doFilter(setFilterString(filter.config, 'text', v)))}
                    placeholder="Wpisz fragment opisu…"
                    className={`${filterInputClass} w-full`}
                  />
                </div>
                <div>
                  <label htmlFor="lease-txn-date-from" className={filterLabelClass}>
                    Termin od
                  </label>
                  <input
                    id="lease-txn-date-from"
                    type="date"
                    value={filter.config.dateFrom ?? ''}
                    onChange={onFilterInput((v) => filter.doFilter(setFilterString(filter.config, 'dateFrom', v)))}
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
                    value={filter.config.dateTo ?? ''}
                    onChange={onFilterInput((v) => filter.doFilter(setFilterString(filter.config, 'dateTo', v)))}
                    className={filterInputClass}
                  />
                </div>
              </>
            }
          />
          <AsyncStateTableS<FinancialEntryRow, FinancialEntrySortColumn>
            asyncData={financialEntries.asyncData}
            columns={COLUMNS}
            sort={financialEntries.sort}
            pagination={financialEntries.pagination}
            skeletonRows={SKELETON_ROWS}
            emptyState={EMPTY_DATABASE}
            filteredEmptyState={<FilterEmptyStateS clearFilter={() => filter.doFilter({})} />}
            isFilterActive={isFilterActive(filter.config)}
            maxHeight={null}
            pageSizeOptions={[5, 20, 50, 100]}
            renderRow={(tx) => (
              <tr
                key={tx.id}
                className="group border-b border-gray-100 text-sm hover:bg-gray-50"
              >
                <td className="pl-4 h-12 py-0 pr-6 [&_a]:text-blue-600 hover:[&_a]:text-blue-800 focus-visible:[&_a]:outline-none focus-visible:[&_a]:ring-2 focus-visible:[&_a]:ring-blue-500">
                  {navLinkTo.financialEntry({ id: tx.id, style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', borderRadius: '6px' }, content: '→', ariaLabel: `Szczegóły zapisu finansowego${tx.description !== null ? ': ' + tx.description : ''}` })}
                </td>
                <td className="h-12 py-0 pr-4 text-gray-600 whitespace-nowrap">{formatDate(tx.value_date)}</td>
                <td className="h-12 py-0 pr-4 text-gray-600" title={tx.description ?? undefined}>
                  <div className="truncate">
                    {tx.description !== null ? tx.description : <span className="text-gray-400">—</span>}
                  </div>
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
  readonly initial: LeaseDraft;
  readonly formOptions: FormOptions;
  readonly submitState: SubmitState;
  readonly doSubmit: (newRecord: LeaseInsert) => void;
  readonly deleteAction: DeleteAction;
  readonly onCancel: () => void;
};

const LeaseAgreementForm = ({
  initial,
  formOptions,
  submitState,
  doSubmit,
  deleteAction,
  onCancel,
}: FormProps): JSX.Element => {
  const [form, setForm] = useState<LeaseDraft>(initial);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const setField = (field: keyof LeaseDraft) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    doSubmit(toInsert(form));
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900">{deleteAction.tag === 'absent' ? 'Nowa umowa najmu' : 'Edytuj umowę najmu'}</h1>
      {match(submitState)
        .with({ tag: 'idle' }, () => null)
        .with({ tag: 'submitting' }, () => null)
        .with({ tag: 'success' }, () => null)
        .with({ tag: 'error' }, ({ message }) => <FormErrorS message={message} />)
        .exhaustive()}
      <form onSubmit={handleSubmit} className={`${sectionClass} space-y-4`}>
        {match(formOptions)
          .with({ tag: 'pending' }, () => (
            <div className="flex items-center justify-center min-h-[120px]">
              <LoadingSpinner />
            </div>
          ))
          .with({ tag: 'rejected' }, ({ message, onRetry }) => (
            <ErrorMessage message={message} onRetry={onRetry} />
          ))
          .with({ tag: 'fulfilled' }, ({ data: options }) => (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="lease-tenant" className={formLabelClass}>Najemca</label>
                <select id="lease-tenant" name="tenant_id" required value={form.tenant_id} onChange={setField('tenant_id')} className={inputClass}>
                  <option value="">Wybierz najemcę…</option>
                  {options.tenants.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="lease-property" className={formLabelClass}>Nieruchomość</label>
                <select id="lease-property" name="property_id" required value={form.property_id} onChange={setField('property_id')} className={inputClass}>
                  <option value="">Wybierz nieruchomość…</option>
                  {options.properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>
          ))
          .exhaustive()}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="lease-start-date" className={formLabelClass}>Data rozpoczęcia</label>
            <input id="lease-start-date" name="start_date" type="date" required value={form.start_date} onChange={setField('start_date')} className={inputClass} />
          </div>
          <div>
            <label htmlFor="lease-end-date" className={formLabelClass}>Data zakończenia</label>
            <input id="lease-end-date" name="end_date" type="date" value={form.end_date} onChange={setField('end_date')} className={inputClass} />
          </div>
          <div>
            <label htmlFor="lease-rent" className={formLabelClass}>Czynsz miesięczny (zł)</label>
            <input id="lease-rent" name="monthly_rent" type="number" step="0.01" min="0" required value={form.monthly_rent} onChange={setField('monthly_rent')} className={inputClass} />
          </div>
          <div>
            <label htmlFor="lease-deposit" className={formLabelClass}>Kaucja (zł)</label>
            <input id="lease-deposit" name="deposit_amount" type="number" step="0.01" min="0" required value={form.deposit_amount} onChange={setField('deposit_amount')} className={inputClass} />
          </div>
          <div>
            <label htmlFor="lease-status" className={formLabelClass}>Status</label>
            <select id="lease-status" name="lease_status" value={form.lease_status} onChange={setField('lease_status')} className={inputClass}>
              {optionEntries(LEASE_STATUS_LABEL).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="lease-notes" className={formLabelClass}>Notatki</label>
          <textarea id="lease-notes" name="notes" rows={3} value={form.notes} onChange={setField('notes')} className={inputClass} />
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
          {match(deleteAction)
            .with({ tag: 'absent' }, () => null)
            .with({ tag: 'checking' }, () => (
              <button type="button" disabled className="cursor-not-allowed rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-400">
                Sprawdzanie…
              </button>
            ))
            .with({ tag: 'blocked' }, ({ reason }) => (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled
                  aria-describedby="lease-delete-blocked"
                  className="cursor-not-allowed rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-400"
                >
                  Usuń
                </button>
                <p id="lease-delete-blocked" className="text-xs text-gray-500">{reason}</p>
              </div>
            ))
            .with({ tag: 'allowed' }, ({ doDelete }) =>
              confirmDelete ?
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { doDelete(); setConfirmDelete(false); }}
                    disabled={submitState.tag === 'submitting'}
                    className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                  >
                    Potwierdź usunięcie
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    disabled={submitState.tag === 'submitting'}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Nie usuwaj
                  </button>
                </div> :
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  disabled={submitState.tag === 'submitting'}
                  className="rounded-md border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                >
                  Usuń
                </button>
            )
            .exhaustive()}
        </div>
      </form>
    </div>
  );
};

const LeaseAgreementDetail = ({
  data,
  navLinkTo,
  formOptions,
  financialEntries,
  attachments,
  doSubmit,
  deleteAction,
  onEditStart,
  submitState,
}: {
  readonly data: LeaseAgreementData;
  readonly navLinkTo: NavLinkTo;
  readonly formOptions: FormOptions;
  readonly financialEntries: FinancialEntries;
  readonly attachments: Attachments;
  readonly doSubmit: (newRecord: LeaseInsert) => void;
  readonly deleteAction: DeleteAction;
  readonly onEditStart: () => void;
  readonly submitState: SubmitState;
}): JSX.Element => {
  const [editing, setEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const lease = data.leaseAgreement;

  useEffect(() => {
    const timer = match(submitState.tag)
      .with('success', () => {
        setEditing(false);
        setShowSuccess(true);
        return setTimeout(() => setShowSuccess(false), 4000);
      })
      .otherwise(() => null);
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
      {match(lease)
        .with(null, () => (
          <div className="flex items-center justify-center min-h-[300px]">
            <p className="text-sm text-gray-500">Nie znaleziono umowy.</p>
          </div>
        ))
        .otherwise((l) =>
          editing ?
            <LeaseAgreementForm
              initial={toDraft(l)}
              formOptions={formOptions}
              submitState={submitState}
              doSubmit={doSubmit}
              deleteAction={deleteAction}
              onCancel={() => setEditing(false)}
            /> :
            <DetailContent
              data={data}
              navLinkTo={navLinkTo}
              financialEntries={financialEntries}
              attachments={attachments}
              onEdit={() => { setEditing(true); setShowSuccess(false); onEditStart(); }}
            />
        )}
    </>
  );
};

export const LeaseAgreementDetailS = (props: LeaseAgreementSProps): JSX.Element => (
  <div className="flex min-h-[400px] flex-col">
    {match(props.asyncData)
      .with({ tag: 'pending' }, () => <LoadingSpinner />)
      .with({ tag: 'rejected' }, ({ message, onRetry }) => (<ErrorMessage message={message} onRetry={onRetry} />))
      .with({ tag: 'fulfilled' }, ({ data }) =>
        data === null ?
          <LeaseAgreementForm
            initial={EMPTY_DRAFT}
            formOptions={props.formOptions}
            submitState={props.submitState}
            doSubmit={props.doSubmit}
            deleteAction={{ tag: 'absent' }}
            onCancel={props.doCancel}
          /> :
          <LeaseAgreementDetail
            data={data}
            navLinkTo={props.navLinkTo}
            formOptions={props.formOptions}
            financialEntries={props.financialEntries}
            attachments={props.attachments}
            doSubmit={props.doSubmit}
            deleteAction={props.deleteAction}
            onEditStart={props.onEditStart}
            submitState={props.submitState}
          />
      )
      .exhaustive()}
  </div>
);
