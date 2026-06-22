import { Database } from '@/backendConnector';
import { useAuth } from '../contexts/AuthContext';
import type { ReactNode } from 'react';

type Props = {
  readonly authoriseRequirement:
  | { readonly isAuthenticated: false }
  | { readonly isAuthenticated: true; readonly roles: readonly Database['public']['Enums']['app_role'][] };
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

  const isAuthorised: boolean =
    authoriseRequirement.isAuthenticated === false ?
      true
      : authState.tag === 'authenticated' &&
      authoriseRequirement.roles.includes(authState.role);

  console.log(authState)

  return authState.tag === 'loading' ?
    <>{LoadingComponent}</>
    : isAuthorised ?
      <>{children}</>
      : <>{AccessDeniedComponent}</>;
};
