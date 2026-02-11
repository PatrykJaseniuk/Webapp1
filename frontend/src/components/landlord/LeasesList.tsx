'use client';

import { useState } from 'react';
import { useAsync } from 'react-use';
import Link from 'next/link';

import { routes } from '@/routes';
import { database } from '@/api/database';
import { Spinner } from '@/components/shared/Spinner';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatCurrency } from '@/utils/formatCurrency';

const STATUS_LABELS: Record<string, string> = {
    active: 'Aktywna',
    expired: 'Wygasła',
    terminated: 'Rozwiązana',
};

export const LeasesList = () => {
    const [refreshKey, setRefreshKey] = useState(0);
    const [filterStatus, setFilterStatus] = useState('');
    const handleRefresh = () => setRefreshKey(prev => prev + 1);

    const state = useAsync(async () => {
        const query = database
            .from('lease_agreements')
            .select('*, tenants(first_name, last_name), properties(name)')
            .order('start_date', { ascending: false });

        const { data, error } = filterStatus
            ? await query.eq('status', filterStatus)
            : await query;

        return { data, error };
    }, [refreshKey, filterStatus]);

    const leases = state.value?.data ?? [];

    return (
        <div>
            <div>
                <h1>Umowy najmu</h1>
                <Link href={routes.landlord.leases({ action: 'new' })}>
                    <button>Dodaj umowę</button>
                </Link>
            </div>

            <div>
                <label htmlFor="filterStatus">Filtruj wg statusu: </label>
                <select
                    id="filterStatus"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                >
                    <option value="">Wszystkie</option>
                    <option value="active">Aktywne</option>
                    <option value="expired">Wygasłe</option>
                    <option value="terminated">Rozwiązane</option>
                </select>
            </div>

            {state.error ? <ErrorBanner msg={state.error.message} retry={handleRefresh} /> :
                state.loading ? <Spinner /> :
                    state.value?.error ? <ErrorBanner msg={state.value.error.message} /> :
                        leases.length === 0 ? (
                            <EmptyState
                                message="Brak umów najmu"
                                actionLabel="Dodaj pierwszą umowę"
                                actionHref={routes.landlord.leases({ action: 'new' })}
                            />
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Nieruchomość</th>
                                        <th>Najemca</th>
                                        <th>Okres</th>
                                        <th>Czynsz</th>
                                        <th>Status</th>
                                        <th>Akcje</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leases.map(lease => (
                                        <tr key={lease.id}>
                                            <td>
                                                <Link href={routes.landlord.leases({ id: lease.id })}>
                                                    {(lease as any).properties?.name ?? lease.property_id}
                                                </Link>
                                            </td>
                                            <td>
                                                {(lease as any).tenants
                                                    ? `${(lease as any).tenants.first_name} ${(lease as any).tenants.last_name}`
                                                    : lease.tenant_id}
                                            </td>
                                            <td>{lease.start_date} — {lease.end_date ?? 'Bezterminowa'}</td>
                                            <td>{formatCurrency(lease.monthly_rent)}</td>
                                            <td>{STATUS_LABELS[lease.status] ?? lease.status}</td>
                                            <td>
                                                <Link href={routes.landlord.leases({ action: 'edit', id: lease.id })}>
                                                    Edytuj
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
        </div>
    );
};
