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
import { PROPERTY_STATUS_LABELS, PROPERTY_TYPE_LABELS } from '@/constants/labels';
import { formatCurrency } from '@/utils/formatCurrency';

import styles from './ListPage.module.css';
import { PropertiesList } from './lists/PropertiesList';

export const AllPropertiesList = () => {
    const router = useRouter();
    const [refreshKey, setRefreshKey] = useState(0);
    const handleRefresh = () => setRefreshKey(prev => prev + 1);

    const state = useAsync(async () => {
        const response = await database
            .from('properties')
            .select('*')
            .order('created_at', { ascending: false });
        return response;
    }, [refreshKey]);

    const properties = state.value?.data ?? [];

    const handleRowClick = (propertyId: string) => router.push(routes.landlord.properties({ id: propertyId }));

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Nieruchomosci</h1>
                <Link href={routes.landlord.properties({ action: 'new' })} className={styles.addButton}>
                    Dodaj nieruchomosc
                </Link>
            </div>

            {state.error ? <ErrorBanner msg={state.error.message} retry={handleRefresh} /> :
                state.loading ? <Spinner /> :
                    state.value?.error ? <ErrorBanner msg={state.value.error.message} /> :
                        properties.length === 0 ? (
                            <EmptyState
                                message="Brak nieruchomosci"
                                actionLabel="Dodaj pierwsza nieruchomosc"
                                actionHref={routes.landlord.properties({ action: 'new' })}
                            />
                        ) : (
                            <PropertiesList properties={properties} onRowClick={handleRowClick} />
                        )}
        </div>
    );
};
