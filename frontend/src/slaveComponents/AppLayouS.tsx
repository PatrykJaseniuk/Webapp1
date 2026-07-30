import { match } from 'ts-pattern';
import type { ReactNode } from 'react';
import type { AppLayoutSProps } from '@/masterComponents/AppLayoutM';
import { LoadingSpinner } from './LoadingSpinnerS';
import { ErrorMessage } from './ErrorMessageS';

// ── Inferred type from slave props ──

type AuthData = Extract<AppLayoutSProps['asyncData'], { tag: 'fulfilled' }>['data'];
type NavKey = AppLayoutSProps['activeNavKey'];

// ── Display labels for nav keys ──

type UnionKeys<T> = T extends T ? keyof T : never;
type LinkKey = UnionKeys<AppLayoutSProps['navLinkTo']>;
const NAV_LABEL: { readonly [K in LinkKey]: string } = {
  dashboard: 'Dashboard',
  properties: 'Properties',
  tenants: 'Tenants',
  leases: 'Leases',
  transactions: 'Transakcje',
};

const NAV_KEY_ORDER: readonly LinkKey[] = [
  'dashboard',
  'properties',
  'tenants',
  'leases',
  'transactions',
];

// ── Authenticated shell (inner) ──

type AuthenticatedShellProps = {
  readonly navLinksTo: AppLayoutSProps['navLinkTo'];
  readonly activeNavKey: NavKey;
  readonly authData: AuthData;
  readonly onLogout: () => void;
  readonly children: ReactNode;
};

const AuthenticatedShell = ({
  navLinksTo,
  activeNavKey,
  authData,
  onLogout,
  children,
}: AuthenticatedShellProps): JSX.Element => (
  <div className="flex h-screen bg-white">
    {/* Sidebar */}
    <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-6 py-4">
        <h1 className="text-lg font-bold text-gray-900">WebApp</h1>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-4 [&_a]:block [&_a]:rounded-md [&_a]:px-3 [&_a]:py-2 [&_a]:text-sm [&_a]:font-medium">
        {NAV_KEY_ORDER.filter((k) => k in navLinksTo).map((key) => {
          const navLink = navLinksTo[key as keyof typeof navLinksTo] as (
            args: { readonly content: ReactNode; readonly style: Record<string, string> },
          ) => JSX.Element;
          const isActive = key === activeNavKey;
          return (
            <div
              key={key}
              className={
                isActive ?
                  '[&_a]:rounded-md [&_a]:bg-gray-100 [&_a]:text-gray-900 [&_a]:font-semibold' :
                  '[&_a]:rounded-md [&_a]:text-gray-700 hover:[&_a]:bg-gray-100 hover:[&_a]:text-gray-900'
              }
            >
              {navLink({
                content: NAV_LABEL[key as LinkKey] ?? key,
                style: {},
              })}
            </div>
          );
        })}
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

// ── Component ──

export const AppLayoutShell = ({
  navLinkTo: navLinksTo,
  activeNavKey,
  asyncData,
  onLogout,
  children,
}: AppLayoutSProps): JSX.Element => (
  <div className="min-h-screen">
    {match(asyncData)
      .with({ tag: 'pending' }, () => <LoadingSpinner />)
      .with({ tag: 'rejected' }, ({ message, onRetry }) => (
        <ErrorMessage message={message} onRetry={onRetry} />
      ))
      .with({ tag: 'fulfilled' }, ({ data }) => (
        <AuthenticatedShell
          navLinksTo={navLinksTo}
          activeNavKey={activeNavKey}
          authData={data}
          onLogout={onLogout}
        >
          {children}
        </AuthenticatedShell>
      ))
      .exhaustive()}
  </div>
);