import type { FormEvent } from 'react';
import { match } from 'ts-pattern';
import type { FormProps } from '@/masterComponents/PropertiesSingle';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

export const extractPropertyInput = (formData: FormData): FormProps['data'] => ({
  name: (formData.get('name') as string) ?? '',
  address: (formData.get('address') as string) ?? '',
  property_type: (formData.get('property_type') as FormProps['data']['property_type']) ?? 'apartment',
  property_status: (formData.get('property_status') as FormProps['data']['property_status']) ?? 'available',
  monthly_rent: parseFloat((formData.get('monthly_rent') as string) ?? '0') || 0,
  deposit_amount: parseFloat((formData.get('deposit_amount') as string) ?? '0') || 0,
  size_sqm: formData.get('size_sqm') ? parseFloat(formData.get('size_sqm') as string) : null,
  bedrooms: formData.get('bedrooms') ? parseInt(formData.get('bedrooms') as string, 10) : null,
  notes: (formData.get('notes') as string) || null,
});

export type TypeLabelMap = Readonly<Record<FormProps['data']['property_type'], string>>;

export const TYPE_OPTIONS: TypeLabelMap = Object.freeze({
  apartment: 'Mieszkanie',
  house: 'Dom',
  commercial: 'Lokal',
  room: 'Pokój',
});

export type StatusLabelMap = Readonly<Record<FormProps['data']['property_status'], string>>;

export const STATUS_OPTIONS: StatusLabelMap = Object.freeze({
  available: 'Dostępna',
  occupied: 'Zajęta',
  inactive: 'Nieaktywna',
});

const inputClass = 'w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none';
const labelClass = 'mb-1 block text-sm font-medium text-gray-700';

type FormFieldsInnerProps = {
  readonly defaults: FormProps['data'];
  readonly isEditing: boolean;
  readonly onSubmit: (data: FormProps['data']) => void;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly onCancel: () => void;
};

const FormFieldsInner = ({
  defaults,
  isEditing,
  onSubmit,
  isLoading,
  error,
  onCancel,
}: FormFieldsInnerProps): JSX.Element => {
  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    onSubmit(extractPropertyInput(new FormData(e.currentTarget)));
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">
        {isEditing ? 'Edytuj nieruchomość' : 'Nowa nieruchomość'}
      </h2>

      <div>
        <label htmlFor="field-name" className={labelClass}>Nazwa</label>
        <input
          id="field-name"
          name="name"
          className={inputClass}
          type="text"
          required
          defaultValue={defaults.name}
        />
      </div>

      <div>
        <label htmlFor="field-address" className={labelClass}>Adres</label>
        <input
          id="field-address"
          name="address"
          className={inputClass}
          type="text"
          required
          defaultValue={defaults.address}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="field-type" className={labelClass}>Typ</label>
          <select
            id="field-type"
            name="property_type"
            className={inputClass}
            defaultValue={defaults.property_type}
          >
            {Object.entries(TYPE_OPTIONS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="field-status" className={labelClass}>Status</label>
          <select
            id="field-status"
            name="property_status"
            className={inputClass}
            defaultValue={defaults.property_status}
          >
            {Object.entries(STATUS_OPTIONS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="field-monthly_rent" className={labelClass}>Czynsz miesięczny (zł)</label>
          <input
            id="field-monthly_rent"
            name="monthly_rent"
            className={inputClass}
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={defaults.monthly_rent}
          />
        </div>

        <div>
          <label htmlFor="field-deposit_amount" className={labelClass}>Kaucja (zł)</label>
          <input
            id="field-deposit_amount"
            name="deposit_amount"
            className={inputClass}
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={defaults.deposit_amount}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="field-size_sqm" className={labelClass}>Powierzchnia (m²)</label>
          <input
            id="field-size_sqm"
            name="size_sqm"
            className={inputClass}
            type="number"
            min="0"
            step="0.01"
            defaultValue={defaults.size_sqm ?? ''}
          />
        </div>

        <div>
          <label htmlFor="field-bedrooms" className={labelClass}>Sypialnie</label>
          <input
            id="field-bedrooms"
            name="bedrooms"
            className={inputClass}
            type="number"
            min="0"
            defaultValue={defaults.bedrooms ?? ''}
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

export const PropertiesFormFields = (props: FormProps): JSX.Element =>
  match(props.fetchState)
    .with({ tag: 'pending' }, () => <LoadingSpinner />)
    .with({ tag: 'rejected' }, ({ message, onRetry }) => (
      <ErrorMessage message={message} onRetry={onRetry} />
    ))
    .with({ tag: 'fulfilled' }, ({ data }) => (
      <FormFieldsInner
        defaults={data}
        isEditing={props.isEditing}
        onSubmit={props.onSubmit}
        isLoading={props.isLoading}
        error={props.error}
        onCancel={props.onCancel}
      />
    ))
    .exhaustive();
