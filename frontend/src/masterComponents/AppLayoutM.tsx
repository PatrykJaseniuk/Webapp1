import type { ReactNode, ComponentType } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { AsyncData, NavLink } from '@/generic';
import type { AppRole } from '@/hooks/AuthContext';
import { match } from 'ts-pattern';

// ── Auth data extracted for the shell ──

type AuthData = Readonly<{
  email: string;
}>;

// ── Shell props (defined here so slave can import from master) ──

type AdminLandlordNavLInkTo = {
  dashboard: NavLink,
  properties: NavLink,
  tenants: NavLink,
  leases: NavLink,
  transactions: NavLink,
}

type TenantNavLInkTo = {
  dashboard: NavLink,
  leases: NavLink,
  transactions: NavLink,
}

export type AppLayoutSProps = {
  readonly navLinkTo: AdminLandlordNavLInkTo | TenantNavLInkTo
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
    transactions: ({ content, style }) => <Link to="/app/transactions" style={style}>{content}</Link>,
  };

  const tenantNavLinksTo: TenantNavLInkTo =
  {
    dashboard: ({ content, style }) => <Link to="/app" style={style}>{content}</Link>,
    leases: ({ content, style }) => <Link to="/app/leases" style={style}>{content}</Link>,
    transactions: ({ content, style }) => <Link to="/app/transactions" style={style}>{content}</Link>,
  }

  const navLinkTo = match(role)
    .with('admin', () => adminLandlordNavLinksTo)
    .with('landlord', () => adminLandlordNavLinksTo)
    .with('tenant', () => tenantNavLinksTo)
    .exhaustive()

  return (
    <Slave
      navLinkTo={navLinkTo}
      asyncData={asyncData}
      onLogout={handleLogout}
    >
      {children}
    </Slave>
  );
};
