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

import styles from './PropertiesList.module.css';

const STATUS_LABELS: Record<string, string> = {
    available: 'Wolna',
    occupied: 'Zajęta',
    inactive: 'Nieaktywna',
};

const TYPE_LABELS: Record<string, string> = {
    apartment: 'Mieszkanie',
    house: 'Dom',
    commercial: 'Lokal użytkowy',
    room: 'Pokój',
};

export const PropertiesList = () => {
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

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Nieruchomości</h1>
                <Link href={routes.landlord.properties({ action: 'new' })} className={styles.addButton}>
                    Dodaj nieruchomość
                </Link>
            </div>

            {state.error ? <ErrorBanner msg={state.error.message} retry={handleRefresh} /> :
                state.loading ? <Spinner /> :
                    state.value?.error ? <ErrorBanner msg={state.value.error.message} /> :
                        properties.length === 0 ? (
                            <EmptyState
                                message="Brak nieruchomości"
                                actionLabel="Dodaj pierwszą nieruchomość"
                                actionHref={routes.landlord.properties({ action: 'new' })}
                            />
                        ) : (
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Nazwa</th>
                                        <th>Adres</th>
                                        <th>Typ</th>
                                        <th>Status</th>
                                        <th>Czynsz</th>
                                        <th>Akcje</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {properties.map(property => (
                                        <tr key={property.id}>
                                            <td>
                                                <Link className={styles.tableLink} href={routes.landlord.properties({ id: property.id })}>
                                                    {property.name}
                                                </Link>
                                            </td>
                                            <td>{property.address}</td>
                                            <td>{TYPE_LABELS[property.property_type] ?? property.property_type}</td>
                                            <td>
                                                <span className={`${styles.status} ${styles[`status${property.status.charAt(0).toUpperCase() + property.status.slice(1)}`]}`}>
                                                    {STATUS_LABELS[property.status] ?? property.status}
                                                </span>
                                            </td>
                                            <td className={styles.amount}>{formatCurrency(property.monthly_rent)}</td>
                                            <td className={styles.actions}>
                                                <Link className={styles.actionLink} href={routes.landlord.properties({ action: 'edit', id: property.id })}>
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
