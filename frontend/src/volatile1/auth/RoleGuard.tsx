import { Navigate } from 'react-router-dom';
import { useAuth, useRequireRole } from './AuthContext';
import { buildRoute } from '@/volatile1/routes';
import type { AppRole } from '@/volatile1/domain';
import type { ReactNode } from 'react';

type Props = {
  readonly allowedRoles: readonly AppRole[];
  readonly children: ReactNode;
};

export const RoleGuard = ({ allowedRoles, children }: Props): JSX.Element => {
  const authState = useAuth();
  const allowed = useRequireRole(allowedRoles);

  return authState.tag === 'loading' ?
    (
      <div className="flex items-center justify-center py-16">
        <p className="text-gray-400">Ładowanie...</p>
      </div>
    ) :
    allowed ?
      <>{children}</> :
      <Navigate to={buildRoute('dashboard', {})} replace />;
};