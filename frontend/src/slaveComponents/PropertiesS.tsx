import { match } from 'ts-pattern';
import type { EnrichedPropertyRow } from '@/masterComponents/PropertiesM';
import type { SlaveDataState } from '@/generic';
import { LoadingSpinner } from './LoadingSpinnerS';
import { ErrorMessage } from './ErrorMessageS';

type StatusLabelMap = Readonly<Record<EnrichedPropertyRow['property_status'], string>>;

export const STATUS_LABEL: StatusLabelMap = Object.freeze({
  available: 'Dostępna',
  occupied: 'Zajęta',
  inactive: 'Nieaktywna',
});

type TypeLabelMap = Readonly<Record<EnrichedPropertyRow['property_type'], string>>;

export const TYPE_LABEL: TypeLabelMap = Object.freeze({
  apartment: 'Mieszkanie',
  house: 'Dom',
  commercial: 'Lokal',
  room: 'Pokój',
});

type Props = {
  readonly state: SlaveDataState<readonly EnrichedPropertyRow[]>;
  readonly getDetailUrl: (id: string) => string;
  readonly getTenantUrl: (tenantId: string) => string;
};

const TableBody = ({
  properties,
  getDetailUrl,
  getTenantUrl,
}: {
  readonly properties: readonly EnrichedPropertyRow[];
  readonly getDetailUrl: (id: string) => string;
  readonly getTenantUrl: (tenantId: string) => string;
}): JSX.Element =>
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
              <th className="py-3 pr-4 font-medium">Najemca</th>
              <th className="py-3 pr-4 font-medium">Status</th>
              <th className="py-3 pr-4 font-medium text-right">Czynsz</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((p: EnrichedPropertyRow) => (
              <tr key={p.id} className="border-b border-gray-100 text-sm">
                <td className="py-3 pr-4 font-medium text-gray-900">
                  <a href={getDetailUrl(p.id)} className="text-blue-600 hover:text-blue-800 hover:underline">
                    {p.name}
                  </a>
                </td>
                <td className="py-3 pr-4 text-gray-600">{p.address}</td>
                <td className="py-3 pr-4 text-gray-600">{TYPE_LABEL[p.property_type]}</td>
                <td className="py-3 pr-4 text-gray-600">
                  {p.currentTenantName !== null && p.currentTenantId !== null ?
                    <a
                      href={getTenantUrl(p.currentTenantId)}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {p.currentTenantName}
                    </a> :
                    <span className="text-gray-400">—</span>}
                </td>
                <td className="py-3 pr-4 text-gray-600">{STATUS_LABEL[p.property_status]}</td>
                <td className="py-3 pr-4 text-right text-gray-900">
                  {p.monthly_rent.toLocaleString('pl-PL')} zł
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

export const PropertiesS = ({ state, getDetailUrl, getTenantUrl }: Props): JSX.Element => (
  <div className="min-h-[300px]">
    {match(state)
      .with({ tag: 'pending' }, () => <LoadingSpinner />)
      .with({ tag: 'rejected' }, ({ message, onRetry }) => (
        <ErrorMessage message={message} onRetry={onRetry} />
      ))
      .with({ tag: 'fulfilled' }, ({ data }) => (
        <TableBody properties={data} getDetailUrl={getDetailUrl} getTenantUrl={getTenantUrl} />
      ))
      .exhaustive()}
  </div>
);