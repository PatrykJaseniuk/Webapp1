import { useAsyncFn } from 'react-use';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';

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
  readonly signupUrl: string;
};

export const Login = ({ SlaveComponent, signupUrl }: Props): JSX.Element => {
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
    <SlaveComponent
      onSubmit={login}
      isLoading={loginState.loading}
      error={
        loginState.error?.message ??
        loginState.value?.error?.message ??
        null
      }
      signupUrl={signupUrl}
    />
  );
};
