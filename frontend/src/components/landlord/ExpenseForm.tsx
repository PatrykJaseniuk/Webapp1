'use client';

import { useState } from 'react';
import { useAsync, useAsyncFn } from 'react-use';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { routes } from '@/routes';
import { database } from '@/api/database';
import { Spinner } from '@/components/shared/Spinner';
import { ErrorBanner } from '@/components/shared/ErrorBanner';

import styles from './ExpenseForm.module.css';

export const ExpenseForm = () => {
    const router = useRouter();

    const [propertyId, setPropertyId] = useState('');
    const [expenseType, setExpenseType] = useState('maintenance');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [expenseDate, setExpenseDate] = useState('');

    const propertiesState = useAsync(async () => {
        const { data, error } = await database
            .from('properties')
            .select('id, name, address')
            .order('name');
        return { data, error };
    }, []);

    const [submitState, handleSubmit] = useAsyncFn(async () => {
        const payload = {
            property_id: propertyId,
            expense_type: expenseType,
            description,
            amount: parseFloat(amount),
            expense_date: expenseDate,
        };

        const { error } = await database.from('property_expenses').insert(payload);
        !error && router.push(routes.landlord.expenses());
        return { error };
    }, [propertyId, expenseType, description, amount, expenseDate, router]);

    const properties = propertiesState.value?.data ?? [];

    return (
        <div className={styles.page}>
            <Link href={routes.landlord.expenses()} className={styles.backLink}>← Powrót do listy</Link>

            <h1 className={styles.title}>Nowy wydatek</h1>

            {propertiesState.loading ? <Spinner /> :
                <form className={styles.form} onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                    {(submitState.error || submitState.value?.error) && (
                        <div className={styles.errorSection}>
                            {submitState.error && <ErrorBanner msg={submitState.error.message} />}
                            {submitState.value?.error && <ErrorBanner msg={submitState.value.error.message} />}
                        </div>
                    )}

                    <div className={styles.formField}>
                        <label htmlFor="propertyId">Nieruchomość</label>
                        <select
                            id="propertyId"
                            value={propertyId}
                            onChange={(e) => setPropertyId(e.target.value)}
                            required
                        >
                            <option value="">— Wybierz nieruchomość —</option>
                            {properties.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name} ({p.address})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.formField}>
                        <label htmlFor="expenseType">Typ wydatku</label>
                        <select
                            id="expenseType"
                            value={expenseType}
                            onChange={(e) => setExpenseType(e.target.value)}
                        >
                            <option value="maintenance">Konserwacja</option>
                            <option value="tax">Podatek</option>
                            <option value="insurance">Ubezpieczenie</option>
                            <option value="renovation">Remont</option>
                            <option value="other">Inne</option>
                        </select>
                    </div>

                    <div className={styles.formField}>
                        <label htmlFor="description">Opis</label>
                        <input
                            id="description"
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            placeholder="np. Wymiana zamka w drzwiach"
                        />
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
                            placeholder="np. 350.00"
                        />
                    </div>

                    <div className={styles.formField}>
                        <label htmlFor="expenseDate">Data wydatku</label>
                        <input
                            id="expenseDate"
                            type="date"
                            value={expenseDate}
                            onChange={(e) => setExpenseDate(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className={styles.submitButton} disabled={submitState.loading}>
                        {submitState.loading ? 'Zapisywanie...' : 'Dodaj wydatek'}
                    </button>
                </form>
            }
        </div>
    );
};