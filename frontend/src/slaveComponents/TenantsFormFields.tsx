import type { FormEvent } from 'react';
import { match } from 'ts-pattern';
import type { FormProps, TenantStatus } from '@/masterComponents/TenantsSingle';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

export const extractTenantInput = (formData: FormData): FormProps['data'] => ({
  user_id: null,
  first_name: (formData.get('first_name') as string) ?? '',
  last_name: (formData.get('last_name') as string) ?? '',
  email: (formData.get('email') as string) ?? '',
  phone: (formData.get('phone') as string) ?? '',
  id_document_number: (formData.get('id_document_number') as string) || null,
  emergency_contact_name: (formData.get('emergency_contact_name') as string) || null,
  emergency_contact_phone: (formData.get('emergency_contact_phone') as string) || null,
  notes: (formData.get('notes') as string) || null,
  tenant_status: (formData.get('tenant_status') as TenantStatus) ?? 'active',
});

export type StatusLabelMap = Readonly<Record<TenantStatus, string>>;

export const STATUS_OPTIONS: StatusLabelMap = Object.freeze({
  active: 'Aktywny',
  past: 'Były',
  applicant: 'Kandydat',
});

const inputClass =
  'w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none';
const labelClass = 'mb-1 block text-sm font-medium text-gray-700';

type FormFieldsInnerProps = {
  readonly defaults: FormProps['data'];
  readonly isEditing: boolean;
  readonly onSave: (data: FormProps['data']) => void;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly onCancel: () => void;
};

const FormFieldsInner = ({
  defaults,
  isEditing,
  onSave,
  isLoading,
  error,
  onCancel,
}: FormFieldsInnerProps): JSX.Element => {
  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    onSave(extractTenantInput(new FormData(e.currentTarget)));
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-lg space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-gray-900">
        {isEditing ? 'Edytuj najemcę' : 'Nowy najemca'}
      </h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="field-first_name" className={labelClass}>Imię</label>
          <input
            id="field-first_name"
            name="first_name"
            className={inputClass}
            type="text"
            required
            defaultValue={defaults.first_name}
          />
        </div>

        <div>
          <label htmlFor="field-last_name" className={labelClass}>Nazwisko</label>
          <input
            id="field-last_name"
            name="last_name"
            className={inputClass}
            type="text"
            required
            defaultValue={defaults.last_name}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="field-email" className={labelClass}>Email</label>
          <input
            id="field-email"
            name="email"
            className={inputClass}
            type="email"
            required
            defaultValue={defaults.email}
          />
        </div>

        <div>
          <label htmlFor="field-phone" className={labelClass}>Telefon</label>
          <input
            id="field-phone"
            name="phone"
            className={inputClass}
            type="text"
            required
            defaultValue={defaults.phone}
          />
        </div>
      </div>

      <div>
        <label htmlFor="field-status" className={labelClass}>Status</label>
        <select
          id="field-status"
          name="tenant_status"
          className={inputClass}
          defaultValue={defaults.tenant_status}
        >
          {Object.entries(STATUS_OPTIONS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="field-id_document_number" className={labelClass}>Numer dokumentu tożsamości</label>
        <input
          id="field-id_document_number"
          name="id_document_number"
          className={inputClass}
          type="text"
          defaultValue={defaults.id_document_number ?? ''}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="field-emergency_contact_name" className={labelClass}>Kontakt awaryjny — imię i nazwisko</label>
          <input
            id="field-emergency_contact_name"
            name="emergency_contact_name"
            className={inputClass}
            type="text"
            defaultValue={defaults.emergency_contact_name ?? ''}
          />
        </div>

        <div>
          <label htmlFor="field-emergency_contact_phone" className={labelClass}>Kontakt awaryjny — telefon</label>
          <input
            id="field-emergency_contact_phone"
            name="emergency_contact_phone"
            className={inputClass}
            type="text"
            defaultValue={defaults.emergency_contact_phone ?? ''}
          />
        </div>
      </div>

      <div>
        <label htmlFor="field-notes" className={labelClass}>Notatki</label>
        <textarea
          id="field-notes"
          name="notes"
          className={inputClass}
          rows={3}
          defaultValue={defaults.notes ?? ''}
        />
      </div>

      {error !== null ?
        <p className="mt-1 text-xs text-red-600">{error}</p> :
        undefined}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Anuluj
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Zapisywanie...' : 'Zapisz'}
        </button>
      </div>
    </form>
  );
};

export const TenantsFormFields = (props: FormProps): JSX.Element => (
  <div className="min-h-[400px]">
    {match(props.fetchState)
      .with({ tag: 'pending' }, () => <LoadingSpinner />)
      .with({ tag: 'rejected' }, ({ message, onRetry }) => (
        <ErrorMessage message={message} onRetry={onRetry} />
      ))
      .with({ tag: 'fulfilled' }, ({ data }) => (
        <FormFieldsInner
          defaults={data}
          isEditing={props.isEditing}
          onSave={props.onSave}
          isLoading={props.isLoading}
          error={props.error}
          onCancel={props.onCancel}
        />
      ))
      .exhaustive()}
  </div>
);
