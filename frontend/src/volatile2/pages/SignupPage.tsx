import { useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { match, P } from 'ts-pattern';
import { useAsync, useAsyncFn } from 'react-use';
import { backendConnector } from '@/backend/backendConnector';
import { AuthForm } from '@/auth';
import { buildRoute } from '@/routes';
import type { SignupInput } from '@/domain';

type FormData =
  | { readonly tag: 'login'; readonly input: unknown }
  | { readonly tag: 'signup'; readonly input: SignupInput };

export const SignupPage = (): JSX.Element => {
  const navigate = useNavigate();

  const sessionState = useAsync(
    async () => backendConnector.auth.getSession(),
    [],
  );

  const [signUpState, signUp] = useAsyncFn(
    async (input: SignupInput) =>
      backendConnector.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            first_name: input.firstName,
            last_name: input.lastName,
          },
        },
      }),
  );

  const handleSubmit = useCallback(
    (data: FormData): void => {
      match(data)
        .with({ tag: 'signup', input: P.select() }, (input: SignupInput) => {
          signUp(input).then(() => navigate(buildRoute('login', {})));
        })
        .with({ tag: 'login' }, () => undefined)
        .exhaustive();
    },
    [signUp, navigate],
  );

  const user =
    !sessionState.loading &&
    sessionState.value !== undefined
      ? (sessionState.value.data?.session?.user ?? null)
      : null;

  return user !== null
    ? (
      <Navigate to={buildRoute('dashboard', {})} replace />
    )
    : sessionState.loading
      ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-gray-400">Ładowanie...</p>
        </div>
      )
      : (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <AuthForm
              mode={{ tag: 'signup' }}
              onSubmit={handleSubmit}
              isLoading={signUpState.loading}
              error={
                signUpState.error !== undefined
                  ? signUpState.error.message
                  : null
              }
            />
            <p className="mt-4 text-center text-sm text-gray-500">
              Masz już konto?{' '}
              <a
                href={`#${buildRoute('login', {})}`}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Zaloguj się
              </a>
            </p>
          </div>
        </div>
      );
};