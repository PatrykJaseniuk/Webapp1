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
import { TENANT_STATUS_LABELS } from '@/constants/labels';

import styles from './ListPage.module.css';
import tableStyles from './tables/Tables.module.css';

const getStatusClass = (status: string) =>
    status === 'active' ? tableStyles.statusActive :
        status === 'past' ? tableStyles.statusTerminated :
            tableStyles.statusPending;

export const TenantsList = () => {
    const router = useRouter();
    const [refreshKey, setRefreshKey] = useState(0);
    const handleRefresh = () => setRefreshKey(prev => prev + 1);

    const state = useAsync(async () => {
        const { data, error } = await database
            .from('tenants')
            .select('*')
            .order('created_at', { ascending: false });
        return { data, error };
    }, [refreshKey]);

    const tenants = state.value?.data ?? [];

    const handleRowClick = (tenantId: string) => router.push(routes.landlord.tenants({ id: tenantId }));

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Najemcy</h1>
                <Link href={routes.landlord.tenants({ action: 'new' })} className={styles.addButton}>
                    Dodaj najemce
                </Link>
            </div>

            {state.error ? <ErrorBanner msg={state.error.message} retry={handleRefresh} /> :
                state.loading ? <Spinner /> :
                    state.value?.error ? <ErrorBanner msg={state.value.error.message} /> :
                        tenants.length === 0 ? (
                            <EmptyState
                                message="Brak najemcow"
                                actionLabel="Dodaj pierwszego najemce"
                                actionHref={routes.landlord.tenants({ action: 'new' })}
                            />
                        ) : (
                            <div className={tableStyles.section}>
                                <table className={tableStyles.table}>
                                    <thead>
                                        <tr>
                                            <th>Imie i nazwisko</th>
                                            <th>Email</th>
                                            <th>Telefon</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tenants.map(tenant => (
                                            <tr
                                                key={tenant.id}
                                                className={tableStyles.clickableRow}
                                                onClick={() => tenant.id && handleRowClick(tenant.id)}
                                            >
                                                <td>{tenant.first_name} {tenant.last_name}</td>
                                                <td>{tenant.email}</td>
                                                <td>{tenant.phone}</td>
                                                <td>
                                                    <span className={`${tableStyles.statusBadge} ${getStatusClass(tenant.status ?? '')}`}>
                                                        {TENANT_STATUS_LABELS[tenant.status ?? ''] ?? tenant.status}
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
