import type { ReactNode, ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/AuthContext';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { AsyncData } from '@/generic';

// ── Auth data extracted for the shell ──

type AuthData = Readonly<{
  email: string;
}>;

// ── Navigation item: raw data, slave renders NavLink ──

export type NavItem = Readonly<{
  to: string;
  label: string;
}>;

// ── Shell props (defined here so slave can import from master) ──

export type AppLayoutSProps = {
  readonly navItems: readonly NavItem[];
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

// ── Component ──

type Props = {
  readonly children: ReactNode;
  readonly Slave: ComponentType<AppLayoutSProps>;
  readonly navItems: Readonly<Record<string, string>>;
  readonly loginTo: string;
};

export const AppLayoutM = ({
  children,
  Slave,
  navItems,
  loginTo,
}: Props): JSX.Element => {
  const authState = useAuth();

  const navigate = useNavigate();

  const handleLogout = (): void => {
    void backendConnector.auth.signOut().then(() => {
      navigate(loginTo);
    });
  };

  const asyncData: AsyncData<AuthData> =
    authState.tag === 'loading' ?
      { tag: 'pending' } :
    authState.tag === 'authenticated' ?
      { tag: 'fulfilled', data: { email: authState.email } } :
      { tag: 'rejected', message: 'Unauthenticated', onRetry: () => window.location.reload() };

  const builtNavItems: readonly NavItem[] = Object.entries(navItems).map(
    ([key, to]) => ({ to, label: LABELS[key] ?? key }),
  );

  return (
    <Slave
      navItems={builtNavItems}
      asyncData={asyncData}
      onLogout={handleLogout}
    >
      {children}
    </Slave>
  );
};
