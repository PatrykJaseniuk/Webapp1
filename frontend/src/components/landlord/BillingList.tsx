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

const getStatusClass = (status: string) =>
    status === 'paid' ? tableStyles.statusActive :
        status === 'overdue' ? tableStyles.statusTerminated :
            tableStyles.statusPending;

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
    rent: 'Czynsz',
    utility: 'Media',
    deposit: 'Kaucja',
    fee: 'Opłata',
    other: 'Inne',
};

export const BillingList = () => {
    const router = useRouter();
    const [refreshKey, setRefreshKey] = useState(0);
    const [filterStatus, setFilterStatus] = useState('');
    const handleRefresh = () => setRefreshKey(prev => prev + 1);

    const state = useAsync(async () => {
        const query = database
            .from('transactions')
            .select('*')
            .eq('type', 'rent')
            .order('due_date', { ascending: false });

        const { data, error } = filterStatus
            ? await query.eq('status', filterStatus)
            : await query;

        return { data, error };
    }, [refreshKey, filterStatus]);

    const billingItems = state.value?.data ?? [];

    const handleRowClick = (billingId: string) => router.push(routes.landlord.billing({ id: billingId }));

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Rozliczenia</h1>
                <Link href={routes.landlord.billing({ action: 'new' })} className={styles.addButton}>
                    Dodaj pozycje
                </Link>
            </div>

            <div className={styles.filterSection}>
                <label htmlFor="filterStatus" className={styles.filterLabel}>Filtruj wg statusu: </label>
                <select
                    id="filterStatus"
                    className={styles.filterSelect}
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                >
                    <option value="">Wszystkie</option>
                    <option value="pending">Oczekujace</option>
                    <option value="paid">Oplacone</option>
                    <option value="overdue">Przeterminowane</option>
                </select>
            </div>

            {state.error ? <ErrorBanner msg={state.error.message} retry={handleRefresh} /> :
                state.loading ? <Spinner /> :
                    state.value?.error ? <ErrorBanner msg={state.value.error.message} /> :
                        billingItems.length === 0 ? (
                            <EmptyState
                                message="Brak pozycji rozliczeniowych"
                                actionLabel="Dodaj pierwsza pozycje"
                                actionHref={routes.landlord.billing({ action: 'new' })}
                            />
                        ) : (
                            <div className={tableStyles.section}>
                                <table className={tableStyles.table}>
                                    <thead>
                                        <tr>
                                            <th>Opis</th>
                                            <th>Typ</th>
                                            <th>Kwota</th>
                                            <th>Termin</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {billingItems.map(item => (
                                            <tr
                                                key={item.id}
                                                className={tableStyles.clickableRow}
                                                onClick={() => item.id && handleRowClick(item.id)}
                                            >
                                                <td>{item.description}</td>
                                                <td>{TRANSACTION_TYPE_LABELS[item.type ?? ''] ?? item.type}</td>
                                                <td>{formatCurrency(item.amount ?? 0)}</td>
                                                <td>{item.due_date ? formatDate(item.due_date) : '—'}</td>
                                                <td>
                                                    <span className={`${tableStyles.statusBadge} ${getStatusClass(item.status ?? '')}`}>
                                                        {item.status === 'paid' ? 'Opłacone' : item.status === 'overdue' ? 'Przeterminowane' : 'Oczekujące'}
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
