'use client';

import { useState } from 'react';
import { useAsync } from 'react-use';
import Link from 'next/link';

import { routes } from '@/routes';
import { database } from '@/api/database';
import { Spinner } from '@/components/shared/Spinner';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDate } from '@/utils/formatDate';

import styles from './UtilityPricesList.module.css';

const TYPE_LABELS: Record<string, string> = {
    electricity: 'Prąd',
    water: 'Woda',
    gas: 'Gaz',
    heating: 'Ogrzewanie',
};

export const UtilityPricesList = () => {
    const [refreshKey, setRefreshKey] = useState(0);
    const handleRefresh = () => setRefreshKey(prev => prev + 1);

    const state = useAsync(async () => {
        const { data, error } = await database
            .from('utility_prices')
            .select('*')
            .order('effective_date', { ascending: false });
        return { data, error };
    }, [refreshKey]);

    const prices = state.value?.data ?? [];

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Ceny mediów</h1>
                <Link href={routes.landlord.utilityPrices({ action: 'new' })} className={styles.addButton}>
                    Dodaj cenę
                </Link>
            </div>

            {state.error ? <ErrorBanner msg={state.error.message} retry={handleRefresh} /> :
                state.loading ? <Spinner /> :
                    state.value?.error ? <ErrorBanner msg={state.value.error.message} /> :
                        prices.length === 0 ? (
                            <EmptyState
                                message="Brak zdefiniowanych cen mediów"
                                actionLabel="Dodaj pierwszą cenę"
                                actionHref={routes.landlord.utilityPrices({ action: 'new' })}
                            />
                        ) : (
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Typ</th>
                                        <th>Cena za jednostkę</th>
                                        <th>Data obowiązywania</th>
                                        <th>Akcje</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {prices.map(price => (
                                        <tr key={price.id}>
                                            <td className={styles.utilityType}>
                                                {TYPE_LABELS[price.utility_type] ?? price.utility_type}
                                            </td>
                                            <td className={styles.priceAmount}>
                                                {price.price_per_unit} PLN
                                            </td>
                                            <td className={styles.dateRange}>
                                                {formatDate(price.effective_date)}
                                            </td>
                                            <td className={styles.actions}>
                                                <Link
                                                    href={routes.landlord.utilityPrices({ action: 'edit', id: price.id })}
                                                    className={`${styles.actionButton} ${styles.editButton}`}
                                                >
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