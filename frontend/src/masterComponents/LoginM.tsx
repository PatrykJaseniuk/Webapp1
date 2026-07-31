import { Link } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import type { ComponentType, ReactNode } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';

export type LoginInput = {
  readonly email: string;
  readonly password: string;
};

export type LoginSProps = {
  readonly onSubmit: (input: LoginInput) => void;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly signupLink: ReactNode;
};

type Props = {
  readonly SlaveComponent: ComponentType<LoginSProps>;
};

const signupLinkPlaceholder = (
  <span>Zarejestruj się</span>
);

export const Login = ({ SlaveComponent }: Props): JSX.Element => {
  const mutation = useMutation({
    mutationFn: async (input: LoginInput) => {
      const result = await backendConnector.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });
      return result.error !== null ? Promise.reject(result.error) : result.data;
    },
  });

  const error: string | null = mutation.error?.message ?? null;

  return (
    <SlaveComponent
      onSubmit={(input) => { mutation.mutate(input); }}
      isLoading={mutation.isPending}
      error={error}
      signupLink={<Link to="/signup">{signupLinkPlaceholder}</Link>}
    />
  );
};