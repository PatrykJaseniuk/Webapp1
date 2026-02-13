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
import { METER_TYPE_LABELS } from '@/constants/labels';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';

import styles from './ListPage.module.css';
import tableStyles from './tables/Tables.module.css';

export const UtilityPricesList = () => {
    const router = useRouter();
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

    const handleRowClick = (priceId: string) => router.push(routes.landlord.utilityPrices({ id: priceId }));

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Ceny mediow</h1>
                <Link href={routes.landlord.utilityPrices({ action: 'new' })} className={styles.addButton}>
                    Dodaj cene
                </Link>
            </div>

            {state.error ? <ErrorBanner msg={state.error.message} retry={handleRefresh} /> :
                state.loading ? <Spinner /> :
                    state.value?.error ? <ErrorBanner msg={state.value.error.message} /> :
                        prices.length === 0 ? (
                            <EmptyState
                                message="Brak zdefiniowanych cen mediow"
                                actionLabel="Dodaj pierwsza cene"
                                actionHref={routes.landlord.utilityPrices({ action: 'new' })}
                            />
                        ) : (
                            <div className={tableStyles.section}>
                                <table className={tableStyles.table}>
                                    <thead>
                                        <tr>
                                            <th>Typ</th>
                                            <th>Cena za jednostke</th>
                                            <th>Data obowiazywania</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {prices.map(price => (
                                            <tr
                                                key={price.id}
                                                className={tableStyles.clickableRow}
                                                onClick={() => price.id && handleRowClick(price.id)}
                                            >
                                                <td>{METER_TYPE_LABELS[price.utility_type ?? ''] ?? price.utility_type}</td>
                                                <td>{formatCurrency(price.price_per_unit)}</td>
                                                <td>{price.effective_date ? formatDate(price.effective_date) : '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
        </div>
    );
};
