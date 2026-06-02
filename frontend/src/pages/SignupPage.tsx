import { useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { match, P } from 'ts-pattern';
import { AuthForm } from '@/features/auth';
import { useSessionQuery, useSignUpMutation } from '@/backendConnectorWrapers/auth';
import { buildRoute } from '@/shared';
import type { SignupInput } from '@/domain';

type FormData =
  | { readonly tag: 'login'; readonly input: unknown }
  | { readonly tag: 'signup'; readonly input: SignupInput };

export const SignupPage = (): JSX.Element => {
  const navigate = useNavigate();
  const sessionQuery = useSessionQuery();
  const signUpMutation = useSignUpMutation();

  const handleSubmit = useCallback(
    (data: FormData): void => {
      match(data)
        .with({ tag: 'signup', input: P.select() }, (input: SignupInput) => {
          signUpMutation.mutate(input, {
            onSuccess: () => navigate(buildRoute('login', {})),
          });
        })
        .with({ tag: 'login' }, () => undefined)
        .exhaustive();
    },
    [signUpMutation, navigate],
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
            mode={{ tag: 'signup' }}
            onSubmit={handleSubmit}
            isLoading={signUpMutation.isPending}
            error={
              signUpMutation.isError
                ? (signUpMutation.error as Error).message
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
    ));
};