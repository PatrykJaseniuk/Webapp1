import { useState } from 'react';
import type { Tables, TablesInsert, Enums } from '@/volatile0/infra';
import { Constants } from '@/volatile0/infra';
import { formEditing, formSubmitting, formSuccess, formError, setField } from '@/volatile0/generic';
import type { FormState } from '@/volatile0/generic';

type TenantFormData = {
  readonly first_name: string;
  readonly last_name: string;
  readonly email: string;
  readonly phone: string;
  readonly tenant_status: string;
  readonly id_document_number: string;
  readonly emergency_contact_name: string;
  readonly emergency_contact_phone: string;
  readonly notes: string;
};

const emptyFormData = (): TenantFormData => ({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  tenant_status: 'active',
  id_document_number: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  notes: '',
});

const tenantToFormData = (tenant: Tables<'tenants'>): TenantFormData => ({
  first_name: tenant.first_name,
  last_name: tenant.last_name,
  email: tenant.email,
  phone: tenant.phone,
  tenant_status: tenant.tenant_status,
  id_document_number: tenant.id_document_number ?? '',
  emergency_contact_name: tenant.emergency_contact_name ?? '',
  emergency_contact_phone: tenant.emergency_contact_phone ?? '',
  notes: tenant.notes ?? '',
});

const formDataToInsert = (data: Readonly<TenantFormData>): TablesInsert<'tenants'> => ({
  first_name: data.first_name,
  last_name: data.last_name,
  email: data.email,
  phone: data.phone,
  tenant_status: data.tenant_status as Enums<'tenant_status'>,
  id_document_number: data.id_document_number || null,
  emergency_contact_name: data.emergency_contact_name || null,
  emergency_contact_phone: data.emergency_contact_phone || null,
  notes: data.notes || null,
});

type TenantFormProps = {
  readonly tenant?: Tables<'tenants'>;
  readonly onSubmit: (data: TablesInsert<'tenants'>) => Promise<void>;
  readonly onCancel: () => void;
};

const fieldClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

const STATUS_LABELS: Record<string, string> = {
  active: 'Aktywny',
  past: 'Były',
  applicant: 'Kandydat',
};

export const TenantForm = ({
  tenant,
  onSubmit,
  onCancel,
}: TenantFormProps): JSX.Element => {
  const [form, setForm] = useState<FormState<TenantFormData>>(
    tenant ? formEditing(tenantToFormData(tenant)) : formEditing(emptyFormData()),
  );

  const handleChange = <K extends keyof TenantFormData>(
    key: K,
    value: TenantFormData[K],
  ): void => {
    form.tag === 'editing' ?
      setForm(formEditing(setField(form.data, key, value))) :
      undefined;
  };

  const handleSubmit = (): void => {
    form.tag === 'editing' ?
      (() => {
        setForm(formSubmitting(form.data));
        const insert = formDataToInsert(form.data);
        onSubmit(insert)
          .then(() => setForm(formSuccess(form.data)))
          .catch((err: unknown) => {
            const message = err instanceof Error ? err.message : 'Błąd zapisu';
            setForm(formError(form.data, message));
          });
      })() :
      undefined;
  };

  const isEditing = form.tag === 'editing';
  const isSubmitting = form.tag === 'submitting';
  const disabled = !isEditing || isSubmitting;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        {tenant ? 'Edytuj najemcę' : 'Dodaj najemcę'}
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Imię *</label>
          <input
            type="text"
            className={fieldClass}
            value={form.tag !== 'idle' ? form.data.first_name : ''}
            disabled={disabled}
            onChange={(e) => handleChange('first_name', e.target.value)}
            placeholder="Jan"
          />
        </div>

        <div>
          <label className={labelClass}>Nazwisko *</label>
          <input
            type="text"
            className={fieldClass}
            value={form.tag !== 'idle' ? form.data.last_name : ''}
            disabled={disabled}
            onChange={(e) => handleChange('last_name', e.target.value)}
            placeholder="Kowalski"
          />
        </div>

        <div>
          <label className={labelClass}>Email *</label>
          <input
            type="email"
            className={fieldClass}
            value={form.tag !== 'idle' ? form.data.email : ''}
            disabled={disabled}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="jan@example.com"
          />
        </div>

        <div>
          <label className={labelClass}>Telefon *</label>
          <input
            type="text"
            className={fieldClass}
            value={form.tag !== 'idle' ? form.data.phone : ''}
            disabled={disabled}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="+48 123 456 789"
          />
        </div>

        <div>
          <label className={labelClass}>Status</label>
          <select
            className={fieldClass}
            value={form.tag !== 'idle' ? form.data.tenant_status : 'active'}
            disabled={disabled}
            onChange={(e) => handleChange('tenant_status', e.target.value)}
          >
            {Constants.public.Enums.tenant_status.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s] ?? s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Nr dokumentu</label>
          <input
            type="text"
            className={fieldClass}
            value={form.tag !== 'idle' ? form.data.id_document_number : ''}
            disabled={disabled}
            onChange={(e) => handleChange('id_document_number', e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass}>Kontakt alarmowy — imię i nazwisko</label>
          <input
            type="text"
            className={fieldClass}
            value={form.tag !== 'idle' ? form.data.emergency_contact_name : ''}
            disabled={disabled}
            onChange={(e) => handleChange('emergency_contact_name', e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass}>Kontakt alarmowy — telefon</label>
          <input
            type="text"
            className={fieldClass}
            value={form.tag !== 'idle' ? form.data.emergency_contact_phone : ''}
            disabled={disabled}
            onChange={(e) => handleChange('emergency_contact_phone', e.target.value)}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Notatki</label>
          <textarea
            className={fieldClass}
            rows={3}
            value={form.tag !== 'idle' ? form.data.notes : ''}
            disabled={disabled}
            onChange={(e) => handleChange('notes', e.target.value)}
          />
        </div>
      </div>

      {form.tag === 'error' && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {form.message}
        </p>
      )}

      <div className="mt-4 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Anuluj
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isEditing}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Zapisywanie...' : tenant ? 'Zapisz zmiany' : 'Dodaj'}
        </button>
      </div>
    </div>
  );
};