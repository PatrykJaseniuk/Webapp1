import { Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { match } from 'ts-pattern';
import { useState } from 'react';
import type { ComponentType } from 'react';
import { z } from 'zod';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import { toAsyncData, useFilteredPaginatedQuery, type AsyncData, type FilteredQueryResult, type NavLink, type NavLinkWithId } from '@/generic';

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

// Only value_date — the running balance is monotonic only in (value_date, id).
type TreasuryEntrySortColumn = 'value_date';
type TreasuryEntryFilter = 'text' | 'dateFrom' | 'dateTo';

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
  readonly financialEntry: NavLinkWithId;
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
  readonly entries: FilteredQueryResult<TreasuryStatementRow, TreasuryEntrySortColumn, TreasuryEntryFilter>;
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

  // The cash statement for this treasury: every movement with the balance after
  // it, which is what makes reconciliation against a bank statement possible.
  // treasury_id is the view's PARTITION BY column, so filtering by it is pushed
  // into the window; date filters apply after it and carry the balance forward.
  const entries = useFilteredPaginatedQuery<TreasuryStatementRow, TreasuryEntrySortColumn, TreasuryEntryFilter>({
    queryKey: ['financialEntries', 'treasury', treasuryId ?? ''],
    defaultSort: { column: 'value_date', direction: 'desc' },
    pageSize: 20,
    enabled: treasuryId !== null,
    fetchPage: async ({ sort: sortConfig, from, to, filter: filterConfig }) => {
      const ascending = sortConfig.direction === 'asc';
      const baseQuery = backendConnector
        .from('treasury_statement')
        .select('*', { count: 'exact' })
        .eq('treasury_id', treasuryId ?? '')
        .order('value_date', { ascending })
        // Tie-break on `id` so `.range()` paginates over a total order and the
        // running balance stays stable — see the note in FinancialEntriesM.
        .order('id', { ascending });
      const text = filterConfig.text ?? '';
      const dateFrom = filterConfig.dateFrom ?? '';
      const dateTo = filterConfig.dateTo ?? '';
      const withText = text.length > 0 ? baseQuery.ilike('description', `*${text}*`) : baseQuery;
      const withDateFrom = dateFrom.length > 0 ? withText.gte('value_date', dateFrom) : withText;
      const queryWithFilters = dateTo.length > 0 ? withDateFrom.lte('value_date', dateTo) : withDateFrom;
      const result = await queryWithFilters.range(from, to);
      return result.error !== null
        ? Promise.reject(result.error)
        : { rows: (result.data ?? []) as readonly TreasuryStatementRow[], totalCount: result.count ?? 0 };
    },
  });

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
