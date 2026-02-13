'use client';

import { useState } from 'react';
import { useAsync } from 'react-use';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { routes } from '@/routes';
import { database } from '@/api/database';
import { Spinner } from '@/components/shared/Spinner';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { EmptyState } from '@/components/shared/EmptyState';
import { LEASE_STATUS_LABELS } from '@/constants/labels';
import { formatCurrency } from '@/utils/formatCurrency';

import styles from './ListPage.module.css';
import tableStyles from './tables/Tables.module.css';

const getStatusClass = (status: string) =>
    status === 'active' ? tableStyles.statusActive :
        status === 'expired' ? tableStyles.statusExpired :
            tableStyles.statusTerminated;

export const LeasesList = () => {
    const router = useRouter();
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

    const handleRowClick = (leaseId: string) => router.push(routes.landlord.leases({ id: leaseId }));

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Umowy najmu</h1>
                <Link href={routes.landlord.leases({ action: 'new' })} className={styles.addButton}>
                    Dodaj umowe
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
                    <option value="expired">Wygasle</option>
                    <option value="terminated">Rozwiazane</option>
                </select>
            </div>

            {state.error ? <ErrorBanner msg={state.error.message} retry={handleRefresh} /> :
                state.loading ? <Spinner /> :
                    state.value?.error ? <ErrorBanner msg={state.value.error.message} /> :
                        leases.length === 0 ? (
                            <EmptyState
                                message="Brak umow najmu"
                                actionLabel="Dodaj pierwsza umowe"
                                actionHref={routes.landlord.leases({ action: 'new' })}
                            />
                        ) : (
                            <div className={tableStyles.section}>
                                <table className={tableStyles.table}>
                                    <thead>
                                        <tr>
                                            <th>Nieruchomosc</th>
                                            <th>Najemca</th>
                                            <th>Okres</th>
                                            <th>Czynsz</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leases.map(lease => (
                                            <tr
                                                key={lease.id}
                                                className={tableStyles.clickableRow}
                                                onClick={() => handleRowClick(lease.id)}
                                            >
                                                <td>{(lease as any).properties?.name ?? lease.property_id}</td>
                                                <td>
                                                    {(lease as any).tenants
                                                        ? `${(lease as any).tenants.first_name} ${(lease as any).tenants.last_name}`
                                                        : lease.tenant_id}
                                                </td>
                                                <td>{lease.start_date} — {lease.end_date ?? 'Bezterminowa'}</td>
                                                <td>{formatCurrency(lease.monthly_rent)}</td>
                                                <td>
                                                    <span className={`${tableStyles.statusBadge} ${getStatusClass(lease.status)}`}>
                                                        {LEASE_STATUS_LABELS[lease.status] ?? lease.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
        </div>
    );
};
