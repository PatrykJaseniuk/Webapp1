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
import { formatDate } from '@/utils/formatDate';

import styles from './ListPage.module.css';

const STATUS_LABELS: Record<string, string> = {
    pending: 'Oczekuje',
    paid: 'Zapłacone',
    overdue: 'Przeterminowane',
};

const TYPE_LABELS: Record<string, string> = {
    rent: 'Czynsz',
    utility: 'Media',
    deposit: 'Kaucja',
    fee: 'Opłata',
    other: 'Inne',
};

export const BillingList = () => {
    const [refreshKey, setRefreshKey] = useState(0);
    const [filterStatus, setFilterStatus] = useState('');
    const handleRefresh = () => setRefreshKey(prev => prev + 1);

    const state = useAsync(async () => {
        const query = database
            .from('billing_with_payments')
            .select('*')
            .order('due_date', { ascending: false });

        const { data, error } = filterStatus
            ? await query.eq('status', filterStatus)
            : await query;

        return { data, error };
    }, [refreshKey, filterStatus]);

    const billingItems = state.value?.data ?? [];

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Rozliczenia</h1>
                <Link href={routes.landlord.billing({ action: 'new' })} className={styles.addButton}>
                    Dodaj pozycję
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
                    <option value="pending">Oczekujące</option>
                    <option value="paid">Zapłacone</option>
                    <option value="overdue">Przeterminowane</option>
                </select>
            </div>

            {state.error ? <ErrorBanner msg={state.error.message} retry={handleRefresh} /> :
                state.loading ? <Spinner /> :
                    state.value?.error ? <ErrorBanner msg={state.value.error.message} /> :
                        billingItems.length === 0 ? (
                            <EmptyState
                                message="Brak pozycji rozliczeniowych"
                                actionLabel="Dodaj pierwszą pozycję"
                                actionHref={routes.landlord.billing({ action: 'new' })}
                            />
                        ) : (
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Opis</th>
                                        <th>Typ</th>
                                        <th>Kwota</th>
                                        <th>Zapłacono</th>
                                        <th>Saldo</th>
                                        <th>Termin</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {billingItems.map(item => (
                                        <tr key={item.id}>
                                            <td>{item.description}</td>
                                            <td className={styles.typeLabel}>{TYPE_LABELS[item.item_type ?? ''] ?? item.item_type}</td>
                                            <td className={styles.amount}>{formatCurrency(item.amount ?? 0)}</td>
                                            <td className={styles.amount}>{formatCurrency(item.total_paid ?? 0)}</td>
                                            <td className={`${styles.amount} ${(item.balance ?? 0) >= 0 ? styles.balancePositive : styles.balanceNegative}`}>
                                                {formatCurrency(item.balance ?? 0)}
                                            </td>
                                            <td>{item.due_date ? formatDate(item.due_date) : '—'}</td>
                                            <td>
                                                <span className={`${styles.status} ${styles[`status${(item.status ?? '').charAt(0).toUpperCase() + (item.status ?? '').slice(1)}`]}`}>
                                                    {STATUS_LABELS[item.status ?? ''] ?? item.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
        </div>
    );
};
