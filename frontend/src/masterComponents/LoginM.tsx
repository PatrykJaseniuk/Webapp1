import { match } from 'ts-pattern';
import { useMutation } from '@tanstack/react-query';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import { useUrls } from '@/hooks/useUrls';

export type LoginInput = {
  readonly email: string;
  readonly password: string;
};

export type LoginSProps = {
  readonly onSubmit: (input: LoginInput) => void;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly signupUrl: string;
};

type Props = {
  readonly SlaveComponent: ComponentType<LoginSProps>;
};

export const Login = ({ SlaveComponent }: Props): JSX.Element => {
  const urls = useUrls();

  const mutation = useMutation({
    mutationFn: async (input: LoginInput) => {
      const result = await backendConnector.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });
      if (result.error !== null) throw result.error;
      return result.data;
    },
  });

  const error: string | null = mutation.error?.message ?? null;

  return match(urls)
    .with({ tag: 'pending' }, () => <SlaveComponent onSubmit={() => {}} isLoading signupUrl="" error={null} />)
    .with({ tag: 'ready' }, ({ url }) => (
      <SlaveComponent
        onSubmit={(input) => { mutation.mutate(input); }}
        isLoading={mutation.isPending}
        error={error}
        signupUrl={url.signup()}
      />
    ))
    .exhaustive();
};