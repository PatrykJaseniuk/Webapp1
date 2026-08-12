import type { FormEvent } from 'react';
import type { LoginSProps, LoginInput } from '@/masterComponents/LoginM';
import { buttonClass, FormErrorS, inputClass, labelClass } from './formUi';

export const extractLoginInput = (formData: FormData): LoginInput => ({
  email: (formData.get('email') as string) ?? '',
  password: (formData.get('password') as string) ?? '',
});

export const LoginForm = ({
  onSubmit,
  isLoading,
  error,
  signupLink,
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

          {error !== null && <FormErrorS message={error} />}

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

        <p className="mt-4 text-center text-sm text-gray-500 [&_a]:font-medium [&_a]:text-blue-600 hover:[&_a]:text-blue-500">
          Nie masz konta?{' '}
          {signupLink}
        </p>
      </div>
    </div>
  );
};
