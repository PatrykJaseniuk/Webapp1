import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { match } from 'ts-pattern';
import { backendConnector } from '@/backend/backendConnector';
import { ok, err } from '@/domain';
import type {
  Property,
  PropertyInsert,
  PropertyUpdate,
  AppError,
  Result,
} from '@/domain';

// ── Error mapping ──

export const toAppError = (error: unknown): AppError =>
  error instanceof Error
    ? { tag: 'NetworkError' as const, message: error.message }
    : { tag: 'NetworkError' as const, message: 'Unknown database error' };

// ── CRUD functions (Result-based, no throw) ──

const table = 'properties';

export const fetchProperties = async (): Promise<
  Result<readonly Property[], AppError>
> => {
  const result = await backendConnector
    .from(table)
    .select('*')
    .order('created_at', { ascending: false });
  return result.error !== null
    ? err(toAppError(result.error))
    : ok(result.data as readonly Property[]);
};

export const fetchPropertyById = async (
  id: string,
): Promise<Result<Property, AppError>> => {
  const result = await backendConnector.from(table).select('*').eq('id', id).single();
  return result.error !== null
    ? err(toAppError(result.error))
    : ok(result.data as Property);
};

export const saveProperty = async (
  input: PropertyInsert,
): Promise<Result<Property, AppError>> => {
  const result = await backendConnector.from(table).insert(input).select().single();
  return result.error !== null
    ? err(toAppError(result.error))
    : ok(result.data as Property);
};

export const updateProperty = async (
  id: string,
  patch: PropertyUpdate,
): Promise<Result<Property, AppError>> => {
  const result = await backendConnector
    .from(table)
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  return result.error !== null
    ? err(toAppError(result.error))
    : ok(result.data as Property);
};

export const deleteProperty = async (
  id: string,
): Promise<Result<void, AppError>> => {
  const result = await backendConnector.from(table).delete().eq('id', id);
  return result.error !== null
    ? err(toAppError(result.error))
    : ok(undefined);
};

// ── TanStack Query hooks ──

const queryKey = ['properties'] as const;

export const usePropertiesQuery = () =>
  useQuery({
    queryKey,
    queryFn: async () => {
      const r = await fetchProperties();
      return match(r)
        .with({ tag: 'ok' }, ({ value }) => value)
        .with({ tag: 'err' }, ({ error }) => {
          // eslint-disable-next-line functional/no-throw-statements -- boundary adapter for TanStack
          throw error;
        })
        .exhaustive();
    },
  });

export const useSavePropertyMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: PropertyInsert) => {
      const r = await saveProperty(input);
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

export const useUpdatePropertyMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      readonly id: string;
      readonly patch: PropertyUpdate;
    }) => {
      const r = await updateProperty(id, patch);
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

export const useDeletePropertyMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const r = await deleteProperty(id);
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