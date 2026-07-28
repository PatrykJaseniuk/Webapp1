import { match } from 'ts-pattern';
import type { ReactNode } from 'react';
import type { AppLayoutSProps } from '@/masterComponents/AppLayoutM';
import { LoadingSpinner } from './LoadingSpinnerS';
import { ErrorMessage } from './ErrorMessageS';

// ── Inferred type from slave props ──

type AuthData = Extract<AppLayoutSProps['asyncData'], { tag: 'fulfilled' }>['data'];

// ── Authenticated shell (inner) ──

type AuthenticatedShellProps = {
  readonly sidebarLinks: AppLayoutSProps['sidebarLinks'];
  readonly authData: AuthData;
  readonly onLogout: () => void;
  readonly children: ReactNode;
};

const AuthenticatedShell = ({
  sidebarLinks,
  authData,
  onLogout,
  children,
}: AuthenticatedShellProps): JSX.Element => (
  <div className="flex h-screen bg-gray-50">
    {/* Sidebar */}
    <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-6 py-4">
        <h1 className="text-lg font-bold text-gray-900">WebApp</h1>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-4 [&_a]:block [&_a]:rounded-md [&_a]:px-3 [&_a]:py-2 [&_a]:text-sm [&_a]:font-medium [&_a]:text-gray-700 hover:[&_a]:bg-gray-100 hover:[&_a]:text-gray-900">
        {sidebarLinks}
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
  sidebarLinks,
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
          sidebarLinks={sidebarLinks}
          authData={data}
          onLogout={onLogout}
        >
          {children}
        </AuthenticatedShell>
      ))
      .exhaustive()}
  </div>
);