'use client';

import { useState } from 'react';
import { useAsync } from 'react-use';
import Link from 'next/link';

import { database } from '@/api/database';
import { Spinner } from '@/components/shared/Spinner';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';

import styles from './LeaseDetail.module.css';

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
        <div className={styles.page}>
            <Link href="/landlord/leases" className={styles.backLink}>← Powrót do listy</Link>

            {error ? <ErrorBanner msg={error.message} retry={handleRefresh} /> :
                state.loading ? <Spinner /> :
                    !lease ? <ErrorBanner msg="Nie znaleziono umowy" /> :
                        <>
                            <div className={styles.header}>
                                <h1 className={styles.title}>Umowa najmu</h1>
                                <Link href={`/landlord/leases?action=edit&id=${id}`} className={styles.editButton}>
                                    Edytuj
                                </Link>
                            </div>

                            <div className={styles.content}>
                                <div className={styles.mainContent}>
                                    <div className={styles.section}>
                                        <h2 className={styles.sectionTitle}>Szczegóły umowy</h2>
                                        <div className={styles.infoGrid}>
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Nieruchomość</span>
                                                <span className={styles.infoValue}>
                                                    <Link href={`/landlord/properties?id=${lease.property_id}`}>
                                                        {(lease as any).properties?.name ?? lease.property_id}
                                                    </Link>
                                                </span>
                                            </div>
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Najemca</span>
                                                <span className={styles.infoValue}>
                                                    <Link href={`/landlord/tenants?id=${lease.tenant_id}`}>
                                                        {(lease as any).tenants
                                                            ? `${(lease as any).tenants.first_name} ${(lease as any).tenants.last_name}`
                                                            : lease.tenant_id}
                                                    </Link>
                                                </span>
                                            </div>
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Status</span>
                                                <span className={`${styles.statusBadge} ${lease.status === 'active' ? styles.statusActive :
                                                        lease.status === 'expired' ? styles.statusExpired :
                                                            styles.statusTerminated
                                                    }`}>
                                                    {STATUS_LABELS[lease.status] ?? lease.status}
                                                </span>
                                            </div>
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Okres</span>
                                                <span className={styles.infoValue}>
                                                    {lease.start_date} — {lease.end_date ?? 'Bezterminowa'}
                                                </span>
                                            </div>
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Czynsz miesięczny</span>
                                                <span className={styles.infoValueAmount}>{formatCurrency(lease.monthly_rent)}</span>
                                            </div>
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Kaucja</span>
                                                <span className={styles.infoValueAmount}>{formatCurrency(lease.deposit_amount)}</span>
                                            </div>
                                            {lease.notes && (
                                                <div className={styles.infoItem}>
                                                    <span className={styles.infoLabel}>Notatki</span>
                                                    <span className={styles.infoValue}>{lease.notes}</span>
                                                </div>
                                            )}
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Utworzono</span>
                                                <span className={styles.infoValue}>
                                                    {lease.created_at ? formatDate(lease.created_at) : '—'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles.section}>
                                        <h2 className={styles.sectionTitle}>Rozliczenia ({billingItems.length})</h2>
                                        {billingState.loading ? <Spinner /> :
                                            billingItems.length === 0 ? (
                                                <p>Brak rozliczeń dla tej umowy</p>
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
                                        <div className={styles.section}>
                                            <h2 className={styles.sectionTitle}>Ostatnie płatności</h2>
                                            <table className={styles.table}>
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
                                </div>

                                <div className={styles.sidebar}>
                                    <div className={styles.leaseInfo}>
                                        <h3 className={styles.leaseInfoTitle}>Podsumowanie</h3>
                                        <div className={styles.leaseInfoItem}>
                                            <span className={styles.leaseInfoLabel}>Czynsz miesięczny</span>
                                            <span className={styles.leaseInfoValueAmount}>{formatCurrency(lease.monthly_rent)}</span>
                                        </div>
                                        <div className={styles.leaseInfoItem}>
                                            <span className={styles.leaseInfoLabel}>Kaucja</span>
                                            <span className={styles.leaseInfoValueAmount}>{formatCurrency(lease.deposit_amount)}</span>
                                        </div>
                                        <div className={styles.leaseInfoItem}>
                                            <span className={styles.leaseInfoLabel}>Status</span>
                                            <span className={styles.leaseInfoValue}>{STATUS_LABELS[lease.status] ?? lease.status}</span>
                                        </div>
                                        <div className={styles.leaseInfoItem}>
                                            <span className={styles.leaseInfoLabel}>Okres</span>
                                            <span className={styles.leaseInfoValue}>
                                                {lease.start_date} — {lease.end_date ?? 'Bezterminowa'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
            }
        </div>
    );
};
