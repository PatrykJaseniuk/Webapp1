import { formatPln } from './format';

export type DashboardSummary = {
  readonly totalProperties: number;
  readonly occupiedProperties: number;
  readonly totalTenants: number;
  readonly activeTenants: number;
  readonly overdueItems: number;
  readonly totalUnpaidAmount: number;
  readonly cashOnHand: number;
};

export const cardLinkClass =
  'rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm transition-shadow hover:shadow-md';

export const statCardClass = 'rounded-lg border border-gray-200 bg-white p-4 text-center shadow-sm';
export const statValueClass = 'text-2xl font-bold';
export const statLabelClass = 'mt-1 text-xs text-gray-500';

export const navCardStyle = (): React.CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  minHeight: '96px',
  width: '100%',
  color: 'inherit',
  textDecoration: 'none',
  fontWeight: 500,
});

type IconProps = Readonly<{ readonly className: string }>;

const PropertiesIcon = ({ className }: IconProps): JSX.Element => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
  </svg>
);

const TenantsIcon = ({ className }: IconProps): JSX.Element => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);

const AlertIcon = ({ className }: IconProps): JSX.Element => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
);

const MoneyIcon = ({ className }: IconProps): JSX.Element => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
  </svg>
);

export const DashboardStatCardsS = ({ summary }: { readonly summary: DashboardSummary }): JSX.Element => (
  <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
    <div className={statCardClass}>
      <PropertiesIcon className="mx-auto mb-2 h-6 w-6 text-blue-700" />
      <p className={`${statValueClass} text-blue-700`}>
        {summary.occupiedProperties}
        <span className="ml-1 text-sm font-normal text-gray-500">/ {summary.totalProperties} zajętych</span>
      </p>
      <p className={statLabelClass}>Nieruchomości</p>
    </div>
    <div className={statCardClass}>
      <TenantsIcon className="mx-auto mb-2 h-6 w-6 text-green-700" />
      <p className={`${statValueClass} text-green-700`}>
        {summary.activeTenants}
        <span className="ml-1 text-sm font-normal text-gray-500">/ {summary.totalTenants} aktywnych</span>
      </p>
      <p className={statLabelClass}>Najemcy</p>
    </div>
    <div className={statCardClass}>
      <AlertIcon className="mx-auto mb-2 h-6 w-6 text-red-700" />
      <p className={`${statValueClass} text-red-700`}>
        {summary.overdueItems}
      </p>
      <p className={statLabelClass}>Zaległe pozycje</p>
    </div>
    <div className={statCardClass}>
      <MoneyIcon className="mx-auto mb-2 h-6 w-6 text-amber-700" />
      <p className={`${statValueClass} text-amber-700`}>
        {formatPln(summary.totalUnpaidAmount)}
      </p>
      <p className={statLabelClass}>Nieopłacone</p>
    </div>
    <div className={statCardClass}>
      <MoneyIcon className="mx-auto mb-2 h-6 w-6 text-emerald-700" />
      <p className={`${statValueClass} text-emerald-700`}>
        {formatPln(summary.cashOnHand)}
      </p>
      <p className={statLabelClass}>Stan skarbców</p>
    </div>
  </div>
);