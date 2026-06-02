import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { match } from 'ts-pattern';
import { backendConnector } from '@/backend/backendConnector';
import { ok, err } from '@/domain';
import type {
  Tenant,
  TenantInsert,
  TenantUpdate,
  AppError,
  Result,
} from '@/domain';

// ── Error mapping ──

const toAppError = (error: unknown): AppError =>
  error instanceof Error
    ? { tag: 'NetworkError' as const, message: error.message }
    : { tag: 'NetworkError' as const, message: 'Unknown database error' };

// ── CRUD functions (Result-based, no throw) ──

const table = 'tenants';

export const fetchTenants = async (): Promise<
  Result<readonly Tenant[], AppError>
> => {
  const result = await backendConnector
    .from(table)
    .select('*')
    .order('created_at', { ascending: false });
  return result.error !== null
    ? err(toAppError(result.error))
    : ok(result.data as readonly Tenant[]);
};

export const fetchTenantById = async (
  id: string,
): Promise<Result<Tenant, AppError>> => {
  const result = await backendConnector.from(table).select('*').eq('id', id).single();
  return result.error !== null
    ? err(toAppError(result.error))
    : ok(result.data as Tenant);
};

export const saveTenant = async (
  input: TenantInsert,
): Promise<Result<Tenant, AppError>> => {
  const result = await backendConnector.from(table).insert(input).select().single();
  return result.error !== null
    ? err(toAppError(result.error))
    : ok(result.data as Tenant);
};

export const updateTenant = async (
  id: string,
  patch: TenantUpdate,
): Promise<Result<Tenant, AppError>> => {
  const result = await backendConnector
    .from(table)
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  return result.error !== null
    ? err(toAppError(result.error))
    : ok(result.data as Tenant);
};

export const deleteTenant = async (
  id: string,
): Promise<Result<void, AppError>> => {
  const result = await backendConnector.from(table).delete().eq('id', id);
  return result.error !== null ? err(toAppError(result.error)) : ok(undefined);
};

// ── TanStack Query hooks ──

const queryKey = ['tenants'] as const;

export const useTenantsQuery = () =>
  useQuery({
    queryKey,
    queryFn: async () => {
      const r = await fetchTenants();
      return match(r)
        .with({ tag: 'ok' }, ({ value }) => value)
        .with({ tag: 'err' }, ({ error }) => {
          // eslint-disable-next-line functional/no-throw-statements -- boundary adapter for TanStack
          throw error;
        })
        .exhaustive();
    },
  });

export const useSaveTenantMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: TenantInsert) => {
      const r = await saveTenant(input);
      return match(r)
        .with({ tag: 'ok' }, ({ value }) => value)
        .with({ tag: 'err' }, ({ error }) => {
          // eslint-disable-next-line functional/no-throw-statements -- boundary adapter for TanStack
          throw error;
        })
        .exhaustive();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });
};

export const useUpdateTenantMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      readonly id: string;
      readonly patch: TenantUpdate;
    }) => {
      const r = await updateTenant(id, patch);
      return match(r)
        .with({ tag: 'ok' }, ({ value }) => value)
        .with({ tag: 'err' }, ({ error }) => {
          // eslint-disable-next-line functional/no-throw-statements -- boundary adapter for TanStack
          throw error;
        })
        .exhaustive();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });
};

export const useDeleteTenantMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const r = await deleteTenant(id);
      return match(r)
        .with({ tag: 'ok' }, ({ value }) => value)
        .with({ tag: 'err' }, ({ error }) => {
          // eslint-disable-next-line functional/no-throw-statements -- boundary adapter for TanStack
          throw error;
        })
        .exhaustive();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });
};