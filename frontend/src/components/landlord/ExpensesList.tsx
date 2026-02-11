'use client';

import { useState } from 'react';
import { useAsync } from 'react-use';
import Link from 'next/link';

import { database } from '@/api/database';
import { Spinner } from '@/components/shared/Spinner';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';

import styles from './ExpensesList.module.css';

const TYPE_LABELS: Record<string, string> = {
    maintenance: 'Konserwacja',
    tax: 'Podatek',
    insurance: 'Ubezpieczenie',
    renovation: 'Remont',
    other: 'Inne',
};

export const ExpensesList = () => {
    const [refreshKey, setRefreshKey] = useState(0);
    const [filterType, setFilterType] = useState('');
    const handleRefresh = () => setRefreshKey(prev => prev + 1);

    const state = useAsync(async () => {
        const query = database
            .from('property_expenses')
            .select('*, properties(name)')
            .order('expense_date', { ascending: false });

        const { data, error } = filterType
            ? await query.eq('expense_type', filterType)
            : await query;

        return { data, error };
    }, [refreshKey, filterType]);

    const expenses = state.value?.data ?? [];

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Wydatki na nieruchomości</h1>
                <Link href="/landlord/expenses?action=new" className={styles.addButton}>
                    Dodaj wydatek
                </Link>
            </div>

            <div className={styles.header}>
                <label htmlFor="filterType" className={styles.category}>Filtruj wg typu: </label>
                <select
                    id="filterType"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className={styles.category}
                >
                    <option value="">Wszystkie</option>
                    <option value="maintenance">Konserwacja</option>
                    <option value="tax">Podatek</option>
                    <option value="insurance">Ubezpieczenie</option>
                    <option value="renovation">Remont</option>
                    <option value="other">Inne</option>
                </select>
            </div>

            {state.error ? <ErrorBanner msg={state.error.message} retry={handleRefresh} /> :
                state.loading ? <Spinner /> :
                    state.value?.error ? <ErrorBanner msg={state.value.error.message} /> :
                        expenses.length === 0 ? (
                            <EmptyState
                                message="Brak wydatków"
                                actionLabel="Dodaj pierwszy wydatek"
                                actionHref="/landlord/expenses?action=new"
                            />
                        ) : (
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Nieruchomość</th>
                                        <th>Opis</th>
                                        <th>Typ</th>
                                        <th>Kwota</th>
                                        <th>Data</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expenses.map(expense => (
                                        <tr key={expense.id}>
                                            <td>{(expense as any).properties?.name ?? expense.property_id}</td>
                                            <td className={styles.description}>{expense.description}</td>
                                            <td className={styles.category}>{TYPE_LABELS[expense.expense_type] ?? expense.expense_type}</td>
                                            <td className={styles.amount}>{formatCurrency(expense.amount)}</td>
                                            <td className={styles.date}>{formatDate(expense.expense_date)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
        </div>
    );
};
