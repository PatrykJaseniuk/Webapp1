import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { match } from 'ts-pattern';
import type { TenantSProps } from '@/masterComponents/TenantM';
import { LoadingSpinner } from './LoadingSpinnerS';
import { ErrorMessage } from './ErrorMessageS';
import {
  LEASE_STATUS_LABEL,
  TENANT_STATUS_LABEL,
} from './domain';
import {
  leaseStatusPillClass,
  tenantStatusPillClass,
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
import { buttonClass, FormErrorS, inputClass, labelClass as formLabelClass } from './formUi';

type Fulfilled = Extract<TenantSProps['asyncData'], { readonly tag: 'fulfilled' }>['data'];
type TenantData = NonNullable<Fulfilled>;
type Tenant = NonNullable<TenantData['tenant']>;
type TenantStatus = Tenant['tenant_status'];
type TenantInsert = Parameters<TenantSProps['doSubmit']>[0];
type SubmitState = TenantSProps['submitState'];
type DeleteAction = TenantSProps['deleteAction'];
type NavLinkTo = TenantSProps['navLinkTo'];
type Leases = TenantSProps['leases'];
type Attachments = TenantSProps['attachments'];
type LeaseRow = Extract<Leases['asyncData'], { readonly tag: 'fulfilled' }>['data']['rows'][number];
type LeaseSortColumn = Leases['sort']['config']['column'];
type LeaseFilter = Leases['filter'];
type LeaseStatus = LeaseRow['lease_status'];

const LEASE_COLUMNS: readonly ColumnDef<LeaseSortColumn>[] = [
  { key: 'action', label: null, sortColumn: null, align: 'left', className: 'pl-4 w-10 pr-6' },
  { key: 'property', label: 'Nieruchomość', sortColumn: null, align: 'left', className: 'pl-4 pr-4' },
  { key: 'start_date', label: 'Od', sortColumn: 'start_date', align: 'left', className: 'pr-4 whitespace-nowrap' },
  { key: 'end_date', label: 'Do', sortColumn: 'end_date', align: 'left', className: 'pr-4 whitespace-nowrap' },
  { key: 'monthly_rent', label: 'Czynsz', sortColumn: 'monthly_rent', align: 'right', className: 'pr-4 whitespace-nowrap' },
  { key: 'lease_status', label: 'Status', sortColumn: 'lease_status', align: 'left', className: 'pr-4 whitespace-nowrap' },
];


const skeletonBar = 'h-4 animate-pulse rounded bg-gray-200';

const LEASE_SKELETON_ROWS = (
  <>
    {Array.from({ length: 4 }, (_, i) => (
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


const LEASE_EMPTY = (
  <EmptyStateS
    iconPath="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h8l5 5v11a2 2 0 01-2 2z"
    title="Brak umów najmu"
    description="Ten najemca nie posiada jeszcze żadnych umów."
  />
);


const buildLeaseFilterChips = (filter: LeaseFilter): readonly FilterChip[] => {
  const base: ReadonlyArray<{ readonly key: string; readonly label: string | null; readonly onRemove: () => void }> = Object.freeze([
    { key: 'status', label: (filter.config.status ?? '').length > 0 ? `Status: ${LEASE_STATUS_LABEL[(filter.config.status ?? '') as LeaseStatus] ?? (filter.config.status ?? '')}` : null, onRemove: () => filter.doFilter(setFilterString(filter.config, 'status', '')) },
    { key: 'dateFrom', label: (filter.config.dateFrom ?? '').length > 0 ? `Od: ${formatDate(filter.config.dateFrom ?? '')}` : null, onRemove: () => filter.doFilter(setFilterString(filter.config, 'dateFrom', '')) },
    { key: 'dateTo', label: (filter.config.dateTo ?? '').length > 0 ? `Do: ${formatDate(filter.config.dateTo ?? '')}` : null, onRemove: () => filter.doFilter(setFilterString(filter.config, 'dateTo', '')) },
  ]);
  return base.filter((c): c is FilterChip => c.label !== null);
};


type TenantDraft = {
  readonly first_name: string;
  readonly last_name: string;
  readonly email: string;
  readonly phone: string;
  readonly id_document_number: string;
  readonly emergency_contact_name: string;
  readonly emergency_contact_phone: string;
  readonly notes: string;
  readonly tenant_status: TenantStatus;
};

const toDraft = (t: Tenant): TenantDraft => ({
  first_name: t.first_name,
  last_name: t.last_name,
  email: t.email,
  phone: t.phone,
  id_document_number: t.id_document_number ?? '',
  emergency_contact_name: t.emergency_contact_name ?? '',
  emergency_contact_phone: t.emergency_contact_phone ?? '',
  notes: t.notes ?? '',
  tenant_status: t.tenant_status,
});

const EMPTY_DRAFT: TenantDraft = Object.freeze({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  id_document_number: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  notes: '',
  tenant_status: 'active',
});

const toInsert = (d: TenantDraft): TenantInsert => ({
  first_name: d.first_name,
  last_name: d.last_name,
  email: d.email,
  phone: d.phone,
  id_document_number: d.id_document_number === '' ? null : d.id_document_number,
  emergency_contact_name: d.emergency_contact_name === '' ? null : d.emergency_contact_name,
  emergency_contact_phone: d.emergency_contact_phone === '' ? null : d.emergency_contact_phone,
  notes: d.notes === '' ? null : d.notes,
  tenant_status: d.tenant_status,
});

type DetailContentProps = {
  readonly data: TenantData;
  readonly navLinkTo: NavLinkTo;
  readonly leases: Leases;
  readonly attachments: Attachments;
  readonly onEdit: () => void;
};

const DetailContent = ({
  data,
  navLinkTo,
  leases,
  attachments,
  onEdit,
}: DetailContentProps): JSX.Element => {
  const t = data.tenant;
  const leaseFilter = leases.filter;
  return t === null ? (
    <div className="flex items-center justify-center min-h-[300px]">
      <p className="text-sm text-gray-500">Nie znaleziono najemcy.</p>
    </div>
  ) : (
    <div className="mx-auto max-w-4xl space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div className="[&_a]:text-sm [&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline">
          {navLinkTo.toList({ style: {}, content: '← Powrót' })}
          <h1 className="mt-1 text-2xl font-bold text-gray-900">{t.first_name} {t.last_name}</h1>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onEdit} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Edytuj
          </button>
        </div>
      </div>

      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Dane osobowe</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div><p className={labelClass}>Status</p><span className={tenantStatusPillClass(t.tenant_status)}>{TENANT_STATUS_LABEL[t.tenant_status]}</span></div>
          <div><p className={labelClass}>Email</p><p className={valueClass}>{t.email}</p></div>
          <div><p className={labelClass}>Telefon</p><p className={valueClass}>{t.phone}</p></div>
          <div><p className={labelClass}>Nr dokumentu</p><p className={valueClass}>{t.id_document_number ?? '—'}</p></div>
          <div><p className={labelClass}>Kontakt awaryjny (imię i nazwisko)</p><p className={valueClass}>{t.emergency_contact_name ?? '—'}</p></div>
          <div><p className={labelClass}>Kontakt awaryjny (telefon)</p><p className={valueClass}>{t.emergency_contact_phone ?? '—'}</p></div>
        </div>
        {t.notes !== null ? <div className="mt-4"><p className={labelClass}>Notatki</p><p className={`${valueClass} mt-1 whitespace-pre-wrap`}>{t.notes}</p></div> : undefined}
      </div>

      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Umowy najmu</h2>
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
                <label htmlFor="tenant-lease-status" className={filterLabelClass}>Status</label>
                <select
                  id="tenant-lease-status"
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
                <label htmlFor="tenant-lease-date-from" className={filterLabelClass}>Od</label>
                <input
                  id="tenant-lease-date-from"
                  type="date"
                  value={leaseFilter.config.dateFrom ?? ''}
                  onChange={onFilterInput((v) => leaseFilter.doFilter(setFilterString(leaseFilter.config, 'dateFrom', v)))}
                  className={filterInputClass}
                />
              </div>
              <div>
                <label htmlFor="tenant-lease-date-to" className={filterLabelClass}>Do</label>
                <input
                  id="tenant-lease-date-to"
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
                {navLinkTo.toLease({ id: l.id, style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', borderRadius: '6px' }, content: '→', ariaLabel: 'Szczegóły umowy' })}
              </td>
              <td className="pl-4 h-12 py-0 pr-4 [&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline">
                {navLinkTo.toProperty({ id: l.property_id, style: {}, content: l.property.name })}
              </td>
              <td className="h-12 py-0 pr-4 [&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline">
                {navLinkTo.toLease({ id: l.id, style: {}, content: formatDate(l.start_date) })}
              </td>
              <td className="h-12 py-0 pr-4 text-gray-600 whitespace-nowrap">{l.end_date !== null ? formatDate(l.end_date) : '—'}</td>
              <td className="h-12 py-0 pr-4 text-right text-gray-900">{formatPln(l.monthly_rent)}</td>
              <td className="h-12 py-0 pr-4"><span className={leaseStatusPillClass(l.lease_status)}>{LEASE_STATUS_LABEL[l.lease_status] ?? l.lease_status}</span></td>
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
  readonly initial: TenantDraft;
  readonly submitState: SubmitState;
  readonly doSubmit: (newRecord: TenantInsert) => void;
  readonly deleteAction: DeleteAction;
  readonly onCancel: () => void;
};

const TenantForm = ({
  initial,
  submitState,
  doSubmit,
  deleteAction,
  onCancel,
}: FormProps): JSX.Element => {
  const [form, setForm] = useState<TenantDraft>(initial);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const setField = (field: keyof TenantDraft) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    doSubmit(toInsert(form));
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900">{deleteAction.tag === 'absent' ? 'Nowy najemca' : 'Edytuj najemcę'}</h1>
      {match(submitState)
        .with({ tag: 'idle' }, () => null)
        .with({ tag: 'submitting' }, () => null)
        .with({ tag: 'success' }, () => null)
        .with({ tag: 'error' }, ({ message }) => <FormErrorS message={message} />)
        .exhaustive()}
      <form onSubmit={handleSubmit} className={`${sectionClass} space-y-4`}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="tenant-first-name" className={formLabelClass}>Imię</label>
            <input id="tenant-first-name" name="first_name" type="text" required value={form.first_name} onChange={setField('first_name')} className={inputClass} />
          </div>
          <div>
            <label htmlFor="tenant-last-name" className={formLabelClass}>Nazwisko</label>
            <input id="tenant-last-name" name="last_name" type="text" required value={form.last_name} onChange={setField('last_name')} className={inputClass} />
          </div>
          <div>
            <label htmlFor="tenant-email" className={formLabelClass}>Email</label>
            <input id="tenant-email" name="email" type="email" required value={form.email} onChange={setField('email')} className={inputClass} />
          </div>
          <div>
            <label htmlFor="tenant-phone" className={formLabelClass}>Telefon</label>
            <input id="tenant-phone" name="phone" type="text" required value={form.phone} onChange={setField('phone')} className={inputClass} />
          </div>
          <div>
            <label htmlFor="tenant-document" className={formLabelClass}>Nr dokumentu</label>
            <input id="tenant-document" name="id_document_number" type="text" value={form.id_document_number} onChange={setField('id_document_number')} className={inputClass} />
          </div>
          <div>
            <label htmlFor="tenant-status" className={formLabelClass}>Status</label>
            <select id="tenant-status" name="tenant_status" value={form.tenant_status} onChange={setField('tenant_status')} className={inputClass}>
              {optionEntries(TENANT_STATUS_LABEL).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tenant-emergency-name" className={formLabelClass}>Kontakt awaryjny (imię i nazwisko)</label>
            <input id="tenant-emergency-name" name="emergency_contact_name" type="text" value={form.emergency_contact_name} onChange={setField('emergency_contact_name')} className={inputClass} />
          </div>
          <div>
            <label htmlFor="tenant-emergency-phone" className={formLabelClass}>Kontakt awaryjny (telefon)</label>
            <input id="tenant-emergency-phone" name="emergency_contact_phone" type="text" value={form.emergency_contact_phone} onChange={setField('emergency_contact_phone')} className={inputClass} />
          </div>
        </div>
        <div>
          <label htmlFor="tenant-notes" className={formLabelClass}>Notatki</label>
          <textarea id="tenant-notes" name="notes" rows={3} value={form.notes} onChange={setField('notes')} className={inputClass} />
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
                  aria-describedby="tenant-delete-blocked"
                  className="cursor-not-allowed rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-400"
                >
                  Usuń
                </button>
                <p id="tenant-delete-blocked" className="text-xs text-gray-500">{reason}</p>
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

const TenantDetail = ({
  data,
  navLinkTo,
  leases,
  attachments,
  doSubmit,
  deleteAction,
  onEditStart,
  submitState,
}: {
  readonly data: TenantData;
  readonly navLinkTo: NavLinkTo;
  readonly leases: Leases;
  readonly attachments: Attachments;
  readonly doSubmit: (newRecord: TenantInsert) => void;
  readonly deleteAction: DeleteAction;
  readonly onEditStart: () => void;
  readonly submitState: SubmitState;
}): JSX.Element => {
  const [editing, setEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const tenant = data.tenant;

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
      {match(tenant)
        .with(null, () => (
          <div className="flex items-center justify-center min-h-[300px]">
            <p className="text-sm text-gray-500">Nie znaleziono najemcy.</p>
          </div>
        ))
        .otherwise((t) =>
          editing ?
            <TenantForm
              initial={toDraft(t)}
              submitState={submitState}
              doSubmit={doSubmit}
              deleteAction={deleteAction}
              onCancel={() => setEditing(false)}
            /> :
            <DetailContent
              data={data}
              navLinkTo={navLinkTo}
              leases={leases}
              attachments={attachments}
              onEdit={() => { setEditing(true); setShowSuccess(false); onEditStart(); }}
            />
        )}
    </>
  );
};

export const TenantDetailS = (props: TenantSProps): JSX.Element => (
  <div className="flex min-h-[400px] flex-col">
    {match(props.asyncData)
      .with({ tag: 'pending' }, () => <LoadingSpinner />)
      .with({ tag: 'rejected' }, ({ message, onRetry }) => (<ErrorMessage message={message} onRetry={onRetry} />))
      .with({ tag: 'fulfilled' }, ({ data }) =>
        data === null ?
          <TenantForm
            initial={EMPTY_DRAFT}
            submitState={props.submitState}
            doSubmit={props.doSubmit}
            deleteAction={{ tag: 'absent' }}
            onCancel={props.doCancel}
          /> :
          <TenantDetail
            data={data}
            navLinkTo={props.navLinkTo}
            leases={props.leases}
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
