'use client';

import { useState } from 'react';
import { useAsync } from 'react-use';
import Link from 'next/link';

import { database } from '@/api/database';
import { Spinner } from '@/components/shared/Spinner';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';

const STATUS_LABELS: Record<string, string> = {
    active: 'Aktywna',
    expired: 'Wygasła',
    terminated: 'Rozwiązana',
};

interface LeaseDetailProps {
    id: string;
}

export const LeaseDetail = ({ id }: LeaseDetailProps) => {
    const [refreshKey, setRefreshKey] = useState(0);
    const handleRefresh = () => setRefreshKey(prev => prev + 1);

    const state = useAsync(async () => {
        const { data, error } = await database
            .from('lease_agreements')
            .select('*, tenants(first_name, last_name, email, phone), properties(name, address)')
            .eq('id', id)
            .single();
        return { data, error };
    }, [id, refreshKey]);

    const billingState = useAsync(async () => {
        const { data, error } = await database
            .from('billing_with_payments')
            .select('*')
            .eq('lease_id', id)
            .order('due_date', { ascending: false });
        return { data, error };
    }, [id, refreshKey]);

    const paymentsState = useAsync(async () => {
        const { data: billingItems } = await database
            .from('billing_items')
            .select('id')
            .eq('lease_id', id);

        const billingIds = (billingItems ?? []).map(b => b.id);

        return billingIds.length > 0
            ? database
                .from('payments')
                .select('*')
                .in('billing_item_id', billingIds)
                .order('payment_date', { ascending: false })
                .limit(10)
                .then(({ data, error }) => ({ data, error }))
            : { data: [], error: null };
    }, [id, refreshKey]);

    const lease = state.value?.data;
    const billingItems = billingState.value?.data ?? [];
    const payments = paymentsState.value?.data ?? [];
    const error = state.error ?? state.value?.error;

    return (
        <div>
            <div>
                <Link href="/landlord/leases">← Powrót do listy</Link>
            </div>

            {error ? <ErrorBanner msg={error.message} retry={handleRefresh} /> :
                state.loading ? <Spinner /> :
                    !lease ? <ErrorBanner msg="Nie znaleziono umowy" /> :
                        <>
                            <div>
                                <h1>Umowa najmu</h1>
                                <Link href={`/landlord/leases?action=edit&id=${id}`}>
                                    <button>Edytuj</button>
                                </Link>
                            </div>

                            <div>
                                <div>
                                    <h3>Szczegóły umowy</h3>
                                    <dl>
                                        <dt>Nieruchomość</dt>
                                        <dd>
                                            <Link href={`/landlord/properties?id=${lease.property_id}`}>
                                                {(lease as any).properties?.name ?? lease.property_id}
                                            </Link>
                                        </dd>
                                        <dt>Najemca</dt>
                                        <dd>
                                            <Link href={`/landlord/tenants?id=${lease.tenant_id}`}>
                                                {(lease as any).tenants
                                                    ? `${(lease as any).tenants.first_name} ${(lease as any).tenants.last_name}`
                                                    : lease.tenant_id}
                                            </Link>
                                        </dd>
                                        <dt>Status</dt>
                                        <dd>{STATUS_LABELS[lease.status] ?? lease.status}</dd>
                                        <dt>Okres</dt>
                                        <dd>{lease.start_date} — {lease.end_date ?? 'Bezterminowa'}</dd>
                                        <dt>Czynsz miesięczny</dt>
                                        <dd>{formatCurrency(lease.monthly_rent)}</dd>
                                        <dt>Kaucja</dt>
                                        <dd>{formatCurrency(lease.deposit_amount)}</dd>
                                        {lease.notes && (
                                            <>
                                                <dt>Notatki</dt>
                                                <dd>{lease.notes}</dd>
                                            </>
                                        )}
                                        <dt>Utworzono</dt>
                                        <dd>{lease.created_at ? formatDate(lease.created_at) : '—'}</dd>
                                    </dl>
                                </div>
                            </div>

                            <div>
                                <h3>Rozliczenia ({billingItems.length})</h3>
                                {billingState.loading ? <Spinner /> :
                                    billingItems.length === 0 ? (
                                        <p>Brak rozliczeń dla tej umowy</p>
                                    ) : (
                                        <table>
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
                                                        <td>{item.item_type}</td>
                                                        <td>{formatCurrency(item.amount ?? 0)}</td>
                                                        <td>{formatCurrency(item.total_paid ?? 0)}</td>
                                                        <td>{formatCurrency(item.balance ?? 0)}</td>
                                                        <td>{item.due_date ? formatDate(item.due_date) : '—'}</td>
                                                        <td>{item.status}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                            </div>

                            {payments.length > 0 && (
                                <div>
                                    <h3>Ostatnie płatności</h3>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Data</th>
                                                <th>Kwota</th>
                                                <th>Metoda</th>
                                                <th>Notatki</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {payments.map(payment => (
                                                <tr key={payment.id}>
                                                    <td>{formatDate(payment.payment_date)}</td>
                                                    <td>{formatCurrency(payment.amount)}</td>
                                                    <td>{payment.payment_method}</td>
                                                    <td>{payment.notes ?? '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
            }
        </div>
    );
};
