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

const METHOD_LABELS: Record<string, string> = {
    cash: 'Gotówka',
    bank_transfer: 'Przelew',
    card: 'Karta',
    other: 'Inne',
};

export const PaymentsList = () => {
    const [refreshKey, setRefreshKey] = useState(0);
    const handleRefresh = () => setRefreshKey(prev => prev + 1);

    const state = useAsync(async () => {
        const { data, error } = await database
            .from('payments')
            .select('*, billing_items(description, lease_id)')
            .order('payment_date', { ascending: false });
        return { data, error };
    }, [refreshKey]);

    const payments = state.value?.data ?? [];

    return (
        <div>
            <div>
                <h1>Płatności</h1>
                <Link href="/landlord/payments?action=new">
                    <button>Zarejestruj płatność</button>
                </Link>
            </div>

            {state.error ? <ErrorBanner msg={state.error.message} retry={handleRefresh} /> :
                state.loading ? <Spinner /> :
                    state.value?.error ? <ErrorBanner msg={state.value.error.message} /> :
                        payments.length === 0 ? (
                            <EmptyState
                                message="Brak zarejestrowanych płatności"
                                actionLabel="Zarejestruj pierwszą płatność"
                                actionHref="/landlord/payments?action=new"
                            />
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Data</th>
                                        <th>Kwota</th>
                                        <th>Metoda</th>
                                        <th>Pozycja rozliczeniowa</th>
                                        <th>Notatki</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.map(payment => (
                                        <tr key={payment.id}>
                                            <td>{formatDate(payment.payment_date)}</td>
                                            <td>{formatCurrency(payment.amount)}</td>
                                            <td>{METHOD_LABELS[payment.payment_method] ?? payment.payment_method}</td>
                                            <td>{(payment as any).billing_items?.description ?? payment.billing_item_id}</td>
                                            <td>{payment.notes ?? '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
        </div>
    );
};
