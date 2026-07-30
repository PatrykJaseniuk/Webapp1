import { match } from 'ts-pattern';
import type { PropertiesSProps } from '@/masterComponents/PropertiesM';
import { ErrorMessage } from './ErrorMessageS';
import { FetchProgress } from './FetchProgressS';
import { SortHeader, StaticHeaderCell, type ColumnDef } from './SortHeaderS';

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

const pillClass = 'inline-block rounded-full px-2 py-0.5 text-xs font-medium';

const statusPillClass = (status: PropertyStatus): string =>
  status === 'available' ?
    `${pillClass} bg-green-50 text-green-700` :
    status === 'occupied' ?
      `${pillClass} bg-blue-50 text-blue-700` :
      `${pillClass} bg-gray-50 text-gray-600`;

const COLUMNS: readonly ColumnDef<SortColumn>[] = [
  { key: 'action', label: null, sortColumn: null, align: 'left', className: 'pl-4 w-10 pr-6' },
  { key: 'name', label: 'Nazwa', sortColumn: 'name', align: 'left', className: 'w-[20%] pr-4' },
  { key: 'address', label: 'Adres', sortColumn: 'address', align: 'left', className: 'w-[20%] pr-4' },
  { key: 'property_type', label: 'Typ', sortColumn: 'property_type', align: 'left', className: 'w-[14%] pr-4' },
  { key: 'tenant', label: 'Najemca', sortColumn: null, align: 'left', className: 'w-[17%] pr-4' },
  { key: 'property_status', label: 'Status', sortColumn: 'property_status', align: 'left', className: 'w-[12%] pr-4' },
  { key: 'monthly_rent', label: 'Czynsz', sortColumn: 'monthly_rent', align: 'right', className: 'w-[12%] pr-4' },
];

type TableProps = {
  readonly properties: readonly Row[];
  readonly navLinkTo: NavLinkTo;
  readonly sort: Sort;
  readonly isFetching: boolean;
};

const skeletonBar = 'h-4 animate-pulse rounded bg-gray-200';

const SKELETON_ROWS = Array.from({ length: 6 }, (_, i) => (
  <tr key={`skel-${i}`} className="border-b border-gray-100">
    <td className="pl-4 h-12 py-0 pr-6"><div className={`${skeletonBar} w-6`} /></td>
    <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} w-32`} /></td>
    <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} w-36`} /></td>
    <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} w-20`} /></td>
    <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} w-24`} /></td>
    <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} w-20`} /></td>
    <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} ml-auto w-16`} /></td>
  </tr>
));

const SkeletonTable = (): JSX.Element => (
  <div className="relative overflow-x-auto">
    <FetchProgress />
    <table className="table-fixed border-collapse text-left">
      <thead>
        <tr className="border-b border-gray-200 text-sm">
          {COLUMNS.map((col) => (
            <StaticHeaderCell key={col.key} col={col} />
          ))}
        </tr>
      </thead>
      <tbody>{SKELETON_ROWS}</tbody>
    </table>
  </div>
);

const TableView = ({
  properties,
  navLinkTo,
  sort,
  isFetching,
}: TableProps): JSX.Element => (
  <div className="relative overflow-x-auto">
    {isFetching && <FetchProgress />}
    <table className="table-fixed border-collapse text-left">
      <thead>
        <tr className="border-b border-gray-200 text-sm">
          {COLUMNS.map((col) =>
            col.sortColumn !== null && col.label !== null ?
              <SortHeader
                key={col.key}
                className={col.className}
                column={col.sortColumn}
                label={col.label}
                sort={sort}
                align={col.align}
              /> :
              <StaticHeaderCell key={col.key} col={col} />)}
        </tr>
      </thead>
      <tbody>
        {properties.length === 0 ?
          <tr>
            <td colSpan={COLUMNS.length} className="py-12 text-center">
              <svg className="mx-auto mb-3 h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p className="text-sm font-medium text-gray-600">Brak nieruchomości do wyświetlenia</p>
              <p className="mt-1 text-xs text-gray-500">Dodaj pierwszą nieruchomość, aby zobaczyć ją na liście.</p>
            </td>
          </tr> :
          properties.map((p) => (
            <tr
              key={p.id ?? ''}
              className="group border-b border-gray-100 text-sm hover:bg-gray-50"
            >
              <td className="pl-4 h-12 py-0 pr-6 [&_a]:text-blue-600 hover:[&_a]:text-blue-800 focus-visible:[&_a]:outline-none focus-visible:[&_a]:ring-2 focus-visible:[&_a]:ring-blue-500">
                {navLinkTo.property({ id: p.id ?? '', style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', borderRadius: '6px' }, content: '→', ariaLabel: p.name !== null ? `Szczegóły nieruchomości: ${p.name}` : 'Szczegóły nieruchomości' })}
              </td>
              <td className="h-12 py-0 pr-4 font-medium text-gray-900 [&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline" title={p.name ?? undefined}>
                <div className="truncate">
                  {navLinkTo.property({ id: p.id ?? '', style: {}, content: p.name ?? '' })}
                </div>
              </td>
              <td className="h-12 py-0 pr-4 text-gray-600" title={p.address ?? undefined}>
                <div className="truncate">{p.address}</div>
              </td>
              <td className="h-12 py-0 pr-4 text-gray-600 whitespace-nowrap">
                {p.property_type !== null ?
                  TYPE_LABEL[p.property_type] :
                  <span className="text-gray-400">—</span>}
              </td>
              <td className="h-12 py-0 pr-4 text-gray-600 [&_a]:text-blue-600 hover:[&_a]:text-blue-800 hover:[&_a]:underline" title={p.current_tenant_name ?? undefined}>
                <div className="truncate">
                  {p.current_tenant_name !== null && p.tenant_id !== null ?
                    navLinkTo.tenant({ id: p.tenant_id, style: {}, content: p.current_tenant_name }) :
                    <span className="text-gray-400">—</span>}
                </div>
              </td>
              <td className="h-12 py-0 pr-4 whitespace-nowrap">
                {p.property_status !== null ?
                  <span className={statusPillClass(p.property_status)}>
                    {STATUS_LABEL[p.property_status] ?? p.property_status}
                  </span> :
                  <span className="text-gray-400">—</span>}
              </td>
              <td className="h-12 py-0 pr-4 text-right text-gray-900 whitespace-nowrap">
                {(p.monthly_rent ?? 0).toLocaleString('pl-PL')} zł
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  </div>
);

export const PropertiesS = ({ asyncData, navLinkTo, sort }: PropertiesSProps): JSX.Element => (
  <div className="min-h-[300px]">
    {match(asyncData)
      .with({ tag: 'pending' }, () => <SkeletonTable />)
      .with({ tag: 'rejected' }, ({ message, onRetry }) => (
        <ErrorMessage message={message} onRetry={onRetry} />
      ))
      .with({ tag: 'fulfilled' }, ({ data, isFetching }) => (
        <TableView properties={data} navLinkTo={navLinkTo} sort={sort} isFetching={isFetching ?? false} />
      ))
      .exhaustive()}
  </div>
);