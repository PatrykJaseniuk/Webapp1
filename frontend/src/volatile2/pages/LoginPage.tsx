import { useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { match, P } from 'ts-pattern';
import { useAsyncFn } from 'react-use';
import { backendConnector } from '@/volatile0/infra/backendConnector';
import { AuthForm, useAuth } from '@/volatile1/auth';
import { buildRoute } from '@/volatile1/routes';
import type { LoginInput } from '@/volatile1/domain';

type FormData =
  | { readonly tag: 'login'; readonly input: LoginInput }
  | { readonly tag: 'signup'; readonly input: unknown };

export const LoginPage = (): JSX.Element => {
  const navigate = useNavigate();
  const authState = useAuth();

  const [signInState, signIn] = useAsyncFn(
    async (input: LoginInput) =>
      backendConnector.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      }),
  );

  const handleSubmit = useCallback(
    (data: FormData): void => {
      match(data)
        .with({ tag: 'login', input: P.select() }, (input: LoginInput) => {
          signIn(input).then((result) =>
            result.error === null ?
              navigate(buildRoute('dashboard', {})) :
              undefined,
          );
        })
        .with({ tag: 'signup' }, () => undefined)
        .exhaustive();
    },
    [signIn, navigate],
  );

  return authState.tag === 'authenticated' ?
    (
      <Navigate to={buildRoute('dashboard', {})} replace />
    ) :
    authState.tag === 'loading' ?
      (
        <div className="flex items-center justify-center py-16">
          <p className="text-gray-400">Ładowanie...</p>
        </div>
      ) :
      (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <AuthForm
              mode={{ tag: 'login' }}
              onSubmit={handleSubmit}
              isLoading={signInState.loading}
              error={signInState.value?.error?.message ?? null}
            />
            <p className="mt-4 text-center text-sm text-gray-500">
              Nie masz konta?{' '}
              <a
                href={`#${buildRoute('signup', {})}`}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Zarejestruj się
              </a>
            </p>
          </div>
        </div>
      );
};