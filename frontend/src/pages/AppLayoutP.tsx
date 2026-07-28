import { Outlet } from '@tanstack/react-router';
import { useAuth } from '@/hooks/AuthContext';
import { AppLayoutM } from '@/masterComponents/AppLayoutM';
import { AppLayoutShell } from '@/slaveComponents/AppLayouS';

const ADMIN_LANDLORD_KEYS: readonly string[] = [
  'dashboard',
  'properties',
  'tenants',
  'leases',
  'transactions',
];

const TENANT_KEYS: readonly string[] = [
  'dashboard',
  'contracts',
  'payments',
];

export const AppLayoutPage = (): JSX.Element => {
  const authState = useAuth();

  const navKeys: readonly string[] =
    authState.tag === 'authenticated' && authState.role === 'tenant' ?
      TENANT_KEYS :
      ADMIN_LANDLORD_KEYS;

  return (
    <AppLayoutM Slave={AppLayoutShell} navKeys={navKeys}>
      <Outlet />
    </AppLayoutM>
  );
};
