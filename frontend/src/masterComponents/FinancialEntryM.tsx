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

type FinancialEntryRow = Database['public']['Tables']['financial_entry']['Row'];
type FinancialEntryInsert = Database['public']['Tables']['financial_entry']['Insert'];
type FinancialEntryUpdate = Database['public']['Tables']['financial_entry']['Update'];

export const financialEntryInsertSchema = z
  .object({
    description: z.string().trim().min(1, 'Opis jest wymagany'),
    amount: z
      .number({ invalid_type_error: 'Kwota musi być liczbą' })
      .finite('Kwota musi być liczbą')
      .refine((v) => v !== 0, { message: 'Kwota nie może być zerowa' }),
    value_date: z.string().min(1, 'Data jest wymagana'),
    lease_id: z.string().uuid('Nieprawidłowa umowa').nullable(),
    property_id: z.string().uuid('Nieprawidłowa nieruchomość').nullable(),
    treasury_id: z.string().uuid('Nieprawidłowy skarbiec').nullable(),
  })
  .refine(
    (v) => v.lease_id !== null || v.property_id !== null || v.treasury_id !== null,
    {
      message: 'Wybierz umowę, nieruchomość lub skarbiec',
      path: ['treasury_id'],
    },
  )
  .refine((v) => v.value_date.length === 0 || v.value_date >= '2020-01-01', {
    message: 'Data nie może być wcześniejsza niż 2020-01-01',
    path: ['value_date'],
  })
  .refine((v) => v.value_date.length === 0 || v.value_date < '2100-01-01', {
    message: 'Data nie może być późniejsza niż 2099-12-31',
    path: ['value_date'],
  });

export type FinancialEntryInsertInput = z.input<typeof financialEntryInsertSchema>;

const formatZodIssues = (error: z.ZodError): string =>
  error.issues.map((issue) => issue.message).join('; ');

const formatDeleteError = (error: Error | null): string =>
  error?.message ?? 'Wystąpił nieznany błąd';

type PropertyOption = { readonly id: string; readonly label: string };
type LeaseOption = { readonly id: string; readonly label: string; readonly propertyId: string };
type TreasuryOption = { readonly id: string; readonly label: string };

export type FinancialEntryFormOptions = Readonly<{
  readonly properties: readonly PropertyOption[];
  readonly leases: readonly LeaseOption[];
  readonly treasuries: readonly TreasuryOption[];
}>;

type FinancialEntryData = Readonly<{
  readonly financialEntry: FinancialEntryRow | null;
  readonly propertyName: string | null;
  readonly leaseDescription: string | null;
  readonly treasuryName: string | null;
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

type FinancialEntryDeleteAction =
  | { readonly tag: 'absent' }
  | { readonly tag: 'allowed'; readonly doDelete: () => void };

export type FinancialEntrySProps = {
  readonly asyncData: AsyncData<FinancialEntryData | null>;
  readonly formOptions: AsyncData<FinancialEntryFormOptions>;
  readonly doSubmit: (newRecord: FinancialEntryInsertInput) => void;
  readonly deleteAction: FinancialEntryDeleteAction;
  readonly doCancel: () => void;
  readonly onEditStart: () => void;
  readonly submitState: SubmitState;
  readonly navLinkTo: NavLinkTo;
};

export type FinancialEntryDetailMode =
  | { readonly tag: 'create' }
  | { readonly tag: 'edit'; readonly id: string };

type Props = {
  readonly Slave: ComponentType<FinancialEntrySProps>;
  readonly mode: FinancialEntryDetailMode;
};

const resolveDetail = async (txn: FinancialEntryRow): Promise<FinancialEntryData> => {
  const propertyName: string | null =
    txn.property_id !== null
      ? (await backendConnector
          .from('property')
          .select('name')
          .eq('id', txn.property_id)
          .single()
        ).data?.name ?? null
      : null;

  const leaseDescription: string | null =
    txn.lease_id !== null
      ? (await backendConnector
          .from('lease_agreement')
          .select('id')
          .eq('id', txn.lease_id)
          .single()
        ).data !== null
        ? `Umowa ${txn.lease_id.slice(0, 8)}...`
        : null
      : null;

  const treasuryName: string | null =
    txn.treasury_id !== null
      ? (await backendConnector
          .from('treasury')
          .select('name')
          .eq('id', txn.treasury_id)
          .single()
        ).data?.name ?? null
      : null;

  return { financialEntry: txn, propertyName, leaseDescription, treasuryName };
};

const fetchFinancialEntryData = async (id: string): Promise<FinancialEntryData> => {
  const { data, error } = await backendConnector
    .from('financial_entry')
    .select('*')
    .eq('id', id)
    .single();
  return error !== null
    ? Promise.reject(error)
    : resolveDetail(data as FinancialEntryRow);
};

const fetchFormOptions = async (): Promise<FinancialEntryFormOptions> => {
  const [propertiesResult, leasesResult, treasuriesResult] = await Promise.all([
    backendConnector.from('property').select('id, name').order('name'),
    backendConnector.from('lease_agreement').select('id, property_id, start_date, property(name), tenant(first_name,last_name)').order('start_date', { ascending: false }),
    backendConnector.from('treasury').select('id, name').eq('is_active', true).order('name'),
  ]);
  const combinedError = propertiesResult.error ?? leasesResult.error ?? treasuriesResult.error;
  return combinedError !== null
    ? Promise.reject(combinedError)
    : {
        properties: (propertiesResult.data ?? []).map((p) => ({ id: p.id, label: p.name })),
        treasuries: (treasuriesResult.data ?? []).map((t) => ({ id: t.id, label: t.name })),
        leases: (leasesResult.data ?? []).map((l) => {
          const propertyName = (l as { readonly property?: { readonly name?: string } | null }).property?.name ?? '';
          const tenant = (l as { readonly tenant?: { readonly first_name: string; readonly last_name: string } | null }).tenant;
          const tenantName = tenant !== null && tenant !== undefined ? `${tenant.first_name} ${tenant.last_name}`.trim() : '';
          const label = [propertyName, tenantName].filter((s) => s.length > 0).join(' — ');
          return { id: l.id, label: label.length > 0 ? label : `Umowa #${l.id.slice(0, 8)}`, propertyId: l.property_id };
        }),
      };
};

const insertFinancialEntry = async (newRecord: FinancialEntryInsert): Promise<string> => {
  const result = await backendConnector.from('financial_entry').insert(newRecord).select('id').single();
  return result.error !== null ? Promise.reject(result.error) : result.data.id;
};

const updateFinancialEntry = async (id: string, newRecord: FinancialEntryUpdate): Promise<void> => {
  const result = await backendConnector.from('financial_entry').update(newRecord).eq('id', id);
  return result.error !== null ? Promise.reject(result.error) : undefined;
};

const deleteFinancialEntry = async (id: string): Promise<void> => {
  const result = await backendConnector.from('financial_entry').delete().eq('id', id);
  return result.error !== null ? Promise.reject(result.error) : undefined;
};

const leasePropertyMismatch = (
  leaseId: string | null,
  propertyId: string | null,
  options: FinancialEntryFormOptions | null,
): string | null => {
  const lease = leaseId !== null ? (options?.leases ?? []).find((l) => l.id === leaseId) : undefined;
  return lease !== undefined && propertyId !== null && lease.propertyId !== propertyId
    ? 'Wybrana nieruchomość nie pasuje do wybranej umowy.'
    : null;
};

export const FinancialEntryDetailM = ({ Slave, mode }: Props): JSX.Element => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [validationError, setValidationError] = useState<string | null>(null);

  const entryId = match(mode)
    .with({ tag: 'create' }, () => null)
    .with({ tag: 'edit' }, ({ id }) => id)
    .exhaustive();

  const query = useQuery({
    queryKey: ['financialEntry', entryId],
    queryFn: (): Promise<FinancialEntryData> =>
      match(mode)
        .with({ tag: 'create' }, () => Promise.reject(new Error('Brak identyfikatora zapisu finansowego')))
        .with({ tag: 'edit' }, ({ id }) => fetchFinancialEntryData(id))
        .exhaustive(),
    enabled: entryId !== null,
  });

  const asyncData: AsyncData<FinancialEntryData | null> = match(mode)
    .with({ tag: 'create' }, () => ({ tag: 'fulfilled' as const, data: null }))
    .with({ tag: 'edit' }, () => toAsyncData(query, () => { void query.refetch(); }))
    .exhaustive();

  const formOptionsQuery = useQuery({
    queryKey: ['financialEntryFormOptions'],
    queryFn: (): Promise<FinancialEntryFormOptions> => fetchFormOptions(),
  });

  const formOptions = toAsyncData(formOptionsQuery, () => { void formOptionsQuery.refetch(); });

  const insertMutation = useMutation({
    mutationFn: (newRecord: FinancialEntryInsert): Promise<string> => insertFinancialEntry(newRecord),
    onSuccess: (newId) => {
      void queryClient.invalidateQueries({ queryKey: ['financialEntries'] });
      void navigate({ to: '/app/financial-entries/$id', params: { id: newId } });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, record }: { readonly id: string; readonly record: FinancialEntryUpdate }): Promise<void> =>
      updateFinancialEntry(id, record),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['financialEntries'] });
      void queryClient.invalidateQueries({ queryKey: ['financialEntry', entryId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string): Promise<void> => deleteFinancialEntry(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['financialEntries'] });
      void queryClient.invalidateQueries({ queryKey: ['financialEntry', entryId] });
      void navigate({ to: '/app/financial-entries' });
    },
  });

  const doSubmit = (newRecord: FinancialEntryInsertInput): void =>
    match(financialEntryInsertSchema.safeParse(newRecord))
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

  const deleteAction: FinancialEntryDeleteAction = match(mode)
    .with({ tag: 'create' }, () => ({ tag: 'absent' as const }))
    .with({ tag: 'edit' }, ({ id }) => ({ tag: 'allowed' as const, doDelete: (): void => { deleteMutation.mutate(id); } }))
    .exhaustive();

  const doCancel = (): void => {
    void navigate({ to: '/app/financial-entries' });
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
    toList: ({ content, style }) => <Link to="/app/financial-entries" style={style}>{content}</Link>,
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
