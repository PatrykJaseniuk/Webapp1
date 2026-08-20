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
  type AsyncData,
  type NavLink,
  type NavLinkWithId,
} from '@/generic';

type TransactionRow = Database['public']['Tables']['transactions']['Row'];
type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];
type TransactionUpdate = Database['public']['Tables']['transactions']['Update'];

export const TRANSACTION_TYPES = ['rent', 'utility', 'expense', 'payment', 'withdraw', 'fee', 'other'] as const;
const INCOME_TYPES: readonly string[] = ['payment', 'other'];

export const transactionInsertSchema = z
  .object({
    type: z.enum(TRANSACTION_TYPES, { message: 'Nieprawidłowy typ transakcji' }),
    description: z.string().trim().min(1, 'Opis jest wymagany'),
    amount: z
      .number({ invalid_type_error: 'Kwota musi być liczbą' })
      .finite('Kwota musi być liczbą'),
    due_date: z.string().min(1, 'Termin płatności jest wymagany'),
    transaction_status: z.enum(['pending', 'paid', 'overdue'], {
      message: 'Nieprawidłowy status transakcji',
    }),
    lease_id: z.string().uuid('Nieprawidłowa umowa').nullable(),
    property_id: z.string().uuid('Nieprawidłowa nieruchomość').nullable(),
  })
  .refine((v) => v.lease_id !== null || v.property_id !== null, {
    message: 'Wybierz umowę lub nieruchomość',
    path: ['property_id'],
  })
  .refine((v) => !INCOME_TYPES.includes(v.type) || v.amount > 0, {
    message: 'Typ przychodowy wymaga kwoty dodatniej',
    path: ['amount'],
  })
  .refine((v) => INCOME_TYPES.includes(v.type) || v.amount < 0, {
    message: 'Typ kosztowy wymaga kwoty ujemnej',
    path: ['amount'],
  })
  .refine((v) => v.due_date.length === 0 || v.due_date >= '2020-01-01', {
    message: 'Termin płatności nie może być wcześniejszy niż 2020-01-01',
    path: ['due_date'],
  });

export type TransactionInsertInput = z.input<typeof transactionInsertSchema>;

const formatZodIssues = (error: z.ZodError): string =>
  error.issues.map((issue) => issue.message).join('; ');

const formatDeleteError = (error: Error | null): string =>
  error?.message ?? 'Wystąpił nieznany błąd';

type PropertyOption = { readonly id: string; readonly label: string };
type LeaseOption = { readonly id: string; readonly label: string; readonly propertyId: string };

export type TransactionFormOptions = Readonly<{
  readonly properties: readonly PropertyOption[];
  readonly leases: readonly LeaseOption[];
}>;

type TransactionData = Readonly<{
  readonly transaction: TransactionRow | null;
  readonly propertyName: string | null;
  readonly leaseDescription: string | null;
}>;

type NavLinkTo = Readonly<{
  readonly toProperty: NavLinkWithId;
  readonly toLease: NavLinkWithId;
  readonly toList: NavLink;
}>;

type SubmitState =
  | { readonly tag: 'idle' }
  | { readonly tag: 'submitting' }
  | { readonly tag: 'success' }
  | { readonly tag: 'error'; readonly message: string };

type TransactionDeleteAction =
  | { readonly tag: 'absent' }
  | { readonly tag: 'allowed'; readonly doDelete: () => void };

export type TransactionSProps = {
  readonly asyncData: AsyncData<TransactionData | null>;
  readonly formOptions: AsyncData<TransactionFormOptions>;
  readonly doSubmit: (newRecord: TransactionInsertInput) => void;
  readonly deleteAction: TransactionDeleteAction;
  readonly doCancel: () => void;
  readonly onEditStart: () => void;
  readonly submitState: SubmitState;
  readonly navLinkTo: NavLinkTo;
};

export type TransactionDetailMode =
  | { readonly tag: 'create' }
  | { readonly tag: 'edit'; readonly id: string };

type Props = {
  readonly Slave: ComponentType<TransactionSProps>;
  readonly mode: TransactionDetailMode;
};

const resolveDetail = async (txn: TransactionRow): Promise<TransactionData> => {
  const propertyName: string | null =
    txn.property_id !== null
      ? (await backendConnector
          .from('properties')
          .select('name')
          .eq('id', txn.property_id)
          .single()
        ).data?.name ?? null
      : null;

  const leaseDescription: string | null =
    txn.lease_id !== null
      ? (await backendConnector
          .from('lease_agreements')
          .select('id')
          .eq('id', txn.lease_id)
          .single()
        ).data !== null
        ? `Umowa ${txn.lease_id.slice(0, 8)}...`
        : null
      : null;

  return { transaction: txn, propertyName, leaseDescription };
};

const fetchTransactionData = async (id: string): Promise<TransactionData> => {
  const { data, error } = await backendConnector
    .from('transactions')
    .select('*')
    .eq('id', id)
    .single();
  return error !== null
    ? Promise.reject(error)
    : resolveDetail(data as TransactionRow);
};

const fetchFormOptions = async (): Promise<TransactionFormOptions> => {
  const [propertiesResult, leasesResult] = await Promise.all([
    backendConnector.from('properties').select('id, name').order('name'),
    backendConnector.from('lease_agreements').select('id, property_id, start_date, properties(name), tenants(first_name,last_name)').order('start_date', { ascending: false }),
  ]);
  const combinedError = propertiesResult.error ?? leasesResult.error;
  return combinedError !== null
    ? Promise.reject(combinedError)
    : {
        properties: (propertiesResult.data ?? []).map((p) => ({ id: p.id, label: p.name })),
        leases: (leasesResult.data ?? []).map((l) => {
          const propertyName = (l as { readonly properties?: { readonly name?: string } | null }).properties?.name ?? '';
          const tenant = (l as { readonly tenants?: { readonly first_name: string; readonly last_name: string } | null }).tenants;
          const tenantName = tenant !== null && tenant !== undefined ? `${tenant.first_name} ${tenant.last_name}`.trim() : '';
          const label = [propertyName, tenantName].filter((s) => s.length > 0).join(' — ');
          return { id: l.id, label: label.length > 0 ? label : `Umowa #${l.id.slice(0, 8)}`, propertyId: l.property_id };
        }),
      };
};

const insertTransaction = async (newRecord: TransactionInsert): Promise<string> => {
  const result = await backendConnector.from('transactions').insert(newRecord).select('id').single();
  return result.error !== null ? Promise.reject(result.error) : result.data.id;
};

const updateTransaction = async (id: string, newRecord: TransactionUpdate): Promise<void> => {
  const result = await backendConnector.from('transactions').update(newRecord).eq('id', id);
  return result.error !== null ? Promise.reject(result.error) : undefined;
};

const deleteTransaction = async (id: string): Promise<void> => {
  const result = await backendConnector.from('transactions').delete().eq('id', id);
  return result.error !== null ? Promise.reject(result.error) : undefined;
};

const leasePropertyMismatch = (
  leaseId: string | null,
  propertyId: string | null,
  options: TransactionFormOptions | null,
): string | null => {
  const lease = leaseId !== null ? (options?.leases ?? []).find((l) => l.id === leaseId) : undefined;
  return lease !== undefined && propertyId !== null && lease.propertyId !== propertyId
    ? 'Wybrana nieruchomość nie pasuje do wybranej umowy.'
    : null;
};

export const TransactionDetailM = ({ Slave, mode }: Props): JSX.Element => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [validationError, setValidationError] = useState<string | null>(null);

  const transactionId = match(mode)
    .with({ tag: 'create' }, () => null)
    .with({ tag: 'edit' }, ({ id }) => id)
    .exhaustive();

  const query = useQuery({
    queryKey: ['transaction', transactionId],
    queryFn: (): Promise<TransactionData> =>
      match(mode)
        .with({ tag: 'create' }, () => Promise.reject(new Error('Brak identyfikatora transakcji')))
        .with({ tag: 'edit' }, ({ id }) => fetchTransactionData(id))
        .exhaustive(),
    enabled: transactionId !== null,
  });

  const asyncData: AsyncData<TransactionData | null> = match(mode)
    .with({ tag: 'create' }, () => ({ tag: 'fulfilled' as const, data: null }))
    .with({ tag: 'edit' }, () => toAsyncData(query, () => { void query.refetch(); }))
    .exhaustive();

  const formOptionsQuery = useQuery({
    queryKey: ['transactionFormOptions'],
    queryFn: (): Promise<TransactionFormOptions> => fetchFormOptions(),
  });

  const formOptions = toAsyncData(formOptionsQuery, () => { void formOptionsQuery.refetch(); });

  const insertMutation = useMutation({
    mutationFn: (newRecord: TransactionInsert): Promise<string> => insertTransaction(newRecord),
    onSuccess: (newId) => {
      void queryClient.invalidateQueries({ queryKey: ['transactions'] });
      void navigate({ to: '/app/transactions/$id', params: { id: newId } });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, record }: { readonly id: string; readonly record: TransactionUpdate }): Promise<void> =>
      updateTransaction(id, record),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['transactions'] });
      void queryClient.invalidateQueries({ queryKey: ['transaction', transactionId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string): Promise<void> => deleteTransaction(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['transactions'] });
      void queryClient.invalidateQueries({ queryKey: ['transaction', transactionId] });
      void navigate({ to: '/app/transactions' });
    },
  });

  const doSubmit = (newRecord: TransactionInsertInput): void =>
    match(transactionInsertSchema.safeParse(newRecord))
      .with({ success: true }, ({ data }) => {
        const mismatch = leasePropertyMismatch(data.lease_id, data.property_id, formOptionsQuery.data ?? null);
        setValidationError(mismatch);
        match(mismatch)
          .with(null, () =>
            match(mode)
              .with({ tag: 'create' }, () => insertMutation.mutate(data))
              .with({ tag: 'edit' }, ({ id }) => updateMutation.mutate({ id, record: data }))
              .exhaustive(),
          )
          .otherwise(() => undefined);
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

  const deleteAction: TransactionDeleteAction = match(mode)
    .with({ tag: 'create' }, () => ({ tag: 'absent' as const }))
    .with({ tag: 'edit' }, ({ id }) => ({ tag: 'allowed' as const, doDelete: (): void => { deleteMutation.mutate(id); } }))
    .exhaustive();

  const doCancel = (): void => {
    void navigate({ to: '/app/transactions' });
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
    toProperty: ({ id: propertyId, content, style }) => <Link to="/app/properties/$id" params={{ id: propertyId }} style={style}>{content}</Link>,
    toLease: ({ id: leaseId, content, style }) => <Link to="/app/leases/$id" params={{ id: leaseId }} style={style}>{content}</Link>,
    toList: ({ content, style }) => <Link to="/app/transactions" style={style}>{content}</Link>,
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
      navLinkTo={navLinkTo}
    />
  );
};
