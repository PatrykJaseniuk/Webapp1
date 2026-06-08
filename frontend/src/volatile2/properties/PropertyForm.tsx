import { useState } from 'react';
import type { Tables, TablesInsert, Enums } from '@/volatile0/infra';
import { Constants } from '@/volatile0/infra';
import { formEditing, formSubmitting, formSuccess, formError, setField } from '@/volatile0/generic';
import type { FormState } from '@/volatile0/generic';

type PropertyFormData = {
  readonly name: string;
  readonly address: string;
  readonly property_type: string;
  readonly size_sqm: string;
  readonly bedrooms: string;
  readonly monthly_rent: string;
  readonly deposit_amount: string;
  readonly property_status: string;
  readonly notes: string;
};

const emptyFormData = (): PropertyFormData => ({
  name: '',
  address: '',
  property_type: 'apartment',
  size_sqm: '',
  bedrooms: '',
  monthly_rent: '',
  deposit_amount: '',
  property_status: 'available',
  notes: '',
});

const propertyToFormData = (property: Tables<'properties'>): PropertyFormData => ({
  name: property.name,
  address: property.address,
  property_type: property.property_type,
  size_sqm: property.size_sqm?.toString() ?? '',
  bedrooms: property.bedrooms?.toString() ?? '',
  monthly_rent: property.monthly_rent.toString(),
  deposit_amount: property.deposit_amount.toString(),
  property_status: property.property_status,
  notes: property.notes ?? '',
});

const formDataToInsert = (data: Readonly<PropertyFormData>): TablesInsert<'properties'> => ({
  name: data.name,
  address: data.address,
  property_type: data.property_type as Enums<'property_type'>,
  property_status: data.property_status as Enums<'property_status'>,
  monthly_rent: parseFloat(data.monthly_rent) || 0,
  deposit_amount: parseFloat(data.deposit_amount) || 0,
  size_sqm: data.size_sqm ? parseFloat(data.size_sqm) : null,
  bedrooms: data.bedrooms ? parseInt(data.bedrooms, 10) : null,
  notes: data.notes || null,
});

type PropertyFormProps = {
  readonly property?: Tables<'properties'>;
  readonly onSubmit: (data: TablesInsert<'properties'>) => Promise<void>;
  readonly onCancel: () => void;
};

const fieldClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

const TYPE_LABELS: Record<string, string> = {
  apartment: 'Mieszkanie',
  house: 'Dom',
  commercial: 'Lokal',
  room: 'Pokój',
};

export const PropertyForm = ({
  property,
  onSubmit,
  onCancel,
}: PropertyFormProps): JSX.Element => {
  const [form, setForm] = useState<FormState<PropertyFormData>>(
    property ? formEditing(propertyToFormData(property)) : formEditing(emptyFormData()),
  );

  const handleChange = <K extends keyof PropertyFormData>(
    key: K,
    value: PropertyFormData[K],
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
        {property ? 'Edytuj nieruchomość' : 'Dodaj nieruchomość'}
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Nazwa *</label>
          <input
            type="text"
            className={fieldClass}
            value={form.tag !== 'idle' ? form.data.name : ''}
            disabled={disabled}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="np. Mieszkanie Kraków"
          />
        </div>

        <div>
          <label className={labelClass}>Typ *</label>
          <select
            className={fieldClass}
            value={form.tag !== 'idle' ? form.data.property_type : 'apartment'}
            disabled={disabled}
            onChange={(e) => handleChange('property_type', e.target.value)}
          >
            {Constants.public.Enums.property_type.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t] ?? t}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Adres *</label>
          <input
            type="text"
            className={fieldClass}
            value={form.tag !== 'idle' ? form.data.address : ''}
            disabled={disabled}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="ul. Przykładowa 1, Kraków"
          />
        </div>

        <div>
          <label className={labelClass}>Powierzchnia (m²)</label>
          <input
            type="number"
            className={fieldClass}
            value={form.tag !== 'idle' ? form.data.size_sqm : ''}
            disabled={disabled}
            onChange={(e) => handleChange('size_sqm', e.target.value)}
            step="0.01"
            min="0"
          />
        </div>

        <div>
          <label className={labelClass}>Sypialnie</label>
          <input
            type="number"
            className={fieldClass}
            value={form.tag !== 'idle' ? form.data.bedrooms : ''}
            disabled={disabled}
            onChange={(e) => handleChange('bedrooms', e.target.value)}
            min="0"
          />
        </div>

        <div>
          <label className={labelClass}>Czynsz miesięczny (zł) *</label>
          <input
            type="number"
            className={fieldClass}
            value={form.tag !== 'idle' ? form.data.monthly_rent : ''}
            disabled={disabled}
            onChange={(e) => handleChange('monthly_rent', e.target.value)}
            step="0.01"
            min="0"
          />
        </div>

        <div>
          <label className={labelClass}>Kaucja (zł) *</label>
          <input
            type="number"
            className={fieldClass}
            value={form.tag !== 'idle' ? form.data.deposit_amount : ''}
            disabled={disabled}
            onChange={(e) => handleChange('deposit_amount', e.target.value)}
            step="0.01"
            min="0"
          />
        </div>

        <div>
          <label className={labelClass}>Status</label>
          <select
            className={fieldClass}
            value={form.tag !== 'idle' ? form.data.property_status : 'available'}
            disabled={disabled}
            onChange={(e) => handleChange('property_status', e.target.value)}
          >
            {Constants.public.Enums.property_status.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
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
          {isSubmitting ? 'Zapisywanie...' : property ? 'Zapisz zmiany' : 'Dodaj'}
        </button>
      </div>
    </div>
  );
};