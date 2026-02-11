'use client';

import { useState } from 'react';
import { useAsync, useAsyncFn } from 'react-use';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { database } from '@/api/database';
import { Spinner } from '@/components/shared/Spinner';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { formatCurrency } from '@/utils/formatCurrency';

export const PaymentForm = () => {
    const router = useRouter();

    const [billingItemId, setBillingItemId] = useState('');
    const [amount, setAmount] = useState('');
    const [paymentDate, setPaymentDate] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
    const [notes, setNotes] = useState('');

    const unpaidState = useAsync(async () => {
        const { data, error } = await database
            .from('billing_with_payments')
            .select('*')
            .in('status', ['pending', 'overdue'])
            .order('due_date');
        return { data, error };
    }, []);

    const [submitState, handleSubmit] = useAsyncFn(async () => {
        const payload = {
            billing_item_id: billingItemId,
            amount: parseFloat(amount),
            payment_date: paymentDate,
            payment_method: paymentMethod,
            notes: notes || null,
        };

        const { error } = await database.from('payments').insert(payload);
        !error && router.push('/landlord/payments');
        return { error };
    }, [billingItemId, amount, paymentDate, paymentMethod, notes, router]);

    const unpaidItems = unpaidState.value?.data ?? [];

    return (
        <div>
            <div>
                <Link href="/landlord/payments">← Powrót do listy</Link>
            </div>

            <h1>Zarejestruj płatność</h1>

            {unpaidState.loading ? <Spinner /> :
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                    {submitState.error && <ErrorBanner msg={submitState.error.message} />}
                    {submitState.value?.error && <ErrorBanner msg={submitState.value.error.message} />}

                    <div>
                        <label htmlFor="billingItemId">Pozycja rozliczeniowa</label>
                        <select
                            id="billingItemId"
                            value={billingItemId}
                            onChange={(e) => setBillingItemId(e.target.value)}
                            required
                        >
                            <option value="">— Wybierz pozycję —</option>
                            {unpaidItems.map(item => (
                                <option key={item.id} value={item.id!}>
                                    {item.description} — {formatCurrency(item.balance ?? 0)} do zapłaty
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
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

                    <div>
                        <label htmlFor="paymentDate">Data płatności</label>
                        <input
                            id="paymentDate"
                            type="date"
                            value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="paymentMethod">Metoda płatności</label>
                        <select
                            id="paymentMethod"
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                        >
                            <option value="bank_transfer">Przelew</option>
                            <option value="cash">Gotówka</option>
                            <option value="card">Karta</option>
                            <option value="other">Inne</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="notes">Notatki</label>
                        <textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            placeholder="Dodatkowe informacje..."
                        />
                    </div>

                    <button type="submit" disabled={submitState.loading}>
                        {submitState.loading ? 'Zapisywanie...' : 'Zarejestruj płatność'}
                    </button>
                </form>
            }
        </div>
    );
};
