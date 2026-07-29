import { match } from 'ts-pattern';
import { Outlet } from '@tanstack/react-router';
import { useAuth } from '@/hooks/AuthContext';
import { AccessDeniedM } from '@/masterComponents/AccessDeniedM';
import { AppLayoutM } from '@/masterComponents/AppLayoutM';
import { AppLayoutShell } from '@/slaveComponents/AppLayouS';
import { AccessDeniedS } from '@/slaveComponents/AccessDeniedS';
import { LoadingSpinner } from '@/slaveComponents/LoadingSpinnerS';

export const AppLayoutPage = (): JSX.Element => {
  const authState = useAuth();

  return match(authState)
    .with({ tag: 'loading' }, () => <LoadingSpinner />)
    .with({ tag: 'unauthenticated' }, () => <AccessDeniedM Slave={AccessDeniedS} />)
    .with({ tag: 'authenticated', role: 'admin' }, ({ role, email }) => (
      <AppLayoutM Slave={AppLayoutShell} role={role} email={email}>
        <Outlet />
      </AppLayoutM>
    ))
    .with({ tag: 'authenticated', role: 'landlord' }, ({ role, email }) => (
      <AppLayoutM Slave={AppLayoutShell} role={role} email={email}>
        <Outlet />
      </AppLayoutM>
    ))
    .with({ tag: 'authenticated', role: 'tenant' }, ({ role, email }) => (
      <AppLayoutM Slave={AppLayoutShell} role={role} email={email}>
        <Outlet />
      </AppLayoutM>
    ))
    .exhaustive();
};
