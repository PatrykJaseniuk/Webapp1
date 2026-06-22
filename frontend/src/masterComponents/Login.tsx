import { useAsyncFn } from 'react-use';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { LoginInput } from '@/domain';

export type LoginFormProps = {
  readonly onSubmit: (input: LoginInput) => void;
  readonly isLoading: boolean;
  readonly error: string | null;
};

type Props = {
  readonly Form: ComponentType<LoginFormProps>;
};

export const Login = ({ Form }: Props): JSX.Element => {
  const [loginState, login] = useAsyncFn(
    async (input: LoginInput) => {
      const result = await backendConnector.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });

      return result;
    },
  );

  return (
    <Form
      onSubmit={login}
      isLoading={loginState.loading}
      error={
        loginState.error?.message ??
        loginState.value?.error?.message ??
        null
      }
    />
  );
};
