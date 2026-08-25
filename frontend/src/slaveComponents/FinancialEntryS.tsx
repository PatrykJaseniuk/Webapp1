import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { match } from 'ts-pattern';
import type { TransactionSProps } from '@/masterComponents/TransactionM';
import { LoadingSpinner } from './LoadingSpinnerS';
import { ErrorMessage } from './ErrorMessageS';
import { formatDate, formatPln } from './format';
import { labelClass, sectionClass, sectionTitleClass, valueClass } from './detail';
import { FormErrorS, inputClass, labelClass as formLabelClass } from './formUi';

type Fulfilled = Extract<TransactionSProps['asyncData'], { readonly tag: 'fulfilled' }>['data'];
type TransactionData = NonNullable<Fulfilled>;
type Transaction = NonNullable<TransactionData['transaction']>;
type FormOptions = TransactionSProps['formOptions'];
type TransactionInsert = Parameters<TransactionSProps['doSubmit']>[0];
type SubmitState = TransactionSProps['submitState'];
type DeleteAction = TransactionSProps['deleteAction'];
type NavLinkTo = TransactionSProps['navLinkTo'];

type DetailContentProps = {
  readonly data: TransactionData;
  readonly navLinkTo: NavLinkTo;
  readonly onEdit: () => void;
};

