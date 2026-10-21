import { Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { match } from 'ts-pattern';
import type { ComponentType } from 'react';
import { z } from 'zod';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import {
  toAsyncData,
  useFilteredPaginatedQuery,
  useCrudMutations,
  deriveSubmitState,
  formatDbError,
  type AsyncData,
  type DetailMode,
  type FilteredQueryResult,
  type NavLink,
  type NavLinkWithId,
  type SubmitState,
} from '@/generic';

type TenantRow = Database['public']['Tables']['tenant']['Row'];
type TenantInsert = Database['public']['Tables']['tenant']['Insert'];
type TenantUpdate = Database['public']['Tables']['tenant']['Update'];
type LeaseAgreementDbRow = Database['public']['Tables']['lease_agreement']['Row'];
type AttachmentRow = Database['public']['Tables']['attachment']['Row'];
type LeaseStatusDb = Database['public']['Enums']['lease_status'];

export const tenantInsertSchema = z.object({
  first_name: z.string().trim().min(1, 'Imię jest wymagane'),
  last_name: z.string().trim().min(1, 'Nazwisko jest wymagane'),
  email: z.string().trim().email('Nieprawidłowy adres email'),
  phone: z.string().trim().min(1, 'Telefon jest wymagany'),
  id_document_number: z.string().nullable(),
  emergency_contact_name: z.string().nullable(),
  emergency_contact_phone: z.string().nullable(),
  notes: z.string().nullable(),
  tenant_status: z.enum(['active', 'past', 'applicant'], {
    message: 'Nieprawidłowy status najemcy',
  }),
});

export type TenantInsertInput = z.input<typeof tenantInsertSchema>;

// Postgres unique-violation (23505) on duplicate email; FK-violation (23503)
// when deleting a tenant still referenced by leases.
const TENANT_MUTATION_MESSAGES: Readonly<Record<string, string>> = Object.freeze({
  '23505': 'Najemca z tym adresem email już istnieje.',
});
const TENANT_DELETE_MESSAGES: Readonly<Record<string, string>> = Object.freeze({
  '23503': 'Nie można usunąć najemcy — jest powiązany z umowami najmu.',
});
const TENANT_MUTATION_FALLBACK = 'Wystąpił nieznany błąd';

type LeaseRow = LeaseAgreementDbRow & {
  readonly property: { readonly name: string };
};

type TenantData = Readonly<{
  readonly tenant: TenantRow | null;
}>;

type NavLinkTo = Readonly<{
  readonly toProperty: NavLinkWithId;
  readonly toLease: NavLinkWithId;
  readonly toFinancialEntry: NavLinkWithId;
  readonly toList: NavLink;
}>;

type LeaseSortColumn = Extract<keyof LeaseAgreementDbRow, 'start_date' | 'end_date' | 'monthly_rent' | 'lease_status'>;
type AttachmentSortColumn = 'created_at';

type LeaseFilter = 'status' | 'dateFrom' | 'dateTo';

const LEASE_SORT_COLUMN_MAP: Readonly<Record<LeaseSortColumn, string>> = Object.freeze({
  start_date: 'start_date',
  end_date: 'end_date',
  monthly_rent: 'monthly_rent',
  lease_status: 'lease_status',
});

type TenantDeleteAction =
  | { readonly tag: 'absent' }
  | { readonly tag: 'checking' }
  | { readonly tag: 'blocked'; readonly reason: string }
  | { readonly tag: 'allowed'; readonly doDelete: () => void };

export type TenantSProps = {
  readonly asyncData: AsyncData<TenantData | null>;
  readonly doSubmit: (newRecord: TenantInsertInput) => void;
  readonly deleteAction: TenantDeleteAction;
  readonly doCancel: () => void;
  readonly onEditStart: () => void;
  readonly submitState: SubmitState;
  readonly leases: FilteredQueryResult<LeaseRow, LeaseSortColumn, LeaseFilter>;
  readonly attachments: FilteredQueryResult<AttachmentRow, AttachmentSortColumn, never>;
  readonly navLinkTo: NavLinkTo;
};

export type TenantDetailMode = DetailMode;

type Props = {
  readonly Slave: ComponentType<TenantSProps>;
  readonly mode: TenantDetailMode;
};

const fetchTenantData = async (tenantId: string): Promise<TenantData> => {
  const result = await backendConnector.from('tenant').select('*').eq('id', tenantId).single();
  return result.error !== null
    ? Promise.reject(result.error)
    : { tenant: result.data ?? null };
};

const insertTenant = async (newRecord: TenantInsert): Promise<string> => {
  const result = await backendConnector.from('tenant').insert(newRecord).select('id').single();
  return result.error !== null ? Promise.reject(result.error) : result.data.id;
};

const updateTenant = async (tenantId: string, newRecord: TenantUpdate): Promise<void> => {
  const result = await backendConnector.from('tenant').update(newRecord).eq('id', tenantId);
  return result.error !== null ? Promise.reject(result.error) : undefined;
};

const deleteTenant = async (tenantId: string): Promise<void> => {
  const result = await backendConnector.from('tenant').delete().eq('id', tenantId);
  return result.error !== null ? Promise.reject(result.error) : undefined;
};

export const TenantDetailM = ({ Slave, mode }: Props): JSX.Element => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const tenantId = match(mode)
    .with({ tag: 'create' }, () => null)
    .with({ tag: 'edit' }, ({ id }) => id)
    .exhaustive();

  const query = useQuery({
    queryKey: ['tenant', tenantId],
    queryFn: (): Promise<TenantData> =>
      match(mode)
        .with({ tag: 'create' }, () => Promise.reject(new Error('Brak identyfikatora najemcy')))
        .with({ tag: 'edit' }, ({ id }) => fetchTenantData(id))
        .exhaustive(),
    enabled: tenantId !== null,
  });

  const asyncData: AsyncData<TenantData | null> = match(mode)
    .with({ tag: 'create' }, () => ({ tag: 'fulfilled' as const, data: null }))
    .with({ tag: 'edit' }, () => toAsyncData(query, () => { void query.refetch(); }))
    .exhaustive();

  const leases = useFilteredPaginatedQuery<LeaseRow, LeaseSortColumn, LeaseFilter>({
    queryKey: ['leases', 'tenant', tenantId ?? ''],
    defaultSort: { column: 'start_date', direction: 'desc' },
    pageSize: 5,
    enabled: tenantId !== null,
    fetchPage: async ({ sort: sortConfig, from, to, filter: filterConfig }) => {
      const ascending = sortConfig.direction === 'asc';
      const baseQuery = backendConnector
        .from('lease_agreement')
        .select('*, property(name)', { count: 'exact' })
        .eq('tenant_id', tenantId ?? '')
        .order(LEASE_SORT_COLUMN_MAP[sortConfig.column], { ascending });
      const status = filterConfig.status ?? '';
      const dateFrom = filterConfig.dateFrom ?? '';
      const dateTo = filterConfig.dateTo ?? '';
      const withStatus = status.length > 0 ? baseQuery.eq('lease_status', status as LeaseStatusDb) : baseQuery;
      const withDateFrom = dateFrom.length > 0 ? withStatus.gte('start_date', dateFrom) : withStatus;
      const queryWithFilters = dateTo.length > 0 ? withDateFrom.lte('start_date', dateTo) : withDateFrom;
      const result = await queryWithFilters.range(from, to);
      return result.error !== null
        ? Promise.reject(result.error)
        : { rows: result.data ?? [], totalCount: result.count ?? 0 };
    },
  });

  const attachments = useFilteredPaginatedQuery<AttachmentRow, AttachmentSortColumn, never>({
    queryKey: ['attachments', 'tenant', tenantId ?? ''],
    defaultSort: { column: 'created_at', direction: 'desc' },
    pageSize: 5,
    enabled: tenantId !== null,
    fetchPage: async ({ sort: sortConfig, from, to }) => {
      const ascending = sortConfig.direction === 'asc';
      const result = await backendConnector
        .from('attachment')
        .select('*', { count: 'exact' })
        .eq('related_to_type', 'tenant')
        .eq('related_to_id', tenantId ?? '')
        .order(sortConfig.column, { ascending })
        .range(from, to);
      return result.error !== null
        ? Promise.reject(result.error)
        : { rows: result.data ?? [], totalCount: result.count ?? 0 };
    },
  });

  const deleteGuard = useQuery({
    queryKey: ['tenant', tenantId, 'deleteGuard'],
    queryFn: async (): Promise<{ readonly leaseCount: number }> => {
      const result = await backendConnector
        .from('lease_agreement')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId ?? '');
      return result.error !== null
        ? Promise.reject(result.error)
        : { leaseCount: result.count ?? 0 };
    },
    enabled: tenantId !== null,
  });

  const { insertMutation, updateMutation, deleteMutation, validationError, doSubmit, onEditStart } =
    useCrudMutations<TenantInsert>({
      insertFn: (newRecord) => insertTenant(newRecord),
      updateFn: (id, record) => updateTenant(id, record),
      deleteFn: (id) => deleteTenant(id),
      schema: tenantInsertSchema,
      mode,
      onInsertSuccess: (newId) => {
        void queryClient.invalidateQueries({ queryKey: ['tenants'] });
        void navigate({ to: '/app/tenants/$id', params: { id: newId } });
      },
      onUpdateSuccess: (id) => {
        void queryClient.invalidateQueries({ queryKey: ['tenants'] });
        void queryClient.invalidateQueries({ queryKey: ['tenant', id] });
      },
      onDeleteSuccess: (id) => {
        void queryClient.invalidateQueries({ queryKey: ['tenants'] });
        void queryClient.invalidateQueries({ queryKey: ['tenant', id] });
        void navigate({ to: '/app/tenants' });
      },
    });

  const deleteAction: TenantDeleteAction = match(mode)
    .with({ tag: 'create' }, () => ({ tag: 'absent' as const }))
    .with({ tag: 'edit' }, ({ id }) =>
      match(deleteGuard.status)
        .with('pending', () => ({ tag: 'checking' as const }))
        .with('error', () => ({ tag: 'blocked' as const, reason: 'Nie udało się sprawdzić powiązań najemcy.' }))
        .with('success', () => {
          const leaseCount = deleteGuard.data?.leaseCount ?? 0;
          return leaseCount > 0
            ? { tag: 'blocked' as const, reason: `Najemca ma ${leaseCount} ${leaseCount === 1 ? 'umowę najmu' : 'umów najmu'} i nie może zostać usunięty.` }
            : { tag: 'allowed' as const, doDelete: (): void => { deleteMutation.mutate(id); } };
        })
        .exhaustive(),
    )
    .exhaustive();

  const doCancel = (): void => {
    void navigate({ to: '/app/tenants' });
  };

  const submitState: SubmitState = deriveSubmitState({
    isPending: insertMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    validationError,
    insertError: insertMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
    insertSuccess: insertMutation.isSuccess,
    updateSuccess: updateMutation.isSuccess,
    formatInsertUpdateError: (error) => formatDbError(error, TENANT_MUTATION_MESSAGES, TENANT_MUTATION_FALLBACK),
    formatDeleteError: (error) => formatDbError(error, TENANT_DELETE_MESSAGES, TENANT_MUTATION_FALLBACK),
  });

  const navLinkTo: NavLinkTo = {
    toProperty: ({ id: propertyId, content, style }) => <Link to="/app/properties/$id" params={{ id: propertyId }} style={style}>{content}</Link>,
    toLease: ({ id: leaseId, content, style }) => <Link to="/app/leases/$id" params={{ id: leaseId }} style={style}>{content}</Link>,
    toFinancialEntry: ({ id: entryId, content, style }) => <Link to="/app/financial-entries/$id" params={{ id: entryId }} style={style}>{content}</Link>,
    toList: ({ content, style }) => <Link to="/app/tenants" style={style}>{content}</Link>,
  };

  return (
    <Slave
      asyncData={asyncData}
      doSubmit={doSubmit}
      deleteAction={deleteAction}
      doCancel={doCancel}
      onEditStart={onEditStart}
      submitState={submitState}
      leases={leases}
      attachments={attachments}
      navLinkTo={navLinkTo}
    />
  );
};
