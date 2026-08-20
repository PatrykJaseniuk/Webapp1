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
    .nonnegative('Czynsz nie może być ujemny'),
  deposit_amount: z
    .number({ invalid_type_error: 'Kaucja musi być liczbą' })
    .finite('Kaucja musi być liczbą')
    .nonnegative('Kaucja nie może być ujemna'),
  notes: z.string().nullable(),
});

export type PropertyInsertInput = z.input<typeof propertyInsertSchema>;

const formatZodIssues = (error: z.ZodError): string =>
  error.issues.map((issue) => issue.message).join('; ');
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

export type SubmitState =
  | { readonly tag: 'idle' }
  | { readonly tag: 'submitting' }
  | { readonly tag: 'success' }
  | { readonly tag: 'error'; readonly message: string };

export type PropertySProps = {
  readonly asyncData: AsyncData<PropertyData | null>;
  readonly doEdit: (newRecord: PropertyInsertInput) => void;
  readonly doDelete: (() => void) | null;
  readonly doCancel: () => void;
  readonly submitState: SubmitState;
  readonly leases: FilteredQueryResult<LeaseRow, LeaseSortColumn, LeaseFilter>;
  readonly transactions: FilteredQueryResult<TransactionDbRow, TransactionSortColumn, TransactionFilter>;
  readonly attachments: FilteredQueryResult<AttachmentDbRow, AttachmentSortColumn, never>;
  readonly navLinkTo: NavLinkTo;
};

type Props = {
  readonly Slave: ComponentType<PropertySProps>;
  readonly id: string | null;
};

export const PropertyDetailM = ({
  Slave,
  id,
}: Props): JSX.Element => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [validationError, setValidationError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['property', id],
    queryFn: async (): Promise<PropertyData> => {
      const [propertyResult, occupancyResult, financialResult] = await Promise.all([
        backendConnector.from('properties').select('*').eq('id', id as string).single(),
        backendConnector.from('property_occupancy').select('*').eq('id', id as string).maybeSingle(),
        backendConnector.from('property_financial_summary').select('*').eq('property_id', id as string).maybeSingle(),
      ]);

      const combinedError = propertyResult.error ?? occupancyResult.error ?? financialResult.error;
      return combinedError !== null
        ? Promise.reject(combinedError)
        : {
          property: propertyResult.data ?? null,
          occupancy: occupancyResult.data ?? null,
          financial: financialResult.data ?? null,
        };
    },
    enabled: id !== null,
  });

  const asyncData: AsyncData<PropertyData | null> =
    id === null ?
      { tag: 'fulfilled', data: null } :
      toAsyncData(query, () => { void query.refetch(); });

  const leases = useFilteredPaginatedQuery<LeaseRow, LeaseSortColumn, LeaseFilter>({
    queryKey: ['leases', 'property', id ?? ''],
    defaultSort: { column: 'start_date', direction: 'desc' },
    pageSize: 5,
    enabled: id !== null,
    fetchPage: async ({ sort: sortConfig, from, to, filter: filterConfig }) => {
      const ascending = sortConfig.direction === 'asc';
      const baseQuery = backendConnector
        .from('lease_agreements')
        .select('*, tenants(first_name,last_name)', { count: 'exact' })
        .eq('property_id', id ?? '')
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
    queryKey: ['transactions', 'property', id ?? ''],
    defaultSort: { column: 'due_date', direction: 'desc' },
    pageSize: 5,
    enabled: id !== null,
    fetchPage: async ({ sort: sortConfig, from, to, filter: filterConfig }) => {
      const ascending = sortConfig.direction === 'asc';
      const baseQuery = backendConnector
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('property_id', id ?? '')
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
    queryKey: ['attachments', 'property', id ?? ''],
    defaultSort: { column: 'created_at', direction: 'desc' },
    pageSize: 5,
    enabled: id !== null,
    fetchPage: async ({ sort: sortConfig, from, to }) => {
      const ascending = sortConfig.direction === 'asc';
      const result = await backendConnector
        .from('attachments')
        .select('*', { count: 'exact' })
        .eq('related_to_type', 'property')
        .eq('related_to_id', id ?? '')
        .order(sortConfig.column, { ascending })
        .range(from, to);
      return result.error !== null
        ? Promise.reject(result.error)
        : { rows: result.data ?? [], totalCount: result.count ?? 0 };
    },
  });

  const insertMutation = useMutation({
    mutationFn: async (newRecord: PropertyInsert): Promise<string> => {
      const result = await backendConnector.from('properties').insert(newRecord).select('id').single();
      return result.error !== null ? Promise.reject(result.error) : result.data.id;
    },
    onSuccess: (newId) => {
      void queryClient.invalidateQueries({ queryKey: ['properties'] });
      void navigate({ to: '/app/properties/$id', params: { id: newId } });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (newRecord: PropertyInsert): Promise<void> => {
      const result = await backendConnector.from('properties').update(newRecord).eq('id', id as string);
      return result.error !== null ? Promise.reject(result.error) : undefined;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['properties'] });
      void queryClient.invalidateQueries({ queryKey: ['property', id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      const result = await backendConnector.from('properties').delete().eq('id', id as string);
      return result.error !== null ? Promise.reject(result.error) : undefined;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['properties'] });
      void navigate({ to: '/app/properties' });
    },
  });

  const doEdit = (newRecord: PropertyInsertInput): void =>
    match(propertyInsertSchema.safeParse(newRecord))
      .with(
        { success: true },
        ({ data }) => {
          setValidationError(null);
          id === null ? insertMutation.mutate(data) : updateMutation.mutate(data);
        },
      )
      .with(
        { success: false },
        ({ error }) => {
          setValidationError(formatZodIssues(error));
        },
      )
      .exhaustive();

  const doDelete = (): void => {
    deleteMutation.mutate();
  };

  const doCancel = (): void => {
    void navigate({ to: '/app/properties' });
  };

  const submitState: SubmitState =
    insertMutation.isPending || updateMutation.isPending || deleteMutation.isPending
      ? { tag: 'submitting' }
      : validationError !== null
        ? { tag: 'error', message: validationError }
        : (insertMutation.error ?? updateMutation.error ?? deleteMutation.error) !== null
          ? { tag: 'error', message: (insertMutation.error ?? updateMutation.error ?? deleteMutation.error)?.message ?? 'Unknown error' }
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
      doEdit={doEdit}
      doDelete={id === null ? null : doDelete}
      doCancel={doCancel}
      submitState={submitState}
      leases={leases}
      transactions={transactions}
      attachments={attachments}
      navLinkTo={navLinkTo}
    />
  );
};