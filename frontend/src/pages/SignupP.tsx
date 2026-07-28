import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { match } from 'ts-pattern';
import { useAuth } from '@/hooks/AuthContext';
import { Signup } from '@/masterComponents/SignupM';
import { SignupForm } from '@/slaveComponents/SignupFormS';
import { LoadingSpinner } from '@/slaveComponents/LoadingSpinnerS';

export const SignupPage = (): JSX.Element => {
  const authState = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authState.tag === 'authenticated') {
      void navigate({ to: '/app' });
    }
  }, [authState.tag, navigate]);

  return match(authState)
    .with({ tag: 'loading' }, () => <LoadingSpinner />)
    .with({ tag: 'authenticated' }, () => <></>)
    .with({ tag: 'unauthenticated' }, () => <Signup Form={SignupForm} />)
    .exhaustive();
};