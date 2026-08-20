import { Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { match } from 'ts-pattern';
import { useState } from 'react';
import type { ComponentType } from 'react';
import { z } from 'zod';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import {
  toAsyncData,
  useFilteredPaginatedQuery,
  type AsyncData,
  type FilteredQueryResult,
  type NavLink,
  type NavLinkWithId,
} from '@/generic';

type PropertyDbRow = Database['public']['Tables']['properties']['Row'];
type PropertyInsert = Database['public']['Tables']['properties']['Insert'];
type PropertyUpdate = Database['public']['Tables']['properties']['Update'];

export const propertyInsertSchema = z.object({
  name: z.string().trim().min(1, 'Nazwa jest wymagana'),
  address: z.string().trim().min(1, 'Adres jest wymagany'),
  property_type: z.enum(['apartment', 'house', 'commercial', 'room'], {
    message: 'Nieprawidłowy typ nieruchomości',
  }),
  property_status: z.enum(['available', 'occupied', 'inactive'], {
    message: 'Nieprawidłowy status nieruchomości',
  }),
  size_sqm: z
    .number({ invalid_type_error: 'Powierzchnia musi być liczbą' })
    .finite('Powierzchnia musi być liczbą')
    .positive('Powierzchnia musi być dodatnia')
    .nullable(),
  bedrooms: z
    .number({ invalid_type_error: 'Liczba sypialni musi być liczbą' })
    .int('Liczba sypialni musi być liczbą całkowitą')
    .nonnegative('Liczba sypialni nie może być ujemna')
    .nullable(),
  monthly_rent: z
    .number({ invalid_type_error: 'Czynsz musi być liczbą' })
    .finite('Czynsz musi być liczbą')
    .positive('Czynsz musi być większy od zera'),
  deposit_amount: z
    .number({ invalid_type_error: 'Kaucja musi być liczbą' })
    .finite('Kaucja musi być liczbą')
    .nonnegative('Kaucja nie może być ujemna'),
  notes: z.string().nullable(),
});

export type PropertyInsertInput = z.input<typeof propertyInsertSchema>;

const formatZodIssues = (error: z.ZodError): string =>
  error.issues.map((issue) => issue.message).join('; ');

const formatDeleteError = (error: Error | null): string => {
  const code = (error as { readonly code?: string } | null)?.code;
  return code === '23503'
    ? 'Nie można usunąć nieruchomości — jest powiązana z umowami najmu lub transakcjami.'
    : error?.message ?? 'Wystąpił nieznany błąd';
};
type LeaseAgreementDbRow = Database['public']['Tables']['lease_agreements']['Row'];
type TransactionDbRow = Database['public']['Tables']['transactions']['Row'];
type FinancialSummaryDbRow = Database['public']['Views']['property_financial_summary']['Row'];
type OccupancyDbRow = Database['public']['Views']['property_occupancy']['Row'];
type AttachmentDbRow = Database['public']['Tables']['attachments']['Row'];
type TransactionTypeDb = Database['public']['Enums']['transaction_type'];
type TransactionStatusDb = Database['public']['Enums']['transaction_status'];
type LeaseStatusDb = Database['public']['Enums']['lease_status'];

type LeaseRow = LeaseAgreementDbRow & {
  readonly tenants: { readonly first_name: string; readonly last_name: string; };
};

type PropertyData = Readonly<{
  readonly property: PropertyDbRow | null;
  readonly occupancy: OccupancyDbRow | null;
  readonly financial: FinancialSummaryDbRow | null;
}>;

type NavLinkTo = Readonly<{
  readonly tenant: NavLinkWithId;
  readonly lease: NavLinkWithId;
  readonly transaction: NavLinkWithId;
  readonly toList: NavLink;
}>;

type LeaseSortColumn = Extract<keyof LeaseAgreementDbRow, 'start_date' | 'end_date' | 'monthly_rent' | 'lease_status'>;
type TransactionSortColumn = Extract<keyof TransactionDbRow, 'due_date' | 'type' | 'amount' | 'transaction_status'>;
type AttachmentSortColumn = 'created_at';

type LeaseFilter = 'status' | 'dateFrom' | 'dateTo';
type TransactionFilter = 'text' | 'type' | 'status' | 'dateFrom' | 'dateTo';

const LEASE_SORT_COLUMN_MAP: Readonly<Record<LeaseSortColumn, string>> = Object.freeze({
  start_date: 'start_date',
  end_date: 'end_date',
  monthly_rent: 'monthly_rent',
  lease_status: 'lease_status',
});

const TRANSACTION_SORT_COLUMN_MAP: Readonly<Record<TransactionSortColumn, string>> = Object.freeze({
  due_date: 'due_date',
  type: 'type',
  amount: 'amount',
  transaction_status: 'transaction_status',
});

type SubmitState =
  | { readonly tag: 'idle' }
  | { readonly tag: 'submitting' }
  | { readonly tag: 'success' }
  | { readonly tag: 'error'; readonly message: string };

type PropertyDeleteAction =
  | { readonly tag: 'absent' }
  | { readonly tag: 'checking' }
  | { readonly tag: 'blocked'; readonly reason: string }
  | { readonly tag: 'allowed'; readonly doDelete: () => void };

export type PropertySProps = {
  readonly asyncData: AsyncData<PropertyData | null>;
  readonly doSubmit: (newRecord: PropertyInsertInput) => void;
  readonly deleteAction: PropertyDeleteAction;
  readonly doCancel: () => void;
  readonly onEditStart: () => void;
  readonly submitState: SubmitState;
  readonly leases: FilteredQueryResult<LeaseRow, LeaseSortColumn, LeaseFilter>;
  readonly transactions: FilteredQueryResult<TransactionDbRow, TransactionSortColumn, TransactionFilter>;
  readonly attachments: FilteredQueryResult<AttachmentDbRow, AttachmentSortColumn, never>;
  readonly navLinkTo: NavLinkTo;
};

export type PropertyDetailMode =
  | { readonly tag: 'create' }
  | { readonly tag: 'edit'; readonly id: string };

type Props = {
  readonly Slave: ComponentType<PropertySProps>;
  readonly mode: PropertyDetailMode;
};

const fetchPropertyData = async (propertyId: string): Promise<PropertyData> => {
  const [propertyResult, occupancyResult, financialResult] = await Promise.all([
    backendConnector.from('properties').select('*').eq('id', propertyId).single(),
    backendConnector.from('property_occupancy').select('*').eq('id', propertyId).maybeSingle(),
    backendConnector.from('property_financial_summary').select('*').eq('property_id', propertyId).maybeSingle(),
  ]);

  const combinedError = propertyResult.error ?? occupancyResult.error ?? financialResult.error;
  return combinedError !== null
    ? Promise.reject(combinedError)
    : {
      property: propertyResult.data ?? null,
      occupancy: occupancyResult.data ?? null,
      financial: financialResult.data ?? null,
    };
};

const insertProperty = async (newRecord: PropertyInsert): Promise<string> => {
  const result = await backendConnector.from('properties').insert(newRecord).select('id').single();
  return result.error !== null ? Promise.reject(result.error) : result.data.id;
};

const updateProperty = async (propertyId: string, newRecord: PropertyUpdate): Promise<void> => {
  const result = await backendConnector.from('properties').update(newRecord).eq('id', propertyId);
  return result.error !== null ? Promise.reject(result.error) : undefined;
};

const deleteProperty = async (propertyId: string): Promise<void> => {
  const result = await backendConnector.from('properties').delete().eq('id', propertyId);
  return result.error !== null ? Promise.reject(result.error) : undefined;
};

export const PropertyDetailM = ({ Slave, mode }: Props): JSX.Element => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [validationError, setValidationError] = useState<string | null>(null);

  const propertyId = match(mode)
    .with({ tag: 'create' }, () => null)
    .with({ tag: 'edit' }, ({ id }) => id)
    .exhaustive();

  const query = useQuery({
    queryKey: ['property', propertyId],
    queryFn: (): Promise<PropertyData> =>
      match(mode)
        .with({ tag: 'create' }, () => Promise.reject(new Error('Brak identyfikatora nieruchomości')))
        .with({ tag: 'edit' }, ({ id }) => fetchPropertyData(id))
        .exhaustive(),
    enabled: propertyId !== null,
  });

  const asyncData: AsyncData<PropertyData | null> = match(mode)
    .with({ tag: 'create' }, () => ({ tag: 'fulfilled' as const, data: null }))
    .with({ tag: 'edit' }, () => toAsyncData(query, () => { void query.refetch(); }))
    .exhaustive();

  const leases = useFilteredPaginatedQuery<LeaseRow, LeaseSortColumn, LeaseFilter>({
    queryKey: ['leases', 'property', propertyId ?? ''],
    defaultSort: { column: 'start_date', direction: 'desc' },
    pageSize: 5,
    enabled: propertyId !== null,
    fetchPage: async ({ sort: sortConfig, from, to, filter: filterConfig }) => {
      const ascending = sortConfig.direction === 'asc';
      const baseQuery = backendConnector
        .from('lease_agreements')
        .select('*, tenants(first_name,last_name)', { count: 'exact' })
        .eq('property_id', propertyId ?? '')
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

  const transactions = useFilteredPaginatedQuery<TransactionDbRow, TransactionSortColumn, TransactionFilter>({
    queryKey: ['transactions', 'property', propertyId ?? ''],
    defaultSort: { column: 'due_date', direction: 'desc' },
    pageSize: 5,
    enabled: propertyId !== null,
    fetchPage: async ({ sort: sortConfig, from, to, filter: filterConfig }) => {
      const ascending = sortConfig.direction === 'asc';
      const baseQuery = backendConnector
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('property_id', propertyId ?? '')
        .order(TRANSACTION_SORT_COLUMN_MAP[sortConfig.column], { ascending });
      const text = filterConfig.text ?? '';
      const type = filterConfig.type ?? '';
      const status = filterConfig.status ?? '';
      const dateFrom = filterConfig.dateFrom ?? '';
      const dateTo = filterConfig.dateTo ?? '';
      const withText = text.length > 0 ? baseQuery.ilike('description', `*${text}*`) : baseQuery;
      const withType = type.length > 0 ? withText.eq('type', type as TransactionTypeDb) : withText;
      const withStatus = status.length > 0 ? withType.eq('transaction_status', status as TransactionStatusDb) : withType;
      const withDateFrom = dateFrom.length > 0 ? withStatus.gte('due_date', dateFrom) : withStatus;
      const queryWithFilters = dateTo.length > 0 ? withDateFrom.lte('due_date', dateTo) : withDateFrom;
      const result = await queryWithFilters.range(from, to);
      return result.error !== null
        ? Promise.reject(result.error)
        : { rows: result.data ?? [], totalCount: result.count ?? 0 };
    },
  });

  const attachments = useFilteredPaginatedQuery<AttachmentDbRow, AttachmentSortColumn, never>({
    queryKey: ['attachments', 'property', propertyId ?? ''],
    defaultSort: { column: 'created_at', direction: 'desc' },
    pageSize: 5,
    enabled: propertyId !== null,
    fetchPage: async ({ sort: sortConfig, from, to }) => {
      const ascending = sortConfig.direction === 'asc';
      const result = await backendConnector
        .from('attachments')
        .select('*', { count: 'exact' })
        .eq('related_to_type', 'property')
        .eq('related_to_id', propertyId ?? '')
        .order(sortConfig.column, { ascending })
        .range(from, to);
      return result.error !== null
        ? Promise.reject(result.error)
        : { rows: result.data ?? [], totalCount: result.count ?? 0 };
    },
  });

  const deleteGuard = useQuery({
    queryKey: ['property', propertyId, 'deleteGuard'],
    queryFn: async (): Promise<{ readonly leaseCount: number; readonly directTransactionCount: number }> => {
      const [leaseResult, transactionResult] = await Promise.all([
        backendConnector
          .from('lease_agreements')
          .select('id', { count: 'exact', head: true })
          .eq('property_id', propertyId ?? ''),
        backendConnector
          .from('transactions')
          .select('id', { count: 'exact', head: true })
          .eq('property_id', propertyId ?? '')
          .is('lease_id', null),
      ]);
      const combinedError = leaseResult.error ?? transactionResult.error;
      return combinedError !== null
        ? Promise.reject(combinedError)
        : { leaseCount: leaseResult.count ?? 0, directTransactionCount: transactionResult.count ?? 0 };
    },
    enabled: propertyId !== null,
  });

  const insertMutation = useMutation({
    mutationFn: (newRecord: PropertyInsert): Promise<string> => insertProperty(newRecord),
    onSuccess: (newId) => {
      void queryClient.invalidateQueries({ queryKey: ['properties'] });
      void navigate({ to: '/app/properties/$id', params: { id: newId } });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, record }: { readonly id: string; readonly record: PropertyUpdate }): Promise<void> =>
      updateProperty(id, record),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['properties'] });
      void queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string): Promise<void> => deleteProperty(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['properties'] });
      void queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
      void navigate({ to: '/app/properties' });
    },
  });

  const doSubmit = (newRecord: PropertyInsertInput): void =>
    match(propertyInsertSchema.safeParse(newRecord))
      .with(
        { success: true },
        ({ data }) => {
          setValidationError(null);
          match(mode)
            .with({ tag: 'create' }, () => insertMutation.mutate(data))
            .with({ tag: 'edit' }, ({ id }) => updateMutation.mutate({ id, record: data }))
            .exhaustive();
        },
      )
      .with(
        { success: false },
        ({ error }) => {
          setValidationError(formatZodIssues(error));
        },
      )
      .exhaustive();

  const onEditStart = (): void => {
    insertMutation.reset();
    updateMutation.reset();
    deleteMutation.reset();
    setValidationError(null);
  };

  const deleteAction: PropertyDeleteAction = match(mode)
    .with({ tag: 'create' }, () => ({ tag: 'absent' as const }))
    .with({ tag: 'edit' }, ({ id }) =>
      match(deleteGuard.status)
        .with('pending', () => ({ tag: 'checking' as const }))
        .with('error', () => ({ tag: 'blocked' as const, reason: 'Nie udało się sprawdzić powiązań nieruchomości.' }))
        .with('success', () => {
          const leaseCount = deleteGuard.data?.leaseCount ?? 0;
          const directTransactionCount = deleteGuard.data?.directTransactionCount ?? 0;
          return leaseCount > 0
            ? { tag: 'blocked' as const, reason: `Nieruchomość jest powiązana z ${leaseCount} ${leaseCount === 1 ? 'umową najmu' : 'umowami najmu'} i nie może zostać usunięta.` }
            : directTransactionCount > 0
              ? { tag: 'blocked' as const, reason: 'Nieruchomość ma powiązane transakcje i nie może zostać usunięta.' }
              : { tag: 'allowed' as const, doDelete: (): void => { deleteMutation.mutate(id); } };
        })
        .exhaustive()
    )
    .exhaustive();

  const doCancel = (): void => {
    void navigate({ to: '/app/properties' });
  };

  const submitState: SubmitState =
    insertMutation.isPending || updateMutation.isPending || deleteMutation.isPending
      ? { tag: 'submitting' }
      : validationError !== null
        ? { tag: 'error', message: validationError }
        : insertMutation.error !== null || updateMutation.error !== null
          ? { tag: 'error', message: (insertMutation.error ?? updateMutation.error)?.message ?? 'Unknown error' }
          : deleteMutation.error !== null
            ? { tag: 'error', message: formatDeleteError(deleteMutation.error) }
            : insertMutation.isSuccess || updateMutation.isSuccess
              ? { tag: 'success' }
              : { tag: 'idle' };

  const navLinkTo: NavLinkTo = {
    tenant: ({ id: tenantId, content, style, ariaLabel }) => <Link to="/app/tenants/$id" params={{ id: tenantId }} style={style} aria-label={ariaLabel}>{content}</Link>,
    lease: ({ id: leaseId, content, style, ariaLabel }) => <Link to="/app/leases/$id" params={{ id: leaseId }} style={style} aria-label={ariaLabel}>{content}</Link>,
    transaction: ({ id: transactionId, content, style, ariaLabel }) => <Link to="/app/transactions/$id" params={{ id: transactionId }} style={style} aria-label={ariaLabel}>{content}</Link>,
    toList: ({ content, style }) => <Link to="/app/properties" style={style}>{content}</Link>,
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
      transactions={transactions}
      attachments={attachments}
      navLinkTo={navLinkTo}
    />
  );
};