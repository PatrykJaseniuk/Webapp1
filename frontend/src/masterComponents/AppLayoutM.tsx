import type { ReactNode, ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/AuthContext';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { AsyncData } from '@/generic';

// ── Auth data extracted for the shell ──

type AuthData = Readonly<{
  email: string;
}>;

// ── Shell props (defined here so slave can import from master) ──

export type AppLayoutSProps = {
  readonly navItems: Readonly<Record<string, string>>;
  readonly asyncData: AsyncData<AuthData>;
  readonly onLogout: () => void;
  readonly children: ReactNode;
  readonly activeTo: string;
};

// ── Component ──

type Props = {
  readonly children: ReactNode;
  readonly Slave: ComponentType<AppLayoutSProps>;
  readonly navItems: Readonly<Record<string, string>>;
  readonly activeTo: string;
  readonly loginTo: string;
};

export const AppLayoutM = ({
  children,
  Slave,
  navItems,
  activeTo,
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

  return (
    <Slave
      navItems={navItems}
      asyncData={asyncData}
      onLogout={handleLogout}
      activeTo={activeTo}
    >
      {children}
    </Slave>
  );
};
