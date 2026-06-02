import { useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { match, P } from 'ts-pattern';
import { AuthForm } from '@/features/auth';
import { useSessionQuery, useSignInMutation } from '@/backendConnectorWrapers/auth';
import { buildRoute } from '@/shared';
import type { LoginInput } from '@/domain';

type FormData =
  | { readonly tag: 'login'; readonly input: LoginInput }
  | { readonly tag: 'signup'; readonly input: unknown };

export const LoginPage = (): JSX.Element => {
  const navigate = useNavigate();
  const sessionQuery = useSessionQuery();
  const signInMutation = useSignInMutation();

  const handleSubmit = useCallback(
    (data: FormData): void => {
      match(data)
        .with({ tag: 'login', input: P.select() }, (input: LoginInput) => {
          signInMutation.mutate(input, {
            onSuccess: () => navigate(buildRoute('dashboard', {})),
          });
        })
        .with({ tag: 'signup' }, () => undefined)
        .exhaustive();
    },
    [signInMutation, navigate],
  );

  return match(sessionQuery)
    .with({ isLoading: true }, () => (
      <div className="flex items-center justify-center py-16">
        <p className="text-gray-400">Ładowanie...</p>
      </div>
    ))
    .with({ data: { user: P.not(null) } }, () => (
      <Navigate to={buildRoute('dashboard', {})} replace />
    ))
    .otherwise(() => (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <AuthForm
            mode={{ tag: 'login' }}
            onSubmit={handleSubmit}
            isLoading={signInMutation.isPending}
            error={
              signInMutation.isError
                ? (signInMutation.error as Error).message
                : null
            }
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
    ));
};