import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { LoginSProps, LoginInput } from '@/masterComponents/LoginM';

export const extractLoginInput = (formData: FormData): LoginInput => ({
  email: (formData.get('email') as string) ?? '',
  password: (formData.get('password') as string) ?? '',
});

const inputClass =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

const buttonClass =
  'w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50';

export const LoginForm = ({
  onSubmit,
  isLoading,
  error,
  signupUrl,
}: LoginSProps): JSX.Element => {
  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit(extractLoginInput(formData));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Zaloguj się</h2>

          {error !== null && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className={labelClass}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="password" className={labelClass}>
              Hasło
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className={inputClass}
            />
          </div>

          <button type="submit" disabled={isLoading} className={buttonClass}>
            {isLoading ? 'Przetwarzanie...' : 'Zaloguj'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Nie masz konta?{' '}
          <Link
            to={signupUrl}
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Zarejestruj się
          </Link>
        </p>
      </div>
    </div>
  );
};
