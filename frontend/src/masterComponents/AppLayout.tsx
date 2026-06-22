import type { ReactNode, ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, type AppRole } from '@/hooks/AuthContext';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { NavItem } from '@/generic';
import { LoadingSpinner } from '@/slaveComponents/LoadingSpinner';

// ── Shell props (defined here so slave can import from master) ──

export type AppLayoutShellProps = {
  readonly navItems: ReadonlyArray<NavItem>;
  readonly email: string;
  readonly onLogout: () => void;
  readonly children: ReactNode;
};

// ── Default navigation links ──

const NAV_LINKS: Record<AppRole, ReadonlyArray<NavItem>> = {
  admin: [
    { label: 'Dashboard', to: '/admin' },
    { label: 'Properties', to: '/admin/properties' },
    { label: 'Tenants', to: '/admin/tenants' },
  ],
  landlord: [
    { label: 'Dashboard', to: '/landlord' },
    { label: 'Properties', to: '/landlord/properties' },
    { label: 'Tenants', to: '/landlord/tenants' },
  ],
  tenant: [
    { label: 'Dashboard', to: '/tenant' },
    { label: 'Contracts', to: '/tenant/contracts' },
    { label: 'Payments', to: '/tenant/payments' },
  ],
};

// ── Component ──

type Props = {
  readonly children: ReactNode;
  readonly Shell: ComponentType<AppLayoutShellProps>;
  readonly navLinks?: Record<AppRole, ReadonlyArray<NavItem>>;
};

export const AppLayout = ({
  children,
  Shell,
  navLinks = NAV_LINKS,
}: Props): JSX.Element => {
  const authState = useAuth();

  const navigate = useNavigate();

  const handleLogout = (): void => {
    void backendConnector.auth.signOut().then(() => {
      navigate('/login');
    });
  };

  return authState.tag === 'authenticated' ?
    (
      <Shell
        navItems={navLinks[authState.role]}
        email={authState.email}
        onLogout={handleLogout}
      >
        {children}
      </Shell>
    ) :
    authState.tag === 'loading' ?
      <LoadingSpinner /> :
      <>{children}</>;
};
