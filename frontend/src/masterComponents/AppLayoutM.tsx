import type { ReactNode, ComponentType } from 'react';
import { Link, useNavigate, useLocation } from '@tanstack/react-router';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { AsyncData, NavLink } from '@/generic';
import type { AppRole } from '@/hooks/AuthContext';
import { match } from 'ts-pattern';

// ── Auth data extracted for the shell ──

type AuthData = Readonly<{
  readonly email: string;
}>;

// ── Shell props (defined here so slave can import from master) ──

type AdminLandlordNavLInkTo = {
  readonly dashboard: NavLink,
  readonly properties: NavLink,
  readonly tenants: NavLink,
  readonly leases: NavLink,
  readonly financialEntries: NavLink,
  readonly treasuries: NavLink,
}

type TenantNavLInkTo = {
  readonly dashboard: NavLink,
  readonly leases: NavLink,
  readonly financialEntries: NavLink,
}

type NavKey = 'dashboard' | 'properties' | 'tenants' | 'leases' | 'financialEntries' | 'treasuries';

export type AppLayoutSProps = {
  readonly navLinkTo: AdminLandlordNavLInkTo | TenantNavLInkTo;
  readonly activeNavKey: NavKey;
  readonly asyncData: AsyncData<AuthData>;
  readonly onLogout: () => void;
  readonly children: ReactNode;
};

// ── Component ──

type Props = {
  readonly children: ReactNode;
  readonly Slave: ComponentType<AppLayoutSProps>;
  readonly role: AppRole;
  readonly email: string;
};

export const AppLayoutM = ({
  children,
  Slave,
  role,
  email,
}: Props): JSX.Element => {
  const navigate = useNavigate();
  const location = useLocation();

  const activeNavKey: NavKey = (
    location.pathname === '/app' || location.pathname === '/app/' ?
      'dashboard' :
      location.pathname.startsWith('/app/properties') ?
        'properties' :
        location.pathname.startsWith('/app/tenants') ?
          'tenants' :
          location.pathname.startsWith('/app/leases') ?
            'leases' :
            location.pathname.startsWith('/app/treasuries') ?
              'treasuries' :
              'financialEntries');

  const handleLogout = (): void => {
    void backendConnector.auth.signOut().then(() => {
      void navigate({ to: '/login' });
    });
  };

  const asyncData: AsyncData<AuthData> = {
    tag: 'fulfilled',
    data: { email },
  };



  const adminLandlordNavLinksTo: AdminLandlordNavLInkTo =
  {
    dashboard: ({ content, style }) => <Link to="/app" style={style}>{content}</Link>,
    properties: ({ content, style }) => <Link to="/app/properties" style={style}>{content}</Link>,
    tenants: ({ content, style }) => <Link to="/app/tenants" style={style}>{content}</Link>,
    leases: ({ content, style }) => <Link to="/app/leases" style={style}>{content}</Link>,
    financialEntries: ({ content, style }) => <Link to="/app/financial-entries" style={style}>{content}</Link>,
    treasuries: ({ content, style }) => <Link to="/app/treasuries" style={style}>{content}</Link>,
  };

  const tenantNavLinksTo: TenantNavLInkTo =
  {
    dashboard: ({ content, style }) => <Link to="/app" style={style}>{content}</Link>,
    leases: ({ content, style }) => <Link to="/app/leases" style={style}>{content}</Link>,
    financialEntries: ({ content, style }) => <Link to="/app/financial-entries" style={style}>{content}</Link>,
  }

  const navLinkTo = match(role)
    .with('admin', () => adminLandlordNavLinksTo)
    .with('landlord', () => adminLandlordNavLinksTo)
    .with('tenant', () => tenantNavLinksTo)
    .exhaustive()

  return (
    <Slave
      navLinkTo={navLinkTo}
      activeNavKey={activeNavKey}
      asyncData={asyncData}
      onLogout={handleLogout}
    >
      {children}
    </Slave>
  );
};
