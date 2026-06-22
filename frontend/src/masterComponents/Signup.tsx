import { useAsyncFn } from 'react-use';
import type { ComponentType } from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { SignupInput } from '@/domain';

export type SignupFormProps = {
  readonly onSubmit: (input: SignupInput) => void;
  readonly isLoading: boolean;
  readonly error: string | null;
};

type Props = {
  readonly Form: ComponentType<SignupFormProps>;
};

export const Signup = ({ Form }: Props): JSX.Element => {
  const [signupState, signup] = useAsyncFn(
    async (input: SignupInput) =>
      backendConnector.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            first_name: input.firstName,
            last_name: input.lastName,
          },
        },
      }),
  );

  return (
    <Form
      onSubmit={signup}
      isLoading={signupState.loading}
      error={
        signupState.error?.message ??
        signupState.value?.error?.message ??
        null
      }
    />
  );
};
