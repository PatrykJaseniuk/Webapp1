'use client';

import { useState } from 'react';
import { useAsync } from 'react-use';
import Link from 'next/link';

import { routes } from '@/routes';
import { database } from '@/api/database';
import { Spinner } from '@/components/shared/Spinner';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { EmptyState } from '@/components/shared/EmptyState';

import styles from './ListPage.module.css';

const STATUS_LABELS: Record<string, string> = {
    active: 'Aktywny',
    past: 'Były',
    applicant: 'Kandydat',
};

export const TenantsList = () => {
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

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Najemcy</h1>
                <Link href={routes.landlord.tenants({ action: 'new' })} className={styles.addButton}>
                    Dodaj najemcę
                </Link>
            </div>

            {state.error ? <ErrorBanner msg={state.error.message} retry={handleRefresh} /> :
                state.loading ? <Spinner /> :
                    state.value?.error ? <ErrorBanner msg={state.value.error.message} /> :
                        tenants.length === 0 ? (
                            <EmptyState
                                message="Brak najemców"
                                actionLabel="Dodaj pierwszego najemcę"
                                actionHref={routes.landlord.tenants({ action: 'new' })}
                            />
                        ) : (
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Imię i nazwisko</th>
                                        <th>Email</th>
                                        <th>Telefon</th>
                                        <th>Status</th>
                                        <th>Akcje</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tenants.map(tenant => (
                                        <tr key={tenant.id}>
                                            <td className={styles.name}>
                                                <Link href={routes.landlord.tenants({ id: tenant.id })}>
                                                    {tenant.first_name} {tenant.last_name}
                                                </Link>
                                            </td>
                                            <td className={styles.email}>{tenant.email}</td>
                                            <td className={styles.phone}>{tenant.phone}</td>
                                            <td>
                                                <span className={`${styles.status} ${tenant.status === 'active' ? styles.statusActive : styles.statusInactive}`}>
                                                    {STATUS_LABELS[tenant.status] ?? tenant.status}
                                                </span>
                                            </td>
                                            <td className={styles.actions}>
                                                <Link href={routes.landlord.tenants({ action: 'edit', id: tenant.id })} className={styles.actionLink}>
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