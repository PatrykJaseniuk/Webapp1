import { match } from 'ts-pattern';
import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { TreasurySProps, TreasuryInsertInput } from '@/masterComponents/TreasuryM';
import { LoadingSpinner } from './LoadingSpinnerS';
import { ErrorMessage } from './ErrorMessageS';
import { buttonClass, FormErrorS, inputClass, labelClass as formLabelClass } from './formUi';
import { formatDate, formatPln } from './format';

type Data = NonNullable<Extract<TreasurySProps['asyncData'], { readonly tag: 'fulfilled' }>['data']>;
type SubmitState = TreasurySProps['submitState'];
type DeleteAction = TreasurySProps['deleteAction'];

const sectionClass = 'rounded-lg border border-gray-200 bg-white p-6 shadow-sm';
const sectionTitleClass = 'mb-4 text-lg font-semibold text-gray-900';
const labelClass = 'text-xs uppercase tracking-wide text-gray-500';
const valueClass = 'text-sm text-gray-900';

const activePillClass = (isActive: boolean): string =>
  `inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
    isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
  }`;

type Draft = {
  readonly name: string;
  readonly is_active: boolean;
};

const toDraft = (d: Data): Draft => ({
  name: d.treasury?.name ?? '',
  is_active: d.treasury?.is_active ?? true,
});

const EMPTY_DRAFT: Draft = Object.freeze({ name: '', is_active: true });

const toInput = (d: Draft): TreasuryInsertInput => ({
  name: d.name,
  is_active: d.is_active,
});

type FormProps = {
  readonly initial: Draft;
  readonly submitState: SubmitState;
  readonly doSubmit: (newRecord: TreasuryInsertInput) => void;
  readonly deleteAction: DeleteAction;
  readonly onCancel: () => void;
};

const TreasuryForm = ({
  initial,
  submitState,
  doSubmit,
  deleteAction,
  onCancel,
}: FormProps): JSX.Element => {
  const [form, setForm] = useState<Draft>(initial);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const setName = (e: ChangeEvent<HTMLInputElement>): void => {
    setForm((prev) => ({ ...prev, name: e.target.value }));
  };

  const setActive = (e: ChangeEvent<HTMLInputElement>): void => {
    setForm((prev) => ({ ...prev, is_active: e.target.checked }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    doSubmit(toInput(form));
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900">
        {deleteAction.tag === 'absent' ? 'Nowy skarbiec' : 'Edytuj skarbiec'}
      </h1>
      {match(submitState)
        .with({ tag: 'error' }, ({ message }) => <FormErrorS message={message} />)
        .otherwise(() => null)}
      <form onSubmit={handleSubmit} className={`${sectionClass} space-y-4`}>
        <div>
          <label htmlFor="treasury-name" className={formLabelClass}>Nazwa</label>
          <input
            id="treasury-name"
            name="name"
            type="text"
            required
            value={form.name}
            onChange={setName}
            className={inputClass}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            id="treasury-active"
            name="is_active"
            type="checkbox"
            checked={form.is_active}
            onChange={setActive}
            className="h-4 w-4 rounded border-gray-300"
          />
          <label htmlFor="treasury-active" className="text-sm text-gray-700">
            Aktywny (nieaktywne skarbce nie pojawiają się na listach wyboru)
          </label>
        </div>
        <div className="flex items-center justify-between gap-4 pt-2">
          <div className="flex gap-2">
            <button type="submit" disabled={submitState.tag === 'submitting'} className={buttonClass}>
              {submitState.tag === 'submitting' ? 'Przetwarzanie...' : 'Zapisz'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={submitState.tag === 'submitting'}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Anuluj
            </button>
          </div>
          {match(deleteAction)
            .with({ tag: 'absent' }, () => null)
            .with({ tag: 'blocked' }, ({ reason }) => (
              <p className="max-w-sm text-right text-xs text-gray-500">{reason}</p>
            ))
            .with({ tag: 'allowed' }, ({ doDelete }) =>
              confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">Usunąć?</span>
                  <button type="button" onClick={doDelete} className="rounded-md bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700">
                    Tak, usuń
                  </button>
                  <button type="button" onClick={() => setConfirmDelete(false)} className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700">
                    Nie
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirmDelete(true)} className="rounded-md border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50">
                  Usuń
                </button>
              ),
            )
            .exhaustive()}
        </div>
      </form>
    </div>
  );
};

type DetailProps = {
  readonly data: Data;
  readonly navLinkTo: TreasurySProps['navLinkTo'];
  readonly onEditStart: () => void;
};

const TreasuryDetail = ({ data, navLinkTo, onEditStart }: DetailProps): JSX.Element => {
  const t = data.treasury;
  return t === null ? (
    <p className="py-8 text-center text-gray-500">Nie znaleziono skarbca.</p>
  ) : (
    <div className="mx-auto max-w-3xl space-y-6 py-8">
      <div className="flex items-start justify-between">
        <div>
          <span className="[&_a]:text-sm [&_a]:text-blue-600 hover:[&_a]:underline">
            {navLinkTo.toList({ style: {}, content: '← Wróć do listy' })}
          </span>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">{t.name}</h1>
          <p className={`mt-2 ${activePillClass(t.is_active)}`}>
            <span aria-hidden="true">{t.is_active ? '●' : '○'}</span>
            {t.is_active ? 'Aktywny' : 'Nieaktywny'}
          </p>
        </div>
        <button type="button" onClick={onEditStart} className={buttonClass}>
          Edytuj
        </button>
      </div>

      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Stan skarbca</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <p className={labelClass}>Saldo</p>
            <p className={`text-sm font-semibold ${data.balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {formatPln(data.balance)}
            </p>
          </div>
          <div>
            <p className={labelClass}>Liczba zapisów</p>
            <p className={valueClass}>{data.entryCount}</p>
          </div>
          <div>
            <p className={labelClass}>Ostatni ruch</p>
            <p className={valueClass}>
              {data.lastValueDate !== null ? formatDate(data.lastValueDate) : '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const TreasuryDetailS = ({
  asyncData,
  doSubmit,
  deleteAction,
  doCancel,
  onEditStart,
  submitState,
  navLinkTo,
}: TreasurySProps): JSX.Element => {
  const [editing, setEditing] = useState(false);

  const startEdit = (): void => {
    onEditStart();
    setEditing(true);
  };

  const cancelEdit = (): void => {
    setEditing(false);
    doCancel();
  };

  return (
    <div className="min-h-[400px]">
      {match(asyncData)
        .with({ tag: 'pending' }, () => (
          <div className="flex min-h-[400px] items-center justify-center">
            <LoadingSpinner />
          </div>
        ))
        .with({ tag: 'rejected' }, ({ message, onRetry }) => (
          <div className="flex min-h-[400px] items-center justify-center">
            <ErrorMessage message={message} onRetry={onRetry} />
          </div>
        ))
        .with({ tag: 'fulfilled' }, ({ data }) =>
          data === null ? (
            <TreasuryForm
              initial={EMPTY_DRAFT}
              submitState={submitState}
              doSubmit={doSubmit}
              deleteAction={deleteAction}
              onCancel={cancelEdit}
            />
          ) : editing ? (
            <TreasuryForm
              initial={toDraft(data)}
              submitState={submitState}
              doSubmit={doSubmit}
              deleteAction={deleteAction}
              onCancel={cancelEdit}
            />
          ) : (
            <TreasuryDetail data={data} navLinkTo={navLinkTo} onEditStart={startEdit} />
          ),
        )
        .exhaustive()}
    </div>
  );
};
