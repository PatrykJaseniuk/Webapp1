import { Outlet, NavLink, useLocation } from 'react-router-dom';
import type { LinkComponent } from '@/generic';
import { AuthorisationGuard } from '@/masterComponents/RoleGuard';
import { AppLayout } from '@/masterComponents/AppLayout';
import { AppLayoutShell } from '@/slaveComponents/AppLayoutShell';
import { LoadingSpinner } from '@/slaveComponents/LoadingSpinner';
import { AccessDenied } from '@/slaveComponents/AccessDenied';

const links = {
  dashboard: '/landlord',
  properties: '/landlord/properties',
  tenants: '/landlord/tenants',
};

export const LandlordLayoutPage = (): JSX.Element => {
  const location = useLocation();

  return (
    <AuthorisationGuard
      authoriseRequirement={{
        isAuthenticated: true,
        roles: ['landlord'],
      }}
      LoadingComponent={<LoadingSpinner />}
      AccessDeniedComponent={<AccessDenied />}
    >
      <AppLayout
        Shell={AppLayoutShell}
        navItems={links}
        LinkComponent={NavLink as unknown as LinkComponent}
        activeTo={location.pathname}
        loginTo="/login"
      >
        <Outlet />
      </AppLayout>
    </AuthorisationGuard>
  );
};