const DetailContent = ({
  data,
  navLinkTo,
  onEdit,
}: DetailContentProps): JSX.Element => {
  const t = data.transaction;
  return t === null ? (
    <div className="flex items-center justify-center min-h-[300px]">
      <p className="text-sm text-gray-500">Nie znaleziono transakcji.</p>
    </div>
  ) : (
    <div className="mx-auto max-w-4xl space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div className="[&_a]:text-sm [&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline">
          {navLinkTo.toList({ style: {}, content: '← Powrót' })}
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Transakcja</h1>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onEdit} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Edytuj
          </button>
        </div>
      </div>

      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Dane transakcji</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div><p className={labelClass}>Kwota</p><p className={`text-sm font-semibold ${t.amount >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatPln(t.amount)}</p></div>
          <div><p className={labelClass}>Termin płatności</p><p className={valueClass}>{formatDate(t.due_date)}</p></div>
          {t.property_id !== null && data.propertyName !== null ?
            <div><p className={labelClass}>Nieruchomość</p><span className="[&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline">{navLinkTo.toProperty({ id: t.property_id, style: {}, content: data.propertyName })}</span></div> :
            undefined}
          {t.lease_id !== null && data.leaseDescription !== null ?
            <div><p className={labelClass}>Umowa</p><span className="[&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline">{navLinkTo.toLease({ id: t.lease_id, style: {}, content: data.leaseDescription })}</span></div> :
            undefined}
        </div>
        <div className="mt-4"><p className={labelClass}>Opis</p><p className={`${valueClass} mt-1`}>{t.description}</p></div>
      </div>
    </div>
  );
};

type TransactionDraft = {
  readonly description: string;
  readonly amount: string;
  readonly due_date: string;
  readonly lease_id: string;
  readonly property_id: string;
};

const toDraft = (t: Transaction): TransactionDraft => ({
  description: t.description,
  amount: String(t.amount),
  due_date: t.due_date,
  lease_id: t.lease_id ?? '',
  property_id: t.property_id ?? '',
});

const EMPTY_DRAFT: TransactionDraft = Object.freeze({
  description: '',
  amount: '',
  due_date: '',
  lease_id: '',
  property_id: '',
});

const toInsert = (d: TransactionDraft): TransactionInsert => ({
  description: d.description,
  amount: d.amount === '' ? 0 : Number(d.amount),
  due_date: d.due_date,
  lease_id: d.lease_id === '' ? null : d.lease_id,
  property_id: d.property_id === '' ? null : d.property_id,
});

type FormProps = {
  readonly initial: TransactionDraft;
  readonly formOptions: FormOptions;
  readonly submitState: SubmitState;
  readonly doSubmit: (newRecord: TransactionInsert) => void;
  readonly deleteAction: DeleteAction;
  readonly onCancel: () => void;
};

const TransactionForm = ({
  initial,
  formOptions,
  submitState,
  doSubmit,
  deleteAction,
  onCancel,
}: FormProps): JSX.Element => {
  const [form, setForm] = useState<TransactionDraft>(initial);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const setField = (field: keyof TransactionDraft) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    doSubmit(toInsert(form));
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900">{deleteAction.tag === 'absent' ? 'Nowa transakcja' : 'Edytuj transakcję'}</h1>
      {match(submitState)
        .with({ tag: 'idle' }, () => null)
        .with({ tag: 'submitting' }, () => null)
        .with({ tag: 'success' }, () => null)
        .with({ tag: 'error' }, ({ message }) => <FormErrorS message={message} />)
        .exhaustive()}
      <form onSubmit={handleSubmit} className={`${sectionClass} space-y-4`}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="txn-amount" className={formLabelClass}>Kwota (zł)</label>
            <input id="txn-amount" name="amount" type="number" step="0.01" required value={form.amount} onChange={setField('amount')} className={inputClass} />
          </div>
          <div>
            <label htmlFor="txn-due-date" className={formLabelClass}>Termin płatności</label>
            <input id="txn-due-date" name="due_date" type="date" required value={form.due_date} onChange={setField('due_date')} className={inputClass} />
          </div>
        </div>
        {match(formOptions)
          .with({ tag: 'pending' }, () => (
            <div className="flex items-center justify-center min-h-[120px]">
              <LoadingSpinner />
            </div>
          ))
          .with({ tag: 'rejected' }, ({ message, onRetry }) => (
            <ErrorMessage message={message} onRetry={onRetry} />
          ))
          .with({ tag: 'fulfilled' }, ({ data: options }) => {
            const selectedLease = form.lease_id !== '' ? options.leases.find((l) => l.id === form.lease_id) : undefined;
            const matchingPropertyId = selectedLease !== undefined ? selectedLease.propertyId : null;
            const matchingLeaseIds = form.property_id !== ''
              ? options.leases.filter((l) => l.propertyId === form.property_id).map((l) => l.id)
              : [];
            return (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="txn-property" className={formLabelClass}>Nieruchomość (opcjonalnie)</label>
                  <select id="txn-property" name="property_id" value={form.property_id} onChange={setField('property_id')} className={inputClass}>
                    <option value="">—</option>
                    {options.properties.map((p) => (
                      <option key={p.id} value={p.id}>{p.id === matchingPropertyId ? `✓ ${p.label}` : p.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="txn-lease" className={formLabelClass}>Umowa (opcjonalnie)</label>
                  <select id="txn-lease" name="lease_id" value={form.lease_id} onChange={setField('lease_id')} className={inputClass}>
                    <option value="">—</option>
                    {options.leases.map((l) => (
                      <option key={l.id} value={l.id}>{matchingLeaseIds.includes(l.id) ? `✓ ${l.label}` : l.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })
          .exhaustive()}
        <div>
          <label htmlFor="txn-description" className={formLabelClass}>Opis</label>
          <textarea id="txn-description" name="description" rows={3} required value={form.description} onChange={setField('description')} className={inputClass} />
        </div>
        <div className="flex items-center justify-between gap-4 pt-2">
          <div className="flex gap-2">
            <button type="submit" disabled={submitState.tag === 'submitting'} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {submitState.tag === 'submitting' ? 'Przetwarzanie...' : 'Zapisz'}
            </button>
            <button type="button" onClick={onCancel} disabled={submitState.tag === 'submitting'} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              Anuluj
            </button>
          </div>
          {match(deleteAction)
            .with({ tag: 'absent' }, () => null)
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

const TransactionDetail = ({
  data,
  navLinkTo,
  formOptions,
  doSubmit,
  deleteAction,
  onEditStart,
  submitState,
}: {
  readonly data: TransactionData;
  readonly navLinkTo: NavLinkTo;
  readonly formOptions: FormOptions;
  readonly doSubmit: (newRecord: TransactionInsert) => void;
  readonly deleteAction: DeleteAction;
  readonly onEditStart: () => void;
  readonly submitState: SubmitState;
}): JSX.Element => {
  const [editing, setEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const transaction = data.transaction;

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
      {match(transaction)
        .with(null, () => (
          <div className="flex items-center justify-center min-h-[300px]">
            <p className="text-sm text-gray-500">Nie znaleziono transakcji.</p>
          </div>
        ))
        .otherwise((t) =>
          editing ?
            <TransactionForm
              initial={toDraft(t)}
              formOptions={formOptions}
              submitState={submitState}
              doSubmit={doSubmit}
              deleteAction={deleteAction}
              onCancel={() => setEditing(false)}
            /> :
            <DetailContent
              data={data}
              navLinkTo={navLinkTo}
              onEdit={() => { setEditing(true); setShowSuccess(false); onEditStart(); }}
            />
        )}
    </>
  );
};

export const TransactionDetailS = (props: TransactionSProps): JSX.Element => (
  <div className="flex min-h-[400px] flex-col">
    {match(props.asyncData)
      .with({ tag: 'pending' }, () => <LoadingSpinner />)
      .with({ tag: 'rejected' }, ({ message, onRetry }) => (<ErrorMessage message={message} onRetry={onRetry} />))
      .with({ tag: 'fulfilled' }, ({ data }) =>
        data === null ?
          <TransactionForm
            initial={EMPTY_DRAFT}
            formOptions={props.formOptions}
            submitState={props.submitState}
            doSubmit={props.doSubmit}
            deleteAction={{ tag: 'absent' }}
            onCancel={props.doCancel}
          /> :
          <TransactionDetail
            data={data}
            navLinkTo={props.navLinkTo}
            formOptions={props.formOptions}
            doSubmit={props.doSubmit}
            deleteAction={props.deleteAction}
            onEditStart={props.onEditStart}
            submitState={props.submitState}
          />
      )
      .exhaustive()}
  </div>
);
