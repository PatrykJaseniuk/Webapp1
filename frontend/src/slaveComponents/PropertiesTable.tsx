import { match } from 'ts-pattern';
import type { PropertyRow } from '@/masterComponents/PropertiesMany';
import type { SlaveDataState } from '@/generic';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

type StatusLabelMap = Readonly<Record<PropertyRow['property_status'], string>>;

export const STATUS_LABEL: StatusLabelMap = Object.freeze({
  available: 'Dostępna',
  occupied: 'Zajęta',
  inactive: 'Nieaktywna',
});

type TypeLabelMap = Readonly<Record<PropertyRow['property_type'], string>>;

export const TYPE_LABEL: TypeLabelMap = Object.freeze({
  apartment: 'Mieszkanie',
  house: 'Dom',
  commercial: 'Lokal',
  room: 'Pokój',
});

type Props = {
  readonly state: SlaveDataState<readonly PropertyRow[]>;
  readonly onDelete: (id: string) => void;
  readonly getEditUrl: (id: string) => string;
};

const TableBody = ({ properties, onDelete, getEditUrl }: { readonly properties: readonly PropertyRow[]; readonly onDelete: (id: string) => void; readonly getEditUrl: (id: string) => string }): JSX.Element =>
  properties.length === 0 ?
    <p className="py-8 text-center text-gray-500">Brak nieruchomości.</p> :
    (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-200 text-sm text-gray-500">
              <th className="py-3 pr-4 font-medium">Nazwa</th>
              <th className="py-3 pr-4 font-medium">Adres</th>
              <th className="py-3 pr-4 font-medium">Typ</th>
              <th className="py-3 pr-4 font-medium">Status</th>
              <th className="py-3 pr-4 font-medium text-right">Czynsz</th>
              <th className="py-3 text-right font-medium">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((p: PropertyRow) => (
              <tr key={p.id} className="border-b border-gray-100 text-sm">
                <td className="py-3 pr-4 font-medium text-gray-900">{p.name}</td>
                <td className="py-3 pr-4 text-gray-600">{p.address}</td>
                <td className="py-3 pr-4 text-gray-600">{TYPE_LABEL[p.property_type]}</td>
                <td className="py-3 pr-4 text-gray-600">{STATUS_LABEL[p.property_status]}</td>
                <td className="py-3 pr-4 text-right text-gray-900">
                  {p.monthly_rent.toLocaleString('pl-PL')} zł
                </td>
                <td className="py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <a
                      href={getEditUrl(p.id)}
                      className="rounded px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                    >
                      Edytuj
                    </a>
                    <button
                      type="button"
                      onClick={() => { onDelete(p.id); }}
                      className="rounded px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Usuń
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

export const PropertiesTable = ({ state, onDelete, getEditUrl }: Props): JSX.Element =>
  match(state)
    .with({ tag: 'pending' }, () => <LoadingSpinner />)
    .with({ tag: 'rejected' }, ({ message, onRetry }) => (
      <ErrorMessage message={message} onRetry={onRetry} />
    ))
    .with({ tag: 'fulfilled' }, ({ data }) => (
      <TableBody properties={data} onDelete={onDelete} getEditUrl={getEditUrl} />
    ))
    .exhaustive();
