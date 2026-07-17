import { match } from 'ts-pattern';
import { useMutation } from '@tanstack/react-query';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import { useUrls } from '@/hooks/useUrls';

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
  readonly loginUrl: string;
};

type Props = {
  readonly Form: ComponentType<SignupFormProps>;
};

export const Signup = ({ Form }: Props): JSX.Element => {
  const urls = useUrls();

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

  return match(urls)
    .with({ tag: 'pending' }, () => <Form onSubmit={() => {}} isLoading loginUrl="" error={null} />)
    .with({ tag: 'ready' }, ({ url }) => (
      <Form
        onSubmit={(input) => { mutation.mutate(input); }}
        isLoading={mutation.isPending}
        error={error}
        loginUrl={url.login()}
      />
    ))
    .exhaustive();
};