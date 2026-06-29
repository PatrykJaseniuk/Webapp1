import { Database } from '@/backendConnector';
import { useAuth, type AuthState } from '@/hooks/AuthContext';
import type { ReactNode } from 'react';

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

type Props = {
  readonly authoriseRequirement: AuthoriseRequirement;
  readonly children: ReactNode;
  readonly LoadingComponent: ReactNode;
  readonly AccessDeniedComponent: ReactNode;
};

export const AuthorisationGuard = ({
  authoriseRequirement,
  children,
  LoadingComponent,
  AccessDeniedComponent,
}: Props): JSX.Element => {
  const authState = useAuth();

  const isAuthorised: boolean = computeAuthorisation(authState, authoriseRequirement);

  return authState.tag === 'loading' ?
    <>{LoadingComponent}</>
    : isAuthorised ?
      <>{children}</>
      : <>{AccessDeniedComponent}</>;
};
