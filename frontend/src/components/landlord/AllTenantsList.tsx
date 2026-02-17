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
import { TenantsList } from '@/components/landlord/lists/TenantsList';

import styles from './ListPage.module.css';

export const AllTenantsList = () => {
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
                            <TenantsList tenants={tenants} onRowClick={handleRowClick} />
                        )}
        </div>
    );
};
