import { match } from 'ts-pattern';
import type { PropertiesSProps } from '@/masterComponents/PropertiesM';
import { LoadingSpinner } from './LoadingSpinnerS';
import { ErrorMessage } from './ErrorMessageS';

type Row = Extract<PropertiesSProps['asyncData'], { tag: 'fulfilled' }>['data'][number];
type NavLinkTo = PropertiesSProps['navLinkTo'];
type Sort = PropertiesSProps['sort'];
type SortColumn = Sort['config']['column'];
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

type SortHeaderProps = {
  readonly column: SortColumn;
  readonly label: string;
  readonly sort: Sort;
  readonly align?: 'left' | 'right';
};

const SortHeader = ({
  column,
  label,
  sort,
  align = 'left',
}: SortHeaderProps): JSX.Element => {
  const isActive = sort.config.column === column;
  const isAsc = isActive && sort.config.direction === 'asc';
  const isDesc = isActive && sort.config.direction === 'desc';
  const alignClass = align === 'right' ? 'text-right' : 'text-left';
  return (
    <th
      className={`cursor-pointer select-none py-3 pr-4 font-medium ${alignClass}`}
      onClick={() => sort.doSort(column)}
    >
      <span className="text-gray-500">{label}</span>
      <span className="ml-1 inline-block w-3 text-xs text-gray-400">
        {isAsc ? '▲' : isDesc ? '▼' : '△'}
      </span>
    </th>
  );
};

type TableProps = {
  readonly properties: readonly Row[];
  readonly navLinkTo: NavLinkTo;
  readonly sort: Sort;
};

const TableView = ({
  properties,
  navLinkTo,
  sort,
}: TableProps): JSX.Element => (
  <div className="overflow-x-auto">
    <table className="w-full border-collapse text-left">
      <thead>
        <tr className="border-b border-gray-200 text-sm">
          <SortHeader column="name" label="Nazwa" sort={sort} />
          <SortHeader column="address" label="Adres" sort={sort} />
          <SortHeader column="property_type" label="Typ" sort={sort} />
          <th className="py-3 pr-4 font-medium text-gray-500">Najemca</th>
          <SortHeader column="property_status" label="Status" sort={sort} />
          <SortHeader column="monthly_rent" label="Czynsz" sort={sort} align="right" />
        </tr>
      </thead>
      <tbody>
        {properties.length === 0 ?
          <tr>
            <td colSpan={6} className="py-8 text-center text-gray-500">
              Brak nieruchomości.
            </td>
          </tr> :
          properties.map((p) => (
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

const FetchProgress = (): JSX.Element => (
  <div className="h-0.5 w-full overflow-hidden bg-blue-100" role="progressbar" aria-label="Ładowanie danych">
    <div className="h-full animate-[indeterminate_1.5s_ease-in-out_infinite] bg-blue-500" />
  </div>
);

export const PropertiesS = ({ asyncData, isFetching, navLinkTo, sort }: PropertiesSProps): JSX.Element => (
  <div className="min-h-[300px]">
    {match(asyncData)
      .with({ tag: 'pending' }, () => <LoadingSpinner />)
      .with({ tag: 'rejected' }, ({ message, onRetry }) => (
        <ErrorMessage message={message} onRetry={onRetry} />
      ))
      .with({ tag: 'fulfilled' }, ({ data }) => (
        <>
          {isFetching && <FetchProgress />}
          <TableView properties={data} navLinkTo={navLinkTo} sort={sort} />
        </>
      ))
      .exhaustive()}
  </div>
);