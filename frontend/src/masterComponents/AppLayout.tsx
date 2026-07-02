import type { ReactNode, ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/AuthContext';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { LinkComponent } from '@/generic';
import { LoadingSpinner } from '@/slaveComponents/LoadingSpinner';

// ── Shell props (defined here so slave can import from master) ──

export type AppLayoutShellProps = {
  readonly navItems: Readonly<Record<string, string>>;
  readonly email: string;
  readonly onLogout: () => void;
  readonly children: ReactNode;
  readonly LinkComponent: LinkComponent;
  readonly activeTo: string;
};

// ── Component ──

type Props = {
  readonly children: ReactNode;
  readonly Shell: ComponentType<AppLayoutShellProps>;
  readonly navItems: Readonly<Record<string, string>>;
  readonly LinkComponent: LinkComponent;
  readonly activeTo: string;
  readonly loginTo: string;
};

export const AppLayout = ({
  children,
  Shell,
  navItems,
  LinkComponent,
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

  return authState.tag === 'authenticated' ?
    (
      <Shell
        navItems={navItems}
        email={authState.email}
        onLogout={handleLogout}
        LinkComponent={LinkComponent}
        activeTo={activeTo}
      >
        {children}
      </Shell>
    ) :
    authState.tag === 'loading' ?
      <LoadingSpinner /> :
      <>{children}</>;
};
