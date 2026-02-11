'use client';

import { useState } from 'react';
import { useAsync } from 'react-use';
import Link from 'next/link';

import { database } from '@/api/database';
import { Spinner } from '@/components/shared/Spinner';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatCurrency } from '@/utils/formatCurrency';

import styles from './LeasesList.module.css';

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
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Umowy najmu</h1>
                <Link href="/landlord/leases?action=new" className={styles.addButton}>
                    Dodaj umowę
                </Link>
            </div>

            <div className={styles.header}>
                <label htmlFor="filterStatus" className={styles.propertyName}>Filtruj wg statusu: </label>
                <select
                    id="filterStatus"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className={styles.propertyName}
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
                                actionHref="/landlord/leases?action=new"
                            />
                        ) : (
                            <table className={styles.table}>
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
                                            <td className={styles.propertyName}>
                                                <Link href={`/landlord/leases?id=${lease.id}`}>
                                                    {(lease as any).properties?.name ?? lease.property_id}
                                                </Link>
                                            </td>
                                            <td className={styles.tenantName}>
                                                {(lease as any).tenants
                                                    ? `${(lease as any).tenants.first_name} ${(lease as any).tenants.last_name}`
                                                    : lease.tenant_id}
                                            </td>
                                            <td className={styles.dateRange}>{lease.start_date} — {lease.end_date ?? 'Bezterminowa'}</td>
                                            <td className={styles.rentAmount}>{formatCurrency(lease.monthly_rent)}</td>
                                            <td>
                                                <span className={`${styles.status} ${lease.status === 'active' ? styles.statusActive :
                                                        lease.status === 'expired' ? styles.statusExpired :
                                                            styles.statusDraft
                                                    }`}>
                                                    {STATUS_LABELS[lease.status] ?? lease.status}
                                                </span>
                                            </td>
                                            <td className={styles.actions}>
                                                <Link href={`/landlord/leases?action=edit&id=${lease.id}`} className={styles.actionLink}>
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
