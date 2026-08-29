import { Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { match } from 'ts-pattern';
import type { ComponentType } from 'react';
import { z } from 'zod';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import { toAsyncData, useDateOrderedPaginatedQuery, useCrudMutations, deriveSubmitState, formatDbError, type AsyncData, type DetailMode, type NavLink, type NavLinkWithId, type PaginatedListResult, type SubmitState } from '@/generic';

type TreasuryRow = Database['public']['Tables']['treasury']['Row'];
type TreasuryInsert = Database['public']['Tables']['treasury']['Insert'];
type TreasuryUpdate = Database['public']['Tables']['treasury']['Update'];
type TreasuryStatementDbRow = Database['public']['Views']['treasury_statement']['Row'];

// View columns come back nullable; re-tighten the ones the view cannot null.
// See the note in LeaseAgreementM.
type TreasuryStatementRow = TreasuryStatementDbRow & {
  readonly id: string;
  readonly description: string;
  readonly amount: number;
  readonly value_date: string;
  readonly running_balance: number;
};

// The treasury statement has NO sort — always value_date DESC, id DESC — and
// only date-range filtering, so the running balance series is never broken.
type TreasuryEntryFilter = 'dateFrom' | 'dateTo';

export const treasuryInsertSchema = z.object({
  name: z.string().trim().min(1, 'Nazwa jest wymagana'),
  is_active: z.boolean(),
});

export type TreasuryInsertInput = z.input<typeof treasuryInsertSchema>;

// Postgres unique-violation (23505) on duplicate name; FK-violation (23503)
// when a treasury still has financial entries.
const TREASURY_MUTATION_MESSAGES: Readonly<Record<string, string>> = Object.freeze({
  '23505': 'Skarbiec o tej nazwie już istnieje.',
  '23503': 'Nie można usunąć skarbca — ma powiązane zapisy finansowe.',
});
const TREASURY_FALLBACK = 'Wystąpił nieznany błąd';

type TreasuryData = Readonly<{
  readonly treasury: TreasuryRow | null;
  readonly balance: number;
  readonly entryCount: number;
  readonly lastValueDate: string | null;
}>;

type NavLinkTo = Readonly<{
  readonly toList: NavLink;
  readonly financialEntry: NavLinkWithId;
}>;

type TreasuryDeleteAction =
  | { readonly tag: 'absent' }
  | { readonly tag: 'blocked'; readonly reason: string }
  | { readonly tag: 'allowed'; readonly doDelete: () => void };

export type TreasurySProps = {
  readonly asyncData: AsyncData<TreasuryData | null>;
  readonly entries: PaginatedListResult<TreasuryStatementRow, TreasuryEntryFilter>;
  readonly doSubmit: (newRecord: TreasuryInsertInput) => void;
  readonly deleteAction: TreasuryDeleteAction;
  readonly doCancel: () => void;
  readonly onEditStart: () => void;
  readonly submitState: SubmitState;
  readonly navLinkTo: NavLinkTo;
};

export type TreasuryDetailMode = DetailMode;

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

  const { insertMutation, updateMutation, deleteMutation, validationError, doSubmit, onEditStart } =
    useCrudMutations<TreasuryInsert>({
      insertFn: (newRecord) => insertTreasury(newRecord),
      updateFn: (id, record) => updateTreasury(id, record),
      deleteFn: (id) => deleteTreasury(id),
      schema: treasuryInsertSchema,
      mode,
      onInsertSuccess: (newId) => {
        void queryClient.invalidateQueries({ queryKey: ['treasuries'] });
        void queryClient.invalidateQueries({ queryKey: ['treasury', treasuryId] });
        void queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
        void queryClient.invalidateQueries({ queryKey: ['financialEntryFormOptions'] });
        void navigate({ to: '/app/treasuries/$id', params: { id: newId } });
      },
      onUpdateSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['treasuries'] });
        void queryClient.invalidateQueries({ queryKey: ['treasury', treasuryId] });
        void queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
        void queryClient.invalidateQueries({ queryKey: ['financialEntryFormOptions'] });
      },
      onDeleteSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['treasuries'] });
        void queryClient.invalidateQueries({ queryKey: ['treasury', treasuryId] });
        void queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
        void queryClient.invalidateQueries({ queryKey: ['financialEntryFormOptions'] });
        void navigate({ to: '/app/treasuries' });
      },
    });

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

  // The cash statement for this treasury: every movement with the balance after
  // it, which is what makes reconciliation against a bank statement possible.
  // treasury_id is the view's PARTITION BY column, so filtering by it is pushed
  // into the window; date filters apply after it and carry the balance forward.
  const entries = useDateOrderedPaginatedQuery<TreasuryStatementRow, TreasuryEntryFilter>({
    queryKey: ['financialEntries', 'treasury', treasuryId ?? ''],
    pageSize: 20,
    enabled: treasuryId !== null,
    fetchPage: async ({ from, to, filter: filterConfig }) => {
      const baseQuery = backendConnector
        .from('treasury_statement')
        .select('*', { count: 'exact' })
        .eq('treasury_id', treasuryId ?? '')
        // Fixed order: newest movement first, `id` breaking ties so pagination
        // walks a total order and the running balance stays stable.
        .order('value_date', { ascending: false })
        .order('id', { ascending: false });
      const dateFrom = filterConfig.dateFrom ?? '';
      const dateTo = filterConfig.dateTo ?? '';
      const withDateFrom = dateFrom.length > 0 ? baseQuery.gte('value_date', dateFrom) : baseQuery;
      const queryWithFilters = dateTo.length > 0 ? withDateFrom.lte('value_date', dateTo) : withDateFrom;
      const result = await queryWithFilters.range(from, to);
      return result.error !== null
        ? Promise.reject(result.error)
        : { rows: (result.data ?? []) as readonly TreasuryStatementRow[], totalCount: result.count ?? 0 };
    },
  });

  const submitState: SubmitState = deriveSubmitState({
    isPending: insertMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    validationError,
    insertError: insertMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
    insertSuccess: insertMutation.isSuccess,
    updateSuccess: updateMutation.isSuccess,
    formatInsertUpdateError: (error) => formatDbError(error, TREASURY_MUTATION_MESSAGES, TREASURY_FALLBACK),
    formatDeleteError: (error) => formatDbError(error, TREASURY_MUTATION_MESSAGES, TREASURY_FALLBACK),
  });

  const navLinkTo: NavLinkTo = {
    toList: ({ content, style }) => <Link to="/app/treasuries" style={style}>{content}</Link>,
    financialEntry: ({ id: entryId, content, style, ariaLabel }) => <Link to="/app/financial-entries/$id" params={{ id: entryId }} style={style} aria-label={ariaLabel}>{content}</Link>,
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
      entries={entries}
    />
  );
};
