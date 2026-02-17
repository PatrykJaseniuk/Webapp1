'use client';

import { useState } from 'react';
import { useAsync, useAsyncFn } from 'react-use';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { routes } from '@/routes';
import { database } from '@/api/database';
import { Spinner } from '@/components/shared/Spinner';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { formatCurrency } from '@/utils/formatCurrency';

import styles from './FormPage.module.css';

export const TransactionForm = () => {
    const router = useRouter();

    const [transactionId, setTransactionId] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');

    // Get pending transactions (unpaid bills)
    const pendingState = useAsync(async () => {
        const { data, error } = await database
            .from('transactions')
            .select('*')
            .eq('status', 'pending')
            .order('due_date');
        return { data, error };
    }, []);

    const [submitState, handleSubmit] = useAsyncFn(async () => {
        // Update the transaction to paid status
        const { error } = await database
            .from('transactions')
            .update({
                status: 'paid',
                amount: parseFloat(amount)
            })
            .eq('id', transactionId);

        !error && router.push(routes.landlord.payments());
        return { error };
    }, [transactionId, amount, description, router]);

    const pendingItems = pendingState.value?.data ?? [];

    return (
        <div className={styles.page}>
            <Link href={routes.landlord.payments()} className={styles.backLink}>← Powrót do listy</Link>

            <h1 className={styles.title}>Zarejestruj płatność</h1>

            {pendingState.loading ? <Spinner /> :
                <form className={styles.form} onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                    {(submitState.error || submitState.value?.error) && (
                        <div className={styles.errorSection}>
                            {submitState.error && <ErrorBanner msg={submitState.error.message} />}
                            {submitState.value?.error && <ErrorBanner msg={submitState.value.error.message} />}
                        </div>
                    )}

                    <div className={styles.formField}>
                        <label htmlFor="transactionId">Pozycja do opłacenia</label>
                        <select
                            id="transactionId"
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            required
                        >
                            <option value="">— Wybierz pozycję —</option>
                            {pendingItems.map(item => (
                                <option key={item.id} value={item.id!}>
                                    {item.description} — {formatCurrency(item.amount ?? 0)} do zapłaty
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.formField}>
                        <label htmlFor="amount">Kwota (PLN)</label>
                        <input
                            id="amount"
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                            placeholder="np. 2500.00"
                        />
                    </div>

                    <div className={styles.formField}>
                        <label htmlFor="description">Notatki</label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Dodatkowe informacje..."
                        />
                    </div>

                    <button type="submit" className={styles.submitButton} disabled={submitState.loading}>
                        {submitState.loading ? 'Zapisywanie...' : 'Zarejestruj płatność'}
                    </button>
                </form>
            }
        </div>
    );
};
