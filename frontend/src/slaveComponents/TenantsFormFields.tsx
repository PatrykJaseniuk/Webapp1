import { useState } from 'react';
import { match } from 'ts-pattern';
import { useNavigate } from 'react-router-dom';
import type { Database } from '@/backendConnector';
import { FormState, formEditing, formSubmitting, formError, setField } from '@/generic/form';

type TenantInsert = Database['public']['Tables']['tenants']['Insert'];
type TenantRow = Database['public']['Tables']['tenants']['Row'];
type TenantStatus = Database['public']['Enums']['tenant_status'];

type TenantInput = Readonly<Omit<TenantInsert, 'created_at' | 'updated_at'>>;

type Props = {
  readonly initial?: TenantRow;
  readonly onSave: (data: TenantInput) => Promise<Readonly<{ error?: string }>>;
};

export const emptyInput: TenantInput = Object.freeze({
  user_id: null,
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  id_document_number: null,
  emergency_contact_name: null,
  emergency_contact_phone: null,
  notes: null,
  tenant_status: 'active' as TenantStatus,
});

export const toInput = (row: TenantRow): TenantInput => ({
  user_id: row.user_id,
  first_name: row.first_name,
  last_name: row.last_name,
  email: row.email,
  phone: row.phone,
  id_document_number: row.id_document_number,
  emergency_contact_name: row.emergency_contact_name,
  emergency_contact_phone: row.emergency_contact_phone,
  notes: row.notes,
  tenant_status: row.tenant_status,
});

type StatusLabelMap = Readonly<Record<TenantStatus, string>>;

export const STATUS_OPTIONS: StatusLabelMap = Object.freeze({
  active: 'Aktywny',
  past: 'Były',
  applicant: 'Kandydat',
});

const inputClass = 'w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none';
const labelClass = 'mb-1 block text-sm font-medium text-gray-700';
const errorClass = 'mt-1 text-xs text-red-600';

export const TenantsFormFields = ({ initial, onSave }: Props): JSX.Element => {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState<TenantInput>>(
    initial !== undefined ? formEditing(toInput(initial)) : formEditing(emptyInput),
  );

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    match(form)
      .with({ tag: 'editing' }, ({ data }) => {
        setForm(formSubmitting(data));
        onSave(data).then((result) => {
          result.error !== undefined ?
            setForm(formError(data, result.error)) :
            navigate(-1);
        });
      })
      .otherwise(() => { /* ignore — already submitting or submitted */ });
  };

  const handleCancel = (): void => {
    navigate(-1);
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">
        {initial !== undefined ? 'Edytuj najemcę' : 'Nowy najemca'}
      </h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="field-first_name" className={labelClass}>Imię</label>
          <input
            id="field-first_name"
            className={inputClass}
            type="text"
            required
            value={
              form.tag === 'idle' ? '' : form.data.first_name
            }
            onChange={(e) => {
              match(form)
                .with({ tag: 'editing' }, ({ data }) => {
                  setForm(formEditing(setField(data, 'first_name', e.target.value)));
                })
                .otherwise(() => {});
            }}
          />
        </div>

        <div>
          <label htmlFor="field-last_name" className={labelClass}>Nazwisko</label>
          <input
            id="field-last_name"
            className={inputClass}
            type="text"
            required
            value={
              form.tag === 'idle' ? '' : form.data.last_name
            }
            onChange={(e) => {
              match(form)
                .with({ tag: 'editing' }, ({ data }) => {
                  setForm(formEditing(setField(data, 'last_name', e.target.value)));
                })
                .otherwise(() => {});
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="field-email" className={labelClass}>Email</label>
          <input
            id="field-email"
            className={inputClass}
            type="email"
            required
            value={
              form.tag === 'idle' ? '' : form.data.email
            }
            onChange={(e) => {
              match(form)
                .with({ tag: 'editing' }, ({ data }) => {
                  setForm(formEditing(setField(data, 'email', e.target.value)));
                })
                .otherwise(() => {});
            }}
          />
        </div>

        <div>
          <label htmlFor="field-phone" className={labelClass}>Telefon</label>
          <input
            id="field-phone"
            className={inputClass}
            type="text"
            required
            value={
              form.tag === 'idle' ? '' : form.data.phone
            }
            onChange={(e) => {
              match(form)
                .with({ tag: 'editing' }, ({ data }) => {
                  setForm(formEditing(setField(data, 'phone', e.target.value)));
                })
                .otherwise(() => {});
            }}
          />
        </div>
      </div>

      <div>
        <label htmlFor="field-status" className={labelClass}>Status</label>
        <select
          id="field-status"
          className={inputClass}
          value={
            form.tag === 'idle' ? 'active' : form.data.tenant_status
          }
          onChange={(e) => {
            match(form)
              .with({ tag: 'editing' }, ({ data }) => {
                setForm(formEditing(setField(data, 'tenant_status', e.target.value as TenantStatus)));
              })
              .otherwise(() => {});
          }}
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
          className={inputClass}
          type="text"
          value={
            form.tag === 'idle' ? '' : form.data.id_document_number ?? ''
          }
          onChange={(e) => {
            match(form)
              .with({ tag: 'editing' }, ({ data }) => {
                const val = e.target.value === '' ? null : e.target.value;
                setForm(formEditing(setField(data, 'id_document_number', val)));
              })
              .otherwise(() => {});
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="field-emergency_contact_name" className={labelClass}>Kontakt awaryjny — imię i nazwisko</label>
          <input
            id="field-emergency_contact_name"
            className={inputClass}
            type="text"
            value={
              form.tag === 'idle' ? '' : form.data.emergency_contact_name ?? ''
            }
            onChange={(e) => {
              match(form)
                .with({ tag: 'editing' }, ({ data }) => {
                  const val = e.target.value === '' ? null : e.target.value;
                  setForm(formEditing(setField(data, 'emergency_contact_name', val)));
                })
                .otherwise(() => {});
            }}
          />
        </div>

        <div>
          <label htmlFor="field-emergency_contact_phone" className={labelClass}>Kontakt awaryjny — telefon</label>
          <input
            id="field-emergency_contact_phone"
            className={inputClass}
            type="text"
            value={
              form.tag === 'idle' ? '' : form.data.emergency_contact_phone ?? ''
            }
            onChange={(e) => {
              match(form)
                .with({ tag: 'editing' }, ({ data }) => {
                  const val = e.target.value === '' ? null : e.target.value;
                  setForm(formEditing(setField(data, 'emergency_contact_phone', val)));
                })
                .otherwise(() => {});
            }}
          />
        </div>
      </div>

      <div>
        <label htmlFor="field-notes" className={labelClass}>Notatki</label>
        <textarea
          id="field-notes"
          className={inputClass}
          rows={3}
          value={
            form.tag === 'idle' ? '' : form.data.notes ?? ''
          }
          onChange={(e) => {
            match(form)
              .with({ tag: 'editing' }, ({ data }) => {
                const val = e.target.value === '' ? null : e.target.value;
                setForm(formEditing(setField(data, 'notes', val)));
              })
              .otherwise(() => {});
          }}
        />
      </div>

      {
        form.tag === 'error' ?
          <p className={errorClass}>{form.message}</p> :
          undefined
      }

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={handleCancel}
          className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Anuluj
        </button>
        <button
          type="submit"
          disabled={form.tag === 'submitting'}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {form.tag === 'submitting' ? 'Zapisywanie...' : 'Zapisz'}
        </button>
      </div>
    </form>
  );
};