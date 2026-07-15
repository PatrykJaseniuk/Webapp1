import type { Database } from '@/backendConnector';
import { useAuth, type AuthState } from '@/hooks/AuthContext';
import type { ReactNode, ComponentType } from 'react';
import type { DataMode } from '@/generic';

export type AuthoriseRequirement =
  | { readonly isAuthenticated: false }
  | { readonly isAuthenticated: true; readonly roles: readonly Database['public']['Enums']['app_role'][] };

export const computeAuthorisation = (
  authState: AuthState,
  authoriseRequirement: AuthoriseRequirement,
): boolean =>
  authoriseRequirement.isAuthenticated === false ?
    true
    : authState.tag === 'authenticated' &&
    authoriseRequirement.roles.includes(authState.role);

// ── Authorisation result passed via DataMode ──

export type AuthorisationResult = Readonly<{
  isAuthorised: boolean;
}>;

// ── Slave props (defined here so slave can import from master) ──

export type AccessGateSlaveProps = {
  readonly dataMode: DataMode<AuthorisationResult>;
  readonly children: ReactNode;
};

type Props = {
  readonly authoriseRequirement: AuthoriseRequirement;
  readonly children: ReactNode;
  readonly Slave: ComponentType<AccessGateSlaveProps>;
};

export const AuthorisationGuard = ({
  authoriseRequirement,
  children,
  Slave,
}: Props): JSX.Element => {
  const authState = useAuth();

  const isAuthorised: boolean = computeAuthorisation(authState, authoriseRequirement);

  const dataMode: DataMode<AuthorisationResult> =
    authState.tag === 'loading' ?
      { tag: 'pending' } :
      { tag: 'fulfilled', data: { isAuthorised } };

  return <Slave authState={state}>{children}</Slave>;
};
