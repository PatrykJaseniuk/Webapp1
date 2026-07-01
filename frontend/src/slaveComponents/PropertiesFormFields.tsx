import { useState } from 'react';
import { match } from 'ts-pattern';
import { useNavigate } from 'react-router-dom';
import type { Database } from '@/backendConnector';
import { FormState, formEditing, formSubmitting, formError, setField } from '@/generic/form';

type PropertyInsert = Database['public']['Tables']['properties']['Insert'];
type PropertyRow = Database['public']['Tables']['properties']['Row'];
type PropertyType = Database['public']['Enums']['property_type'];
type PropertyStatus = Database['public']['Enums']['property_status'];

type PropertyInput = Readonly<Omit<PropertyInsert, 'created_at' | 'updated_at' | 'created_by'>>;

type Props = {
  readonly initial?: PropertyRow;
  readonly onSave: (data: PropertyInput) => Promise<Readonly<{ error?: string }>>;
};

export const emptyInput: PropertyInput = Object.freeze({
  name: '',
  address: '',
  property_type: 'apartment' as PropertyType,
  property_status: 'available' as PropertyStatus,
  monthly_rent: 0,
  deposit_amount: 0,
  size_sqm: null,
  bedrooms: null,
  notes: null,
});

export const toInput = (row: PropertyRow): PropertyInput => ({
  name: row.name,
  address: row.address,
  property_type: row.property_type,
  property_status: row.property_status,
  monthly_rent: row.monthly_rent,
  deposit_amount: row.deposit_amount,
  size_sqm: row.size_sqm,
  bedrooms: row.bedrooms,
  notes: row.notes,
});

export type TypeLabelMap = Readonly<Record<PropertyType, string>>;

export const TYPE_OPTIONS: TypeLabelMap = Object.freeze({
  apartment: 'Mieszkanie',
  house: 'Dom',
  commercial: 'Lokal',
  room: 'Pokój',
});

export type StatusLabelMap = Readonly<Record<PropertyStatus, string>>;

export const STATUS_OPTIONS: StatusLabelMap = Object.freeze({
  available: 'Dostępna',
  occupied: 'Zajęta',
  inactive: 'Nieaktywna',
});

const inputClass = 'w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none';
const labelClass = 'mb-1 block text-sm font-medium text-gray-700';
const errorClass = 'mt-1 text-xs text-red-600';

export const PropertiesFormFields = ({ initial, onSave }: Props): JSX.Element => {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState<PropertyInput>>(
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
        {initial !== undefined ? 'Edytuj nieruchomość' : 'Nowa nieruchomość'}
      </h2>

      <div>
        <label htmlFor="field-name" className={labelClass}>Nazwa</label>
        <input
          id="field-name"
          className={inputClass}
          type="text"
          required
          value={
            form.tag === 'idle' ? '' : form.data.name
          }
          onChange={(e) => {
            match(form)
              .with({ tag: 'editing' }, ({ data }) => {
                setForm(formEditing(setField(data, 'name', e.target.value)));
              })
              .otherwise(() => {});
          }}
        />
      </div>

      <div>
        <label htmlFor="field-address" className={labelClass}>Adres</label>
        <input
          id="field-address"
          className={inputClass}
          type="text"
          required
          value={
            form.tag === 'idle' ? '' : form.data.address
          }
          onChange={(e) => {
            match(form)
              .with({ tag: 'editing' }, ({ data }) => {
                setForm(formEditing(setField(data, 'address', e.target.value)));
              })
              .otherwise(() => {});
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="field-type" className={labelClass}>Typ</label>
          <select
            id="field-type"
            className={inputClass}
            value={
              form.tag === 'idle' ? 'apartment' : form.data.property_type
            }
            onChange={(e) => {
              match(form)
                .with({ tag: 'editing' }, ({ data }) => {
                  setForm(formEditing(setField(data, 'property_type', e.target.value as PropertyType)));
                })
                .otherwise(() => {});
            }}
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
            className={inputClass}
            value={
              form.tag === 'idle' ? 'available' : form.data.property_status
            }
            onChange={(e) => {
              match(form)
                .with({ tag: 'editing' }, ({ data }) => {
                  setForm(formEditing(setField(data, 'property_status', e.target.value as PropertyStatus)));
                })
                .otherwise(() => {});
            }}
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
            className={inputClass}
            type="number"
            min="0"
            step="0.01"
            required
            value={
              form.tag === 'idle' ? 0 : form.data.monthly_rent
            }
            onChange={(e) => {
              match(form)
                .with({ tag: 'editing' }, ({ data }) => {
                  setForm(formEditing(setField(data, 'monthly_rent', parseFloat(e.target.value) || 0)));
                })
                .otherwise(() => {});
            }}
          />
        </div>

        <div>
          <label htmlFor="field-deposit_amount" className={labelClass}>Kaucja (zł)</label>
          <input
            id="field-deposit_amount"
            className={inputClass}
            type="number"
            min="0"
            step="0.01"
            required
            value={
              form.tag === 'idle' ? 0 : form.data.deposit_amount
            }
            onChange={(e) => {
              match(form)
                .with({ tag: 'editing' }, ({ data }) => {
                  setForm(formEditing(setField(data, 'deposit_amount', parseFloat(e.target.value) || 0)));
                })
                .otherwise(() => {});
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="field-size_sqm" className={labelClass}>Powierzchnia (m²)</label>
          <input
            id="field-size_sqm"
            className={inputClass}
            type="number"
            min="0"
            step="0.01"
            value={
              form.tag === 'idle' ? '' : form.data.size_sqm ?? ''
            }
            onChange={(e) => {
              match(form)
                .with({ tag: 'editing' }, ({ data }) => {
                  const val = e.target.value === '' ? null : parseFloat(e.target.value);
                  setForm(formEditing(setField(data, 'size_sqm', val)));
                })
                .otherwise(() => {});
            }}
          />
        </div>

        <div>
          <label htmlFor="field-bedrooms" className={labelClass}>Sypialnie</label>
          <input
            id="field-bedrooms"
            className={inputClass}
            type="number"
            min="0"
            value={
              form.tag === 'idle' ? '' : form.data.bedrooms ?? ''
            }
            onChange={(e) => {
              match(form)
                .with({ tag: 'editing' }, ({ data }) => {
                  const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                  setForm(formEditing(setField(data, 'bedrooms', val)));
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