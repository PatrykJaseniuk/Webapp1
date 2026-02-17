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
import { LeasesList } from '@/components/landlord/lists/LeasesList';

import styles from './ListPage.module.css';

export const AllLeasesList = () => {
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
                            <LeasesList leases={leases} onRowClick={handleRowClick} />
                        )}
        </div>
    );
};
