import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { match } from 'ts-pattern';
import type { Session, User } from '@supabase/supabase-js';
import { backendConnector } from '@/backend/backendConnector';
import { ok, err } from '@/domain';
import type {
  LoginInput,
  SignupInput,
  UserRole,
  AppError,
  Result,
} from '@/domain';

// ── Error mapping ──

const toAppError = (error: unknown): AppError =>
  error instanceof Error
    ? { tag: 'NetworkError' as const, message: error.message }
    : { tag: 'NetworkError' as const, message: 'Unknown error' };

const toAuthError = (message: string): AppError =>
  ({ tag: 'ValidationError' as const, message });

// ── Auth CRUD functions (Result-based, no throw) ──

export const getSession = async (): Promise<
  Result<{ readonly session: Session | null; readonly user: User | null }, AppError>
> => {
  const result = await backendConnector.auth.getSession();
  return result.error !== null
    ? err(toAppError(result.error))
    : ok({
      session: result.data.session ?? null,
      user: result.data.session?.user ?? null,
    });
};

export const signIn = async (
  input: LoginInput,
): Promise<Result<{ readonly session: Session; readonly user: User }, AppError>> => {
  const result = await backendConnector.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });
  return result.error !== null
    ? err(toAppError(result.error))
    : result.data.session === null || result.data.session.user === null
      ? err(toAuthError('Sign in returned no session'))
      : ok({ session: result.data.session, user: result.data.session.user });
};

export const signUp = async (
  input: SignupInput,
): Promise<Result<{ readonly user: User | null }, AppError>> => {
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

  const withError = result.error !== null;
  const authUser = result.data.user;

  const insertResult: Result<null, AppError> =
    withError || authUser === null
      ? ok(null)
      : await (async () => {
        const r = await backendConnector.from('tenants').insert({
          user_id: authUser.id,
          first_name: input.firstName,
          last_name: input.lastName,
          email: input.email,
          phone: '',
          tenant_status: 'applicant',
        });
        return r.error !== null ? err(toAppError(r.error)) : ok(null);
      })();

  return withError
    ? err(toAppError(result.error))
    : authUser === null
      ? ok({ user: null })
      : insertResult.tag === 'err'
        ? err(insertResult.error)
        : ok({ user: authUser });
};

export const signOut = async (): Promise<Result<void, AppError>> => {
  const result = await backendConnector.auth.signOut();
  return result.error !== null ? err(toAppError(result.error)) : ok(undefined);
};

export const fetchUserRole = async (
  userId: string,
): Promise<Result<UserRole | null, AppError>> => {
  const result = await backendConnector
    .from('user_roles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  return result.error !== null
    ? err(toAppError(result.error))
    : ok(result.data ?? null);
};

// ── TanStack hooks ──

const sessionQueryKey = ['session'] as const;
const userRoleQueryKey = (userId: string): readonly string[] => [
  'userRole',
  userId,
];

/** Unwraps a Result for TanStack Query — ok passes through, err throws.
 *  Boundary adapter: Result → TanStack's exception-based error model. */
const unwrapResult = <T>(r: Result<T, AppError>): T =>
  match(r)
    .with({ tag: 'ok' }, ({ value }) => value)
    .with({ tag: 'err' }, ({ error }) => {
      // eslint-disable-next-line functional/no-throw-statements -- boundary adapter for TanStack
      throw error;
    })
    .exhaustive();

export const useSessionQuery = () =>
  useQuery({
    queryKey: sessionQueryKey,
    queryFn: async () => unwrapResult(await getSession()),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

export const useUserRoleQuery = (userId: string | null) =>
  useQuery({
    queryKey: userRoleQueryKey(userId ?? ''),
    queryFn: async () =>
      userId === null ? null : unwrapResult(await fetchUserRole(userId)),
    enabled: userId !== null,
  });

export const useSignInMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: LoginInput) =>
      unwrapResult(await signIn(input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionQueryKey });
    },
  });
};

export const useSignUpMutation = () =>
  useMutation({
    mutationFn: async (input: SignupInput) =>
      unwrapResult(await signUp(input)),
  });

export const useSignOutMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => unwrapResult(await signOut()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionQueryKey });
    },
  });
};