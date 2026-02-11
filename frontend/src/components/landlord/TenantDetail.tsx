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

import styles from './DetailPage.module.css';

const STATUS_LABELS: Record<string, string> = {
    active: 'Aktywny',
    past: 'Były',
    applicant: 'Kandydat',
};

interface TenantDetailProps {
    id: string;
}

export const TenantDetail = ({ id }: TenantDetailProps) => {
    const [refreshKey, setRefreshKey] = useState(0);
    const handleRefresh = () => setRefreshKey(prev => prev + 1);

    const state = useAsync(async () => {
        const { data, error } = await database
            .from('tenants')
            .select('*')
            .eq('id', id)
            .single();
        return { data, error };
    }, [id, refreshKey]);

    const leasesState = useAsync(async () => {
        const { data, error } = await database
            .from('lease_agreements')
            .select('*, properties(name, address)')
            .eq('tenant_id', id)
            .order('start_date', { ascending: false });
        return { data, error };
    }, [id, refreshKey]);

    const billingState = useAsync(async () => {
        const { data: leases } = await database
            .from('lease_agreements')
            .select('id')
            .eq('tenant_id', id);

        const leaseIds = (leases ?? []).map(l => l.id);

        return leaseIds.length > 0
            ? database
                .from('billing_with_payments')
                .select('*')
                .in('lease_id', leaseIds)
                .order('due_date', { ascending: false })
                .limit(10)
                .then(({ data, error }) => ({ data, error }))
            : { data: [], error: null };
    }, [id, refreshKey]);

    const tenant = state.value?.data;
    const leases = leasesState.value?.data ?? [];
    const billingItems = billingState.value?.data ?? [];

    const error = state.error ?? state.value?.error;

    return (
        <div className={styles.page}>
            <Link href={routes.landlord.tenants()} className={styles.backLink}>← Powrót do listy</Link>

            {error ? <ErrorBanner msg={error.message} retry={handleRefresh} /> :
                state.loading ? <Spinner /> :
                    !tenant ? <ErrorBanner msg="Nie znaleziono najemcy" /> :
                        <>
                            <div className={styles.header}>
                                <h1 className={styles.title}>{tenant.first_name} {tenant.last_name}</h1>
                                <Link href={routes.landlord.tenants({ action: 'edit', id })}>
                                    Edytuj

                                </Link>
                            </div>

                            <div className={styles.content}>
                                <div className={styles.mainContent}>
                                    <div className={styles.section}>
                                        <h2 className={styles.sectionTitle}>Dane kontaktowe</h2>
                                        <div className={styles.infoGrid}>
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Email</span>
                                                <span className={styles.infoValueEmail}>{tenant.email}</span>
                                            </div>
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Telefon</span>
                                                <span className={styles.infoValuePhone}>{tenant.phone}</span>
                                            </div>
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Status</span>
                                                <span className={`${styles.statusBadge} ${tenant.status === 'active' ? styles.statusActive :
                                                    tenant.status === 'past' ? styles.statusPast :
                                                        styles.statusApplicant
                                                    }`}>
                                                    {STATUS_LABELS[tenant.status] ?? tenant.status}
                                                </span>
                                            </div>
                                            {tenant.id_document_number && (
                                                <div className={styles.infoItem}>
                                                    <span className={styles.infoLabel}>Nr dokumentu</span>
                                                    <span className={styles.infoValue}>{tenant.id_document_number}</span>
                                                </div>
                                            )}
                                            {tenant.emergency_contact_name && (
                                                <div className={styles.infoItem}>
                                                    <span className={styles.infoLabel}>Kontakt awaryjny</span>
                                                    <span className={styles.infoValue}>
                                                        {tenant.emergency_contact_name} — {tenant.emergency_contact_phone}
                                                    </span>
                                                </div>
                                            )}
                                            {tenant.notes && (
                                                <div className={styles.infoItem}>
                                                    <span className={styles.infoLabel}>Notatki</span>
                                                    <span className={styles.infoValue}>{tenant.notes}</span>
                                                </div>
                                            )}
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Dodano</span>
                                                <span className={styles.infoValue}>
                                                    {tenant.created_at ? formatDate(tenant.created_at) : '—'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={styles.section}>
                                        <h2 className={styles.sectionTitle}>Umowy najmu ({leases.length})</h2>
                                        {leasesState.loading ? <Spinner /> :
                                            leases.length === 0 ? (
                                                <EmptyState message="Brak umów najmu dla tego najemcy" />
                                            ) : (
                                                <table className={styles.table}>
                                                    <thead>
                                                        <tr>
                                                            <th>Nieruchomość</th>
                                                            <th>Okres</th>
                                                            <th>Czynsz</th>
                                                            <th>Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {leases.map(lease => (
                                                            <tr key={lease.id}>
                                                                <td>
                                                                    <Link href={routes.landlord.properties({ id: lease.property_id })}>
                                                                        {(lease as any).properties?.name ?? lease.property_id}
                                                                    </Link>
                                                                </td>
                                                                <td>{lease.start_date} — {lease.end_date ?? 'Bezterminowa'}</td>
                                                                <td>{formatCurrency(lease.monthly_rent)}</td>
                                                                <td>{lease.status}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                    </div>

                                    {billingItems.length > 0 && (
                                        <div className={styles.section}>
                                            <h2 className={styles.sectionTitle}>Ostatnie rozliczenia</h2>
                                            <table className={styles.table}>
                                                <thead>
                                                    <tr>
                                                        <th>Opis</th>
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
                                                            <td>{formatCurrency(item.amount ?? 0)}</td>
                                                            <td>{formatCurrency(item.total_paid ?? 0)}</td>
                                                            <td>{formatCurrency(item.balance ?? 0)}</td>
                                                            <td>{item.due_date ? formatDate(item.due_date) : '—'}</td>
                                                            <td>{item.status}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                <div className={styles.sidebar}>
                                    <div className={styles.leasesSection}>
                                        <h3 className={styles.leasesTitle}>Aktywne umowy</h3>
                                        {leasesState.loading ? <Spinner /> :
                                            leases.filter(l => l.status === 'active').length === 0 ? (
                                                <div className={styles.noLeases}>Brak aktywnych umów</div>
                                            ) : (
                                                leases.filter(l => l.status === 'active').map(lease => (
                                                    <div key={lease.id} className={styles.leaseItem}>
                                                        <div className={styles.leaseProperty}>
                                                            {(lease as any).properties?.name ?? lease.property_id}
                                                        </div>
                                                        <div className={styles.leaseDates}>
                                                            {lease.start_date} — {lease.end_date ?? 'Bezterminowa'}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                    </div>
                                </div>
                            </div>
                        </>
            }
        </div>
    );
};
