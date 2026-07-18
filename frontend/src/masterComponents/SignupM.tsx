import { Link } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import type { ComponentType, ReactNode } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';

export type SignupInput = {
  readonly email: string;
  readonly password: string;
  readonly firstName: string;
  readonly lastName: string;
};

export type SignupFormProps = {
  readonly onSubmit: (input: SignupInput) => void;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly loginLink: ReactNode;
};

type Props = {
  readonly Form: ComponentType<SignupFormProps>;
};

const loginLinkPlaceholder = (
  <span className="font-medium text-blue-600 hover:text-blue-500">Zaloguj się</span>
);

export const Signup = ({ Form }: Props): JSX.Element => {
  const mutation = useMutation({
    mutationFn: async (input: SignupInput) => {
      const result = await backendConnector.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            first_name: input.firstName,
            last_name: input.lastName,
          },
        },
      });
      if (result.error !== null) throw result.error;
      return result.data;
    },
  });

  const error: string | null = mutation.error?.message ?? null;

  return (
    <Form
      onSubmit={(input) => { mutation.mutate(input); }}
      isLoading={mutation.isPending}
      error={error}
      loginLink={<Link to="/login">{loginLinkPlaceholder}</Link>}
    />
  );
};