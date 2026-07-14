import type { ReactNode, ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, type AuthState } from '@/hooks/AuthContext';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { SlaveDataState, LinkComponent } from '@/generic';

// ── Auth data extracted for the shell ──

export type AuthContextData = Readonly<{
  email: string;
  onLogout: () => void;
}>;

// ── Shell props (defined here so slave can import from master) ──

export type AppLayoutSProps = {
  readonly navItems: Readonly<Record<string, string>>;
  readonly authState: SlaveDataState<AuthContextData>;
  readonly children: ReactNode;
  readonly LinkComponent: LinkComponent;
  readonly activeTo: string;
};

// ── Component ──

type Props = {
  readonly children: ReactNode;
  readonly SlaveComponent: ComponentType<AppLayoutSProps>;
  readonly navItems: Readonly<Record<string, string>>;
  readonly LinkComponent: LinkComponent;
  readonly activeTo: string;
  readonly loginTo: string;
};

const toSlaveDataState = (
  auth: AuthState,
  onLogout: () => void,
): SlaveDataState<AuthContextData> =>
  auth.tag === 'loading' ?
    { tag: 'pending' } :
    auth.tag === 'authenticated' ?
      { tag: 'fulfilled', data: { email: auth.email, onLogout } } :
      { tag: 'rejected', message: 'Unauthenticated', onRetry: () => window.location.reload() };

export const AppLayout = ({
  children,
  SlaveComponent: Shell,
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

  return (
    <Shell
      navItems={navItems}
      authState={toSlaveDataState(authState, handleLogout)}
      LinkComponent={LinkComponent}
      activeTo={activeTo}
    >
      {children}
    </Shell>
  );
};
