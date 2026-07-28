import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/hooks/AuthContext';

type Props = {
  readonly LoadingComponent: ReactNode;
  readonly children: ReactNode;
};

export const RoleRedirect = ({
  LoadingComponent,
  children,
}: Props): JSX.Element => {
  const authState = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authState.tag === 'authenticated') {
      navigate({ to: '/app' });
    }
  }, [authState.tag, navigate]);

  return authState.tag === 'loading' ?
    <>{LoadingComponent}</> :
    authState.tag === 'authenticated' ?
      <></> :
      <>{children}</>;
};
