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
import tableStyles from './tables/Tables.module.css';

const getStatusClass = (status: string) =>
    status === 'available' ? tableStyles.statusActive :
        status === 'occupied' ? tableStyles.statusPending :
            tableStyles.statusTerminated;

export const PropertiesList = () => {
    const router = useRouter();
    const [refreshKey, setRefreshKey] = useState(0);
    const handleRefresh = () => setRefreshKey(prev => prev + 1);

    const state = useAsync(async () => {
        const { data, error } = await database
            .from('properties')
            .select('*')
            .order('created_at', { ascending: false });
        return { data, error };
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
                            <div className={tableStyles.section}>
                                <table className={tableStyles.table}>
                                    <thead>
                                        <tr>
                                            <th>Nazwa</th>
                                            <th>Adres</th>
                                            <th>Typ</th>
                                            <th>Status</th>
                                            <th>Czynsz</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {properties.map(property => (
                                            <tr
                                                key={property.id}
                                                className={tableStyles.clickableRow}
                                                onClick={() => property.id && handleRowClick(property.id)}
                                            >
                                                <td>{property.name}</td>
                                                <td>{property.address}</td>
                                                <td>{PROPERTY_TYPE_LABELS[property.property_type ?? ''] ?? property.property_type}</td>
                                                <td>
                                                    <span className={`${tableStyles.statusBadge} ${getStatusClass(property.status ?? '')}`}>
                                                        {PROPERTY_STATUS_LABELS[property.status ?? ''] ?? property.status}
                                                    </span>
                                                </td>
                                                <td>{formatCurrency(property.monthly_rent)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
        </div>
    );
};
