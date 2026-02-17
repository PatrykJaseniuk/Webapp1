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
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';

import styles from './ListPage.module.css';
import tableStyles from './tables/Tables.module.css';

export const TransactionList = () => {
    const router = useRouter();
    const [refreshKey, setRefreshKey] = useState(0);
    const handleRefresh = () => setRefreshKey(prev => prev + 1);

    const state = useAsync(async () => {
        const { data, error } = await database
            .from('transactions')
            .select('*')
            .eq('status', 'paid')
            .order('due_date', { ascending: false });
        return { data, error };
    }, [refreshKey]);

    const payments = state.value?.data ?? [];

    const handleRowClick = (paymentId: string) => router.push(routes.landlord.payments({ id: paymentId }));

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Transakcje</h1>
                <Link href={routes.landlord.payments({ action: 'new' })} className={styles.addButton}>
                    Zarejestruj transakcje
                </Link>
            </div>

            {state.error ? <ErrorBanner msg={state.error.message} retry={handleRefresh} /> :
                state.loading ? <Spinner /> :
                    state.value?.error ? <ErrorBanner msg={state.value.error.message} /> :
                        payments.length === 0 ? (
                            <EmptyState
                                message="Brak zarejestrowanych transakcji"
                                actionLabel="Zarejestruj pierwsza transakcje"
                                actionHref={routes.landlord.payments({ action: 'new' })}
                            />
                        ) : (
                            <div className={tableStyles.section}>
                                <table className={tableStyles.table}>
                                    <thead>
                                        <tr>
                                            <th>Data</th>
                                            <th>Kwota</th>
                                            <th>Opis</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.map(payment => (
                                            <tr
                                                key={payment.id}
                                                className={tableStyles.clickableRow}
                                                onClick={() => handleRowClick(payment.id)}
                                            >
                                                <td>{formatDate(payment.due_date)}</td>
                                                <td className={tableStyles.positive}>{formatCurrency(payment.amount)}</td>
                                                <td>{payment.description ?? '—'}</td>
                                                <td>Opłacone</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
            }
        </div>
    );
};
