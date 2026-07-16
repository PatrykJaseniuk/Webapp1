import { match } from 'ts-pattern';
import type { AppLayoutSProps } from '@/masterComponents/AppLayoutM';
import { LoadingSpinner } from './LoadingSpinnerS';
import { ErrorMessage } from './ErrorMessageS';

// ── Inferred type from slave props ──

type AuthData = Extract<AppLayoutSProps['asyncData'], { tag: 'fulfilled' }>['data'];

// ── Display labels (human-readable strings owned by the slave) ──

const LABELS: Readonly<Record<string, string>> = {
  dashboard: 'Dashboard',
  properties: 'Properties',
  tenants: 'Tenants',
  contracts: 'Contracts',
  payments: 'Payments',
};

// ── Tailwind classes ──

const sidebarLinkClass = (isActive: boolean): string =>
  `block rounded-md px-3 py-2 text-sm font-medium ${isActive ?
    'bg-blue-100 text-blue-700' :
    'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
  }`;

// ── Authenticated shell (inner) ──

const AuthenticatedShell = ({
  navItems,
  authData,
  onLogout,
  children,
  activeTo,
}: {
  readonly navItems: Readonly<Record<string, string>>;
  readonly authData: AuthData;
  readonly onLogout: () => void;
  readonly children: import('react').ReactNode;
  readonly activeTo: string;
}): JSX.Element => {
  const entries = Object.entries(navItems);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h1 className="text-lg font-bold text-gray-900">WebApp</h1>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-4">
          {entries.map(([key, to]) => (
            <a
              key={key}
              href={to}
              className={sidebarLinkClass(to === activeTo)}
            >
              {LABELS[key] ?? key}
            </a>
          ))}
        </nav>

        {/* User info — bottom of sidebar */}
        <div className="border-t border-gray-200 px-4 py-3">
          <span className="block truncate text-sm text-gray-600">{authData.email}</span>
          <button
            type="button"
            onClick={onLogout}
            className="mt-2 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Wyloguj
          </button>
        </div>
      </aside>

      {/* Main area */}
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  );
};

// ── Component ──

export const AppLayoutShell = ({
  navItems,
  asyncData,
  onLogout,
  children,
  activeTo,
}: AppLayoutSProps): JSX.Element => (
  <div className="min-h-screen">
    {match(asyncData)
      .with({ tag: 'pending' }, () => <LoadingSpinner />)
      .with({ tag: 'rejected' }, ({ message, onRetry }) => (
        <ErrorMessage message={message} onRetry={onRetry} />
      ))
      .with({ tag: 'fulfilled' }, ({ data }) => (
        <AuthenticatedShell
          navItems={navItems}
          authData={data}
          onLogout={onLogout}
          activeTo={activeTo}
        >
          {children}
        </AuthenticatedShell>
      ))
      .exhaustive()}
  </div>
);