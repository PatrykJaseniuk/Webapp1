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
import { TransactionsList } from '@/components/landlord/lists/TransactionsList';

import styles from './ListPage.module.css';

export const AllTransactionsList = () => {
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

    const transactions = state.value?.data ?? [];

    const handleRowClick = (transactionId: string) => router.push(routes.landlord.payments({ id: transactionId }));

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
                        transactions.length === 0 ? (
                            <EmptyState
                                message="Brak zarejestrowanych transakcji"
                                actionLabel="Zarejestruj pierwsza transakcje"
                                actionHref={routes.landlord.payments({ action: 'new' })}
                            />
                        ) : (
                            <TransactionsList transactions={transactions} onRowClick={handleRowClick} />
                        )}
        </div>
    );
};
