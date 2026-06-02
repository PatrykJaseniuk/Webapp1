import type { Property } from '@/domain';

type PropertiesListProps = {
  readonly properties: readonly Property[];
  readonly onEdit: (property: Property) => void;
  readonly onDelete: (id: string) => void;
};

const STATUS_COLORS: Record<string, string> = {
  available: 'bg-green-100 text-green-800',
  occupied: 'bg-blue-100 text-blue-800',
};

const STATUS_DEFAULT = 'bg-gray-100 text-gray-800';

const TYPE_LABELS: Record<string, string> = {
  apartment: 'Mieszkanie',
  house: 'Dom',
  commercial: 'Lokal',
  room: 'Pokój',
};

const formatPLN = (value: number): string =>
  `${value.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł`;

export const PropertiesList = ({
  properties,
  onEdit,
  onDelete,
}: PropertiesListProps): JSX.Element => (
  <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
    <table className="min-w-full divide-y divide-gray-200 text-sm">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-4 py-3 text-left font-medium text-gray-600">Nazwa</th>
          <th className="px-4 py-3 text-left font-medium text-gray-600">Typ</th>
          <th className="px-4 py-3 text-left font-medium text-gray-600">Adres</th>
          <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
          <th className="px-4 py-3 text-right font-medium text-gray-600">Czynsz</th>
          <th className="px-4 py-3 text-right font-medium text-gray-600">Kaucja</th>
          <th className="px-4 py-3 text-center font-medium text-gray-600">Akcje</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {properties.map((property) => (
          <tr key={property.id} className="hover:bg-gray-50">
            <td className="px-4 py-2.5 font-medium text-gray-900">{property.name}</td>
            <td className="px-4 py-2.5 text-gray-600">
              {TYPE_LABELS[property.property_type] ?? property.property_type}
            </td>
            <td className="px-4 py-2.5 text-gray-600">{property.address}</td>
            <td className="px-4 py-2.5">
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[property.property_status] ?? STATUS_DEFAULT}`}
              >
                {property.property_status}
              </span>
            </td>
            <td className="px-4 py-2.5 text-right text-gray-600">
              {formatPLN(property.monthly_rent)}
            </td>
            <td className="px-4 py-2.5 text-right text-gray-600">
              {formatPLN(property.deposit_amount)}
            </td>
            <td className="px-4 py-2.5 text-center">
              <button
                type="button"
                onClick={() => onEdit(property)}
                className="mr-2 rounded px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
              >
                Edytuj
              </button>
              <button
                type="button"
                onClick={() => onDelete(property.id)}
                className="rounded px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
              >
                Usuń
              </button>
            </td>
          </tr>
        ))}
        {properties.length === 0 && (
          <tr>
            <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
              Brak nieruchomości
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);