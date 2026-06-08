import { useAsync } from 'react-use';
import { useAuth } from '@/volatile1/auth';
import { backendConnector } from '@/volatile0/infra/backendConnector';
import { match } from 'ts-pattern';

// ── Sub-components for clean single-return ──

const LoadingSpinner = (): JSX.Element => (
  <div className="flex items-center justify-center py-16">
    <p className="text-gray-400">Ładowanie...</p>
  </div>
);

type TenantDashboardContentProps = {
  readonly tenant: {
    readonly first_name: string;
    readonly last_name: string;
  } | null;
  readonly lease: {
    readonly start_date: string;
    readonly end_date: string | null;
    readonly monthly_rent: number;
    readonly lease_status: string;
    readonly property: ReadonlyArray<{ readonly name: string }> | { readonly name: string } | null;
  } | null;
};

const TenantDashboardContent = ({
  tenant,
  lease,
}: TenantDashboardContentProps): JSX.Element => (
  <div className="mx-auto max-w-2xl py-8">
    <h1 className="mb-6 text-2xl font-bold text-gray-900">Panel Najemcy</h1>

    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm mb-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-2">Twoje dane</h2>
      {tenant !== null ?
        (
          <p className="text-gray-600">
            {tenant.first_name} {tenant.last_name}
          </p>
        ) :
        (
          <p className="text-gray-400">Brak przypisanego profilu najemcy.</p>
        )}
    </div>

    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-800 mb-2">Aktywna umowa</h2>
      {lease !== null ?
        (
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <span className="font-medium">Nieruchomość:</span>{' '}
              {Array.isArray(lease.property) ?
                lease.property[0]?.name :
                lease.property !== null && typeof lease.property === 'object' ?
                  (lease.property as { name: string }).name :
                  '—'}
            </p>
            <p>
              <span className="font-medium">Okres:</span>{' '}
              {lease.start_date} – {lease.end_date ?? 'bezterminowo'}
            </p>
            <p>
              <span className="font-medium">Czynsz:</span>{' '}
              {lease.monthly_rent} zł/mies.
            </p>
            <p>
              <span className="font-medium">Status:</span>{' '}
              {lease.lease_status === 'active' ? 'Aktywna' : lease.lease_status}
            </p>
          </div>
        ) :
        (
          <p className="text-gray-400">Brak aktywnej umowy.</p>
        )}
    </div>
  </div>
);

// ── Main component ──

export const TenantDashboardPage = (): JSX.Element => {
  const authState = useAuth();

  const userId: string | null = match(authState)
    .with({ tag: 'authenticated' }, ({ userId: id }) => id)
    .otherwise(() => null);

  const tenantState = useAsync(
    async () =>
      userId !== null
        ? backendConnector
          .from('tenants')
          .select('id, first_name, last_name')
          .eq('user_id', userId)
          .maybeSingle()
        : { data: null, error: null },
    [userId],
  );

  const leaseState = useAsync(
    async () =>
      tenantState.value?.data?.id !== undefined &&
        tenantState.value?.data?.id !== null
        ? backendConnector
          .from('lease_agreements')
          .select(
            'id, start_date, end_date, monthly_rent, lease_status, property:properties(name, address)',
          )
          .eq('tenant_id', tenantState.value.data.id)
          .eq('lease_status', 'active')
          .maybeSingle()
        : { data: null, error: null },
    [tenantState.value?.data?.id],
  );

  return tenantState.loading ?
    <LoadingSpinner /> :
    (
      <TenantDashboardContent
        tenant={tenantState.value?.data ?? null}
        lease={leaseState.value?.data ?? null}
      />
    );
};