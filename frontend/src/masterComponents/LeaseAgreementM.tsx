import { Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { match } from 'ts-pattern';
import type { ComponentType } from 'react';
import { z } from 'zod';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import {
  toAsyncData,
  useDateOrderedPaginatedQuery,
  useFilteredPaginatedQuery,
  useCrudMutations,
  deriveSubmitState,
  formatDbError,
  type AsyncData,
  type DetailMode,
  type FilteredQueryResult,
  type NavLink,
  type NavLinkWithId,
  type PaginatedListResult,
  type SubmitState,
} from '@/generic';

type LeaseAgreementDbRow = Database['public']['Tables']['lease_agreement']['Row'];
type LeaseAgreementInsert = Database['public']['Tables']['lease_agreement']['Insert'];
type LeaseAgreementUpdate = Database['public']['Tables']['lease_agreement']['Update'];
type FinancialEntryDbRow = Database['public']['Views']['lease_statement']['Row'];

// Postgres drops NOT NULL through a view, so every generated view column is
// nullable. Re-tighten the ones the view can never actually produce as null:
// each is NOT NULL on financial_entry, and running_balance is a SUM over a frame
// that always contains at least the current row. Same approach as
// TreasuriesM's TreasuryListRow.
type LeaseStatementRow = FinancialEntryDbRow & {
  readonly id: string;
  readonly description: string;
  readonly amount: number;
  readonly value_date: string;
  readonly running_balance: number;
};
type AttachmentDbRow = Database['public']['Tables']['attachment']['Row'];

export const leaseAgreementInsertSchema = z
  .object({
    tenant_id: z.string().uuid('Wybierz najemcę'),
    property_id: z.string().uuid('Wybierz nieruchomość'),
    start_date: z.string().min(1, 'Data rozpoczęcia jest wymagana'),
    end_date: z.string().nullable(),
    monthly_rent: z
      .number({ invalid_type_error: 'Czynsz musi być liczbą' })
      .finite('Czynsz musi być liczbą')
      .positive('Czynsz musi być większy od zera'),
    deposit_amount: z
      .number({ invalid_type_error: 'Kaucja musi być liczbą' })
      .finite('Kaucja musi być liczbą')
      .nonnegative('Kaucja nie może być ujemna'),
    lease_status: z.enum(['active', 'expired', 'terminated'], {
      message: 'Nieprawidłowy status umowy',
    }),
    notes: z.string().nullable(),
  })
  .refine(
    (v) => v.end_date === null || v.end_date.length === 0 || v.end_date >= v.start_date,
    { message: 'Data zakończenia nie może być wcześniejsza niż data rozpoczęcia', path: ['end_date'] },
  );

export type LeaseAgreementInsertInput = z.input<typeof leaseAgreementInsertSchema>;

// Postgres FK-violation (23503) when deleting a lease still linked to transactions.
const LEASE_DELETE_MESSAGES: Readonly<Record<string, string>> = Object.freeze({
  '23503': 'Nie można usunąć umowy — są z nią powiązane transakcje.',
});
const LEASE_DELETE_FALLBACK = 'Wystąpił nieznany błąd';

type TenantOption = { readonly id: string; readonly label: string };
type PropertyOption = { readonly id: string; readonly label: string };

export type LeaseFormOptions = Readonly<{
  readonly tenants: readonly TenantOption[];
  readonly properties: readonly PropertyOption[];
}>;

type LeaseAgreementData = Readonly<{
  readonly leaseAgreement:
    | (LeaseAgreementDbRow & {
        readonly tenant: { readonly first_name: string; readonly last_name: string };
        readonly property: { readonly name: string };
      })
    | null;
}>;

type NavLinkTo = Readonly<{
  readonly tenant: NavLinkWithId;
  readonly property: NavLinkWithId;
  readonly financialEntry: NavLinkWithId;
  readonly toList: NavLink;
}>;

// The lease ledger has NO sort at all — it is always value_date DESC, id DESC.
// Only the attachments sub-table on this page remains sortable.
type AttachmentSortColumn = 'created_at';

// Only date-range filtering. No sort, no text search: the running balance is
// only monotonic in (value_date, id) order, and a text filter would remove rows
// from the middle of the series, making the balance jump by invisible amounts.
type LeaseFinancialEntryFilter = 'dateFrom' | 'dateTo';

type LeaseAgreementDeleteAction =
  | { readonly tag: 'absent' }
  | { readonly tag: 'checking' }
  | { readonly tag: 'blocked'; readonly reason: string }
  | { readonly tag: 'allowed'; readonly doDelete: () => void };

export type LeaseAgreementSProps = {
  readonly asyncData: AsyncData<LeaseAgreementData | null>;
  readonly formOptions: AsyncData<LeaseFormOptions>;
  readonly doSubmit: (newRecord: LeaseAgreementInsertInput) => void;
  readonly deleteAction: LeaseAgreementDeleteAction;
  readonly doCancel: () => void;
  readonly onEditStart: () => void;
  readonly submitState: SubmitState;
  readonly financialEntries: PaginatedListResult<LeaseStatementRow, LeaseFinancialEntryFilter>;
  readonly attachments: FilteredQueryResult<AttachmentDbRow, AttachmentSortColumn, never>;
  readonly navLinkTo: NavLinkTo;
};

export type LeaseAgreementDetailMode = DetailMode;

type Props = {
  readonly Slave: ComponentType<LeaseAgreementSProps>;
  readonly mode: LeaseAgreementDetailMode;
};

const fetchLeaseAgreementData = async (leaseId: string): Promise<LeaseAgreementData> => {
  const result = await backendConnector
    .from('lease_agreement')
    .select('*, tenant(first_name,last_name), property(name)')
    .eq('id', leaseId)
    .single();
  return result.error !== null
    ? Promise.reject(result.error)
    : { leaseAgreement: result.data ?? null };
};

const fetchFormOptions = async (): Promise<LeaseFormOptions> => {
  const [tenantsResult, propertiesResult] = await Promise.all([
    backendConnector.from('tenant').select('id, first_name, last_name').order('last_name'),
    backendConnector.from('property').select('id, name').order('name'),
  ]);
  const combinedError = tenantsResult.error ?? propertiesResult.error;
  return combinedError !== null
    ? Promise.reject(combinedError)
    : {
        tenants: (tenantsResult.data ?? []).map((t) => ({
          id: t.id,
          label: `${t.first_name} ${t.last_name}`.trim(),
        })),
        properties: (propertiesResult.data ?? []).map((p) => ({ id: p.id, label: p.name })),
      };
};

const insertLeaseAgreement = async (newRecord: LeaseAgreementInsert): Promise<string> => {
  const result = await backendConnector.from('lease_agreement').insert(newRecord).select('id').single();
  return result.error !== null ? Promise.reject(result.error) : result.data.id;
};

const updateLeaseAgreement = async (leaseId: string, newRecord: LeaseAgreementUpdate): Promise<void> => {
  const result = await backendConnector.from('lease_agreement').update(newRecord).eq('id', leaseId);
  return result.error !== null ? Promise.reject(result.error) : undefined;
};

const deleteLeaseAgreement = async (leaseId: string): Promise<void> => {
  const result = await backendConnector.from('lease_agreement').delete().eq('id', leaseId);
  return result.error !== null ? Promise.reject(result.error) : undefined;
};

export const LeaseAgreementDetailM = ({ Slave, mode }: Props): JSX.Element => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const leaseId = match(mode)
    .with({ tag: 'create' }, () => null)
    .with({ tag: 'edit' }, ({ id }) => id)
    .exhaustive();

  const query = useQuery({
    queryKey: ['leaseAgreement', leaseId],
    queryFn: (): Promise<LeaseAgreementData> =>
      match(mode)
        .with({ tag: 'create' }, () => Promise.reject(new Error('Brak identyfikatora umowy')))
        .with({ tag: 'edit' }, ({ id }) => fetchLeaseAgreementData(id))
        .exhaustive(),
    enabled: leaseId !== null,
  });

  const asyncData: AsyncData<LeaseAgreementData | null> = match(mode)
    .with({ tag: 'create' }, () => ({ tag: 'fulfilled' as const, data: null }))
    .with({ tag: 'edit' }, () => toAsyncData(query, () => { void query.refetch(); }))
    .exhaustive();

  const formOptionsQuery = useQuery({
    queryKey: ['leaseFormOptions'],
    queryFn: (): Promise<LeaseFormOptions> => fetchFormOptions(),
  });

  const formOptions = toAsyncData(formOptionsQuery, () => { void formOptionsQuery.refetch(); });

  const financialEntries = useDateOrderedPaginatedQuery<LeaseStatementRow, LeaseFinancialEntryFilter>({
    queryKey: ['financialEntries', 'leaseAgreement', leaseId ?? ''],
    pageSize: 5,
    enabled: leaseId !== null,
    fetchPage: async ({ from, to, filter: filterConfig }) => {
      const baseQuery = backendConnector
        // lease_statement carries the per-entry running balance of this lease's
        // receivable account. Filtering by lease_id is a predicate on the view's
        // PARTITION BY column, so it is pushed into the window and the balances
        // are this lease's own series. Date filters are applied AFTER the window,
        // so a filtered page still carries the balance forward from before it.
        .from('lease_statement')
        .select('*', { count: 'exact' })
        .eq('lease_id', leaseId ?? '')
        // Fixed order: newest first, with `id` breaking ties so pagination walks
        // a total order and the running balance reads monotonically.
        .order('value_date', { ascending: false })
        .order('id', { ascending: false });
      const dateFrom = filterConfig.dateFrom ?? '';
      const dateTo = filterConfig.dateTo ?? '';
      const withDateFrom = dateFrom.length > 0 ? baseQuery.gte('value_date', dateFrom) : baseQuery;
      const queryWithFilters = dateTo.length > 0 ? withDateFrom.lte('value_date', dateTo) : withDateFrom;
      const result = await queryWithFilters.range(from, to);
      return result.error !== null
        ? Promise.reject(result.error)
        : { rows: (result.data ?? []) as readonly LeaseStatementRow[], totalCount: result.count ?? 0 };
    },
  });

  const attachments = useFilteredPaginatedQuery<AttachmentDbRow, AttachmentSortColumn, never>({
    queryKey: ['attachments', 'lease', leaseId ?? ''],
    defaultSort: { column: 'created_at', direction: 'desc' },
    pageSize: 5,
    enabled: leaseId !== null,
    fetchPage: async ({ sort: sortConfig, from, to }) => {
      const ascending = sortConfig.direction === 'asc';
      const result = await backendConnector
        .from('attachment')
        .select('*', { count: 'exact' })
        .eq('related_to_type', 'lease')
        .eq('related_to_id', leaseId ?? '')
        .order(sortConfig.column, { ascending })
        .range(from, to);
      return result.error !== null
        ? Promise.reject(result.error)
        : { rows: result.data ?? [], totalCount: result.count ?? 0 };
    },
  });

  const deleteGuard = useQuery({
    queryKey: ['leaseAgreement', leaseId, 'deleteGuard'],
    queryFn: async (): Promise<{ readonly entryCount: number }> => {
      const result = await backendConnector
        .from('financial_entry')
        .select('id', { count: 'exact', head: true })
        .eq('lease_id', leaseId ?? '');
      return result.error !== null
        ? Promise.reject(result.error)
        : { entryCount: result.count ?? 0 };
    },
    enabled: leaseId !== null,
  });

  const { insertMutation, updateMutation, deleteMutation, validationError, doSubmit, onEditStart } =
    useCrudMutations<LeaseAgreementInsert>({
      insertFn: (newRecord) => insertLeaseAgreement(newRecord),
      updateFn: (id, record) => updateLeaseAgreement(id, record),
      deleteFn: (id) => deleteLeaseAgreement(id),
      schema: leaseAgreementInsertSchema,
      mode,
      onInsertSuccess: (newId) => {
        void queryClient.invalidateQueries({ queryKey: ['lease_agreements'] });
        void navigate({ to: '/app/leases/$id', params: { id: newId } });
      },
      onUpdateSuccess: (id) => {
        void queryClient.invalidateQueries({ queryKey: ['lease_agreements'] });
        void queryClient.invalidateQueries({ queryKey: ['leaseAgreement', id] });
      },
      onDeleteSuccess: (id) => {
        void queryClient.invalidateQueries({ queryKey: ['lease_agreements'] });
        void queryClient.invalidateQueries({ queryKey: ['leaseAgreement', id] });
        void navigate({ to: '/app/leases' });
      },
    });

  const deleteAction: LeaseAgreementDeleteAction = match(mode)
    .with({ tag: 'create' }, () => ({ tag: 'absent' as const }))
    .with({ tag: 'edit' }, ({ id }) =>
      match(deleteGuard.status)
        .with('pending', () => ({ tag: 'checking' as const }))
        .with('error', () => ({ tag: 'blocked' as const, reason: 'Nie udało się sprawdzić powiązań umowy.' }))
        .with('success', () => {
          const entryCount = deleteGuard.data?.entryCount ?? 0;
          return entryCount > 0
            ? { tag: 'blocked' as const, reason: `Umowa ma ${entryCount} ${entryCount === 1 ? 'powiązaną transakcję' : 'powiązanych transakcji'} i nie może zostać usunięta.` }
            : { tag: 'allowed' as const, doDelete: (): void => { deleteMutation.mutate(id); } };
        })
        .exhaustive(),
    )
    .exhaustive();

  const doCancel = (): void => {
    void navigate({ to: '/app/leases' });
  };

  const submitState: SubmitState = deriveSubmitState({
    isPending: insertMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    validationError,
    insertError: insertMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
    insertSuccess: insertMutation.isSuccess,
    updateSuccess: updateMutation.isSuccess,
    formatDeleteError: (error) => formatDbError(error, LEASE_DELETE_MESSAGES, LEASE_DELETE_FALLBACK),
  });

  const navLinkTo: NavLinkTo = {
    tenant: ({ id: tenantId, content, style, ariaLabel }) => <Link to="/app/tenants/$id" params={{ id: tenantId }} style={style} aria-label={ariaLabel}>{content}</Link>,
    property: ({ id: propertyId, content, style, ariaLabel }) => <Link to="/app/properties/$id" params={{ id: propertyId }} style={style} aria-label={ariaLabel}>{content}</Link>,
    financialEntry: ({ id: entryId, content, style, ariaLabel }) => <Link to="/app/financial-entries/$id" params={{ id: entryId }} style={style} aria-label={ariaLabel}>{content}</Link>,
    toList: ({ content, style }) => <Link to="/app/leases" style={style}>{content}</Link>,
  };

  return (
    <Slave
      asyncData={asyncData}
      formOptions={formOptions}
      doSubmit={doSubmit}
      deleteAction={deleteAction}
      doCancel={doCancel}
      onEditStart={onEditStart}
      submitState={submitState}
      financialEntries={financialEntries}
      attachments={attachments}
      navLinkTo={navLinkTo}
    />
  );
};
