import type { ReactNode, ComponentType } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/hooks/AuthContext';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { AsyncData } from '@/generic';

// ── Auth data extracted for the shell ──

type AuthData = Readonly<{
  email: string;
}>;

// ── Shell props (defined here so slave can import from master) ──

export type AppLayoutSProps = {
  readonly sidebarLinks: readonly JSX.Element[];
  readonly asyncData: AsyncData<AuthData>;
  readonly onLogout: () => void;
  readonly children: ReactNode;
};

// ── Display labels for nav keys ──

const LABELS: Readonly<Record<string, string>> = {
  dashboard: 'Dashboard',
  properties: 'Properties',
  tenants: 'Tenants',
  leases: 'Leases',
  transactions: 'Transakcje',
  contracts: 'Umowy',
  payments: 'Płatności',
};

// ── Nav key → absolute URL ──

const navKeyToUrl: Readonly<Record<string, string>> = {
  dashboard: '/app',
  properties: '/app/properties',
  tenants: '/app/tenants',
  leases: '/app/leases',
  transactions: '/app/transactions',
  contracts: '/app/leases',
  payments: '/app/transactions',
};

// ── Component ──

type Props = {
  readonly children: ReactNode;
  readonly Slave: ComponentType<AppLayoutSProps>;
  readonly navKeys: readonly string[];
};

export const AppLayoutM = ({
  children,
  Slave,
  navKeys,
}: Props): JSX.Element => {
  const authState = useAuth();
  const navigate = useNavigate();

  const handleLogout = (): void => {
    void backendConnector.auth.signOut().then(() => {
      void navigate({ to: '/login' });
    });
  };

  const asyncData: AsyncData<AuthData> =
    authState.tag === 'loading' ?
      { tag: 'pending' } :
      authState.tag === 'authenticated' ?
        { tag: 'fulfilled', data: { email: authState.email } } :
        { tag: 'rejected', message: 'Unauthenticated', onRetry: () => window.location.reload() };

  const sidebarLinks: readonly JSX.Element[] =
    navKeys.map((key) => (
      <Link
        key={key}
        to={navKeyToUrl[key] ?? '/app'}
      >
        {LABELS[key] ?? key}
      </Link>
    ));

  return (
    <Slave
      sidebarLinks={sidebarLinks}
      asyncData={asyncData}
      onLogout={handleLogout}
    >
      {children}
    </Slave>
  );
};
