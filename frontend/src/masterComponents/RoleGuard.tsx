import { Database } from '@/backendConnector';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../slaveComponents/LoadingSpinner';
import { AccessDenied } from '../slaveComponents/AccessDenied';
import type { ReactNode } from 'react';

type Props = {
  readonly authoriseRequirement:
  | { readonly isAuthenticated: false }
  | { readonly isAuthenticated: true; readonly roles: readonly Database['public']['Enums']['app_role'][] };
  readonly children: ReactNode;
  readonly LoadingComponent?: ReactNode;
  readonly AccessDeniedComponent?: ReactNode;
};

export const AuthorisationGuard = ({
  authoriseRequirement,
  children,
  LoadingComponent = <LoadingSpinner />,
  AccessDeniedComponent = <AccessDenied />,
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
