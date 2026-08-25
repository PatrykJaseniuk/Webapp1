import { Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { match } from 'ts-pattern';
import { useState } from 'react';
import type { ComponentType } from 'react';
import { z } from 'zod';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import { toAsyncData, type AsyncData, type NavLink } from '@/generic';

type TreasuryRow = Database['public']['Tables']['treasury']['Row'];
type TreasuryInsert = Database['public']['Tables']['treasury']['Insert'];
type TreasuryUpdate = Database['public']['Tables']['treasury']['Update'];

export const treasuryInsertSchema = z.object({
  name: z.string().trim().min(1, 'Nazwa jest wymagana'),
  is_active: z.boolean(),
});

export type TreasuryInsertInput = z.input<typeof treasuryInsertSchema>;

const formatZodIssues = (error: z.ZodError): string =>
  error.issues.map((issue) => issue.message).join('; ');

const formatMutationError = (error: Error | null): string => {
  const code = (error as { readonly code?: string } | null)?.code;
  return code === '23505'
    ? 'Skarbiec o tej nazwie już istnieje.'
    : code === '23503'
      ? 'Nie można usunąć skarbca — ma powiązane zapisy finansowe.'
      : error?.message ?? 'Wystąpił nieznany błąd';
};

type TreasuryData = Readonly<{
  readonly treasury: TreasuryRow | null;
  readonly balance: number;
  readonly entryCount: number;
  readonly lastValueDate: string | null;
}>;

type NavLinkTo = Readonly<{
  readonly toList: NavLink;
}>;

type SubmitState =
  | { readonly tag: 'idle' }
  | { readonly tag: 'submitting' }
  | { readonly tag: 'success' }
  | { readonly tag: 'error'; readonly message: string };

type TreasuryDeleteAction =
  | { readonly tag: 'absent' }
  | { readonly tag: 'blocked'; readonly reason: string }
  | { readonly tag: 'allowed'; readonly doDelete: () => void };

export type TreasurySProps = {
  readonly asyncData: AsyncData<TreasuryData | null>;
  readonly doSubmit: (newRecord: TreasuryInsertInput) => void;
  readonly deleteAction: TreasuryDeleteAction;
  readonly doCancel: () => void;
  readonly onEditStart: () => void;
  readonly submitState: SubmitState;
  readonly navLinkTo: NavLinkTo;
};

export type TreasuryDetailMode =
  | { readonly tag: 'create' }
  | { readonly tag: 'edit'; readonly id: string };

type Props = {
  readonly Slave: ComponentType<TreasurySProps>;
  readonly mode: TreasuryDetailMode;
};

const fetchTreasuryData = async (id: string): Promise<TreasuryData> => {
  const [treasuryResult, balanceResult] = await Promise.all([
    backendConnector.from('treasury').select('*').eq('id', id).single(),
    backendConnector.from('treasury_balance').select('*').eq('treasury_id', id).maybeSingle(),
  ]);

  const combinedError = treasuryResult.error ?? balanceResult.error;
  return combinedError !== null
    ? Promise.reject(combinedError)
    : {
        treasury: treasuryResult.data,
        balance: balanceResult.data?.balance ?? 0,
        entryCount: balanceResult.data?.entry_count ?? 0,
        lastValueDate: balanceResult.data?.last_value_date ?? null,
      };
};

const insertTreasury = async (newRecord: TreasuryInsert): Promise<string> => {
  const result = await backendConnector.from('treasury').insert(newRecord).select('id').single();
  return result.error !== null ? Promise.reject(result.error) : result.data.id;
};

const updateTreasury = async (id: string, newRecord: TreasuryUpdate): Promise<void> => {
  const result = await backendConnector.from('treasury').update(newRecord).eq('id', id);
  return result.error !== null ? Promise.reject(result.error) : undefined;
};

const deleteTreasury = async (id: string): Promise<void> => {
  const result = await backendConnector.from('treasury').delete().eq('id', id);
  return result.error !== null ? Promise.reject(result.error) : undefined;
};
export const TreasuryDetailM = ({ Slave, mode }: Props): JSX.Element => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [validationError, setValidationError] = useState<string | null>(null);

  const treasuryId = match(mode)
    .with({ tag: 'create' }, () => null)
    .with({ tag: 'edit' }, ({ id }) => id)
    .exhaustive();

  const query = useQuery({
    queryKey: ['treasury', treasuryId],
    queryFn: (): Promise<TreasuryData> =>
      match(mode)
        .with({ tag: 'create' }, () => Promise.reject(new Error('Brak identyfikatora skarbca')))
        .with({ tag: 'edit' }, ({ id }) => fetchTreasuryData(id))
        .exhaustive(),
    enabled: treasuryId !== null,
  });

  const asyncData: AsyncData<TreasuryData | null> = match(mode)
    .with({ tag: 'create' }, () => ({ tag: 'fulfilled' as const, data: null }))
    .with({ tag: 'edit' }, () => toAsyncData(query, () => { void query.refetch(); }))
    .exhaustive();

  const invalidate = (): void => {
    void queryClient.invalidateQueries({ queryKey: ['treasuries'] });
    void queryClient.invalidateQueries({ queryKey: ['treasury', treasuryId] });
    void queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    void queryClient.invalidateQueries({ queryKey: ['financialEntryFormOptions'] });
  };

  const insertMutation = useMutation({
    mutationFn: (newRecord: TreasuryInsert): Promise<string> => insertTreasury(newRecord),
    onSuccess: (newId) => {
      invalidate();
      void navigate({ to: '/app/treasuries/$id', params: { id: newId } });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, record }: { readonly id: string; readonly record: TreasuryUpdate }): Promise<void> =>
      updateTreasury(id, record),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string): Promise<void> => deleteTreasury(id),
    onSuccess: () => {
      invalidate();
      void navigate({ to: '/app/treasuries' });
    },
  });

  const doSubmit = (newRecord: TreasuryInsertInput): void =>
    match(treasuryInsertSchema.safeParse(newRecord))
      .with({ success: true }, ({ data }) => {
        setValidationError(null);
        match(mode)
          .with({ tag: 'create' }, () => insertMutation.mutate(data))
          .with({ tag: 'edit' }, ({ id }) => updateMutation.mutate({ id, record: data }))
          .exhaustive();
      })
      .with({ success: false }, ({ error }) => {
        setValidationError(formatZodIssues(error));
      })
      .exhaustive();

  const onEditStart = (): void => {
    insertMutation.reset();
    updateMutation.reset();
    deleteMutation.reset();
    setValidationError(null);
  };

  // A treasury with entries can never be deleted (ON DELETE RESTRICT) — it is
  // deactivated instead, so its history stays intact.
  const deleteAction: TreasuryDeleteAction = match(mode)
    .with({ tag: 'create' }, () => ({ tag: 'absent' as const }))
    .with({ tag: 'edit' }, ({ id }) =>
      (query.data?.entryCount ?? 0) > 0
        ? {
            tag: 'blocked' as const,
            reason: `Skarbiec ma ${query.data?.entryCount ?? 0} powiązanych zapisów finansowych. Zamiast usuwać, oznacz go jako nieaktywny.`,
          }
        : { tag: 'allowed' as const, doDelete: (): void => { deleteMutation.mutate(id); } },
    )
    .exhaustive();

  const doCancel = (): void => {
    void navigate({ to: '/app/treasuries' });
  };

  const submitState: SubmitState =
    insertMutation.isPending || updateMutation.isPending || deleteMutation.isPending
      ? { tag: 'submitting' }
      : validationError !== null
        ? { tag: 'error', message: validationError }
        : insertMutation.error !== null || updateMutation.error !== null || deleteMutation.error !== null
          ? { tag: 'error', message: formatMutationError(insertMutation.error ?? updateMutation.error ?? deleteMutation.error) }
          : insertMutation.isSuccess || updateMutation.isSuccess
            ? { tag: 'success' }
            : { tag: 'idle' };

  const navLinkTo: NavLinkTo = {
    toList: ({ content, style }) => <Link to="/app/treasuries" style={style}>{content}</Link>,
  };

  return (
    <Slave
      asyncData={asyncData}
      doSubmit={doSubmit}
      deleteAction={deleteAction}
      doCancel={doCancel}
      onEditStart={onEditStart}
      submitState={submitState}
      navLinkTo={navLinkTo}
    />
  );
};
