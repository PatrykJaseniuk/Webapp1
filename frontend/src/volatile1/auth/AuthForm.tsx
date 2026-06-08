import type { FormEvent } from 'react';
import { match } from 'ts-pattern';
import type { LoginInput, SignupInput } from '@/volatile1/domain';

// ── Union type for the form mode ──

type AuthMode = { readonly tag: 'login' } | { readonly tag: 'signup' };

type FormData =
  | { readonly tag: 'login'; readonly input: LoginInput }
  | { readonly tag: 'signup'; readonly input: SignupInput };

type Props = {
  readonly mode: AuthMode;
  readonly onSubmit: (data: FormData) => void;
  readonly isLoading: boolean;
  readonly error: string | null;
};

// ── Styles ──

const inputClass =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

const buttonClass =
  'w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50';

// ── Component ──

export const AuthForm = ({
  mode,
  onSubmit,
  isLoading,
  error,
}: Props): JSX.Element => {
  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = (formData.get('email') as string) ?? '';
    const password = (formData.get('password') as string) ?? '';

    const data: FormData = match(mode)
      .with({ tag: 'login' }, () => ({
        tag: 'login' as const,
        input: { email, password } as LoginInput,
      }))
      .with({ tag: 'signup' }, () => {
        const firstName = (formData.get('firstName') as string) ?? '';
        const lastName = (formData.get('lastName') as string) ?? '';
        return {
          tag: 'signup' as const,
          input: { email, password, firstName, lastName } as SignupInput,
        };
      })
      .exhaustive();

    onSubmit(data);
  };

  const title = match(mode)
    .with({ tag: 'login' }, () => 'Zaloguj się')
    .with({ tag: 'signup' }, () => 'Zarejestruj się')
    .exhaustive();

  const submitLabel = match(mode)
    .with({ tag: 'login' }, () => 'Zaloguj')
    .with({ tag: 'signup' }, () => 'Zarejestruj')
    .exhaustive();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>

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

      {mode.tag === 'signup' && (
        <>
          <div>
            <label htmlFor="firstName" className={labelClass}>
              Imię
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              required
              autoComplete="given-name"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="lastName" className={labelClass}>
              Nazwisko
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              required
              autoComplete="family-name"
              className={inputClass}
            />
          </div>
        </>
      )}

      <div>
        <label htmlFor="password" className={labelClass}>
          Hasło
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete={
            mode.tag === 'login' ? 'current-password' : 'new-password'
          }
          className={inputClass}
        />
      </div>

      <button type="submit" disabled={isLoading} className={buttonClass}>
        {isLoading ? 'Przetwarzanie...' : submitLabel}
      </button>
    </form>
  );
};