import { match } from 'ts-pattern';
import type { PropertiesSProps } from '@/masterComponents/PropertiesM';
import { LoadingSpinner } from './LoadingSpinnerS';
import { ErrorMessage } from './ErrorMessageS';

type Row = Extract<PropertiesSProps['asyncData'], { tag: 'fulfilled' }>['data'][number];
type NavLinkTo = PropertiesSProps['navLinkTo'];
type PropertyStatus = NonNullable<Row['property_status']>;
type PropertyType = NonNullable<Row['property_type']>;

export const STATUS_LABEL: Readonly<Record<PropertyStatus, string>> = Object.freeze({
  available: 'Dostępna',
  occupied: 'Zajęta',
  inactive: 'Nieaktywna',
});

export const TYPE_LABEL: Readonly<Record<PropertyType, string>> = Object.freeze({
  apartment: 'Mieszkanie',
  house: 'Dom',
  commercial: 'Lokal',
  room: 'Pokój',
});

type TableBodyProps = {
  readonly properties: readonly Row[];
  readonly navLinkTo: NavLinkTo;
};

const TableBody = ({
  properties,
  navLinkTo,
}: TableBodyProps): JSX.Element =>
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
            {properties.map((p) => (
              <tr
                key={p.id ?? ''}
                className="cursor-pointer border-b border-gray-100 text-sm hover:bg-blue-50"
              >
                <td className="py-3 pr-4 font-medium text-gray-900 [&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline">
                  {navLinkTo.property({ id: p.id ?? '', style: {}, content: p.name ?? '' })}
                </td>
                <td className="py-3 pr-4 text-gray-600">{p.address}</td>
                <td className="py-3 pr-4 text-gray-600">
                  {p.property_type !== null ?
                    TYPE_LABEL[p.property_type] :
                    <span className="text-gray-400">—</span>}
                </td>
                <td className="py-3 pr-4 text-gray-600 [&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline">
                  {p.current_tenant_name !== null && p.tenant_id !== null ?
                    navLinkTo.tenant({ id: p.tenant_id, style: {}, content: p.current_tenant_name }) :
                    <span className="text-gray-400">—</span>}
                </td>
                <td className="py-3 pr-4 text-gray-600">
                  {p.property_status !== null ?
                    STATUS_LABEL[p.property_status] :
                    <span className="text-gray-400">—</span>}
                </td>
                <td className="py-3 pr-4 text-right text-gray-900">
                  {(p.monthly_rent ?? 0).toLocaleString('pl-PL')} zł
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

export const PropertiesS = ({ asyncData, navLinkTo }: PropertiesSProps): JSX.Element => (
  <div className="min-h-[300px]">
    {match(asyncData)
      .with({ tag: 'pending' }, () => <LoadingSpinner />)
      .with({ tag: 'rejected' }, ({ message, onRetry }) => (
        <ErrorMessage message={message} onRetry={onRetry} />
      ))
      .with({ tag: 'fulfilled' }, ({ data }) => (
        <TableBody
          properties={data}
          navLinkTo={navLinkTo}
        />
      ))
      .exhaustive()}
  </div>
);