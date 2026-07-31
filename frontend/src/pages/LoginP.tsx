import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { match } from 'ts-pattern';
import { useAuth } from '@/hooks/AuthContext';
import { Login } from '@/masterComponents/LoginM';
import { LoginForm } from '@/slaveComponents/LoginFormS';
import { LoadingSpinner } from '@/slaveComponents/LoadingSpinnerS';

export const LoginPage = (): JSX.Element => {
  const authState = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    authState.tag === 'authenticated' ? void navigate({ to: '/app' }) : undefined;
  }, [authState.tag, navigate]);

  return match(authState)
    .with({ tag: 'loading' }, () => <LoadingSpinner />)
    .with({ tag: 'authenticated' }, () => <></>)
    .with({ tag: 'unauthenticated' }, () => <Login SlaveComponent={LoginForm} />)
    .exhaustive();
};