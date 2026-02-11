'use client';

import { useState } from 'react';
import { useAsync } from 'react-use';
import Link from 'next/link';

import { routes } from '@/routes';
import { database } from '@/api/database';
import { Spinner } from '@/components/shared/Spinner';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { EmptyState } from '@/components/shared/EmptyState';
import { AppLayout } from '@/components/shared/AppLayout';
import { formatCurrency } from '@/utils/formatCurrency';

import styles from './LandlordDashboard.module.css';

export const LandlordDashboard = () => {
    const [refreshKey, setRefreshKey] = useState(0);
    const handleRefresh = () => setRefreshKey(prev => prev + 1);

    const propertiesState = useAsync(async () => {
        const { data, error } = await database
            .from('property_occupancy')
            .select('*');
        return { data, error };
    }, [refreshKey]);

    const leasesState = useAsync(async () => {
        const { data, error } = await database
            .from('active_leases')
            .select('*');
        return { data, error };
    }, [refreshKey]);

    const unpaidState = useAsync(async () => {
        const { data, error } = await database
            .from('unpaid_billing_summary')
            .select('*');
        return { data, error };
    }, [refreshKey]);

    const properties = propertiesState.value?.data ?? [];
    const leases = leasesState.value?.data ?? [];
    const unpaid = unpaidState.value?.data ?? [];

    const totalProperties = properties.length;
    const occupiedCount = properties.filter(p => p.status === 'occupied').length;
    const availableCount = properties.filter(p => p.status === 'available').length;
    const activeLeases = leases.length;
    const totalUnpaid = unpaid.reduce((sum, u) => sum + (u.total_unpaid_amount ?? 0), 0);
    const totalOverdue = unpaid.reduce((sum, u) => sum + (u.total_overdue_amount ?? 0), 0);

    const isLoading = propertiesState.loading || leasesState.loading || unpaidState.loading;
    const error = propertiesState.error ?? leasesState.error ?? unpaidState.error
        ?? propertiesState.value?.error ?? leasesState.value?.error ?? unpaidState.value?.error;

    return (
        <div className={styles.page}>
            <h1 className={styles.title}>Panel wynajmującego</h1>
            {error ? <ErrorBanner msg={error.message} retry={handleRefresh} /> :
                isLoading ? <Spinner /> :
                    <>
                        <div className={styles.statsGrid}>
                            <div className={styles.statCard}>
                                <h3 className={styles.statTitle}>Nieruchomości</h3>
                                <p className={styles.statValue}>{totalProperties}</p>
                                <span className={styles.statSubtitle}>Zajęte: {occupiedCount} · Wolne: {availableCount}</span>
                            </div>

                            <div className={styles.statCard}>
                                <h3 className={styles.statTitle}>Aktywne umowy</h3>
                                <p className={styles.statValue}>{activeLeases}</p>
                            </div>

                            <div className={styles.statCard}>
                                <h3 className={styles.statTitle}>Do zapłaty</h3>
                                <p className={styles.statValue}>{formatCurrency(totalUnpaid)}</p>
                                {totalOverdue > 0 && (
                                    <span className={styles.statSubtitle}>Przeterminowane: {formatCurrency(totalOverdue)}</span>
                                )}
                            </div>
                        </div>

                        <div className={styles.section}>
                            <h2 className={styles.sectionTitle}>Aktywne umowy najmu</h2>
                            {leases.length === 0 ? (
                                <EmptyState
                                    message="Brak aktywnych umów najmu"
                                    actionLabel="Dodaj umowę"
                                    actionHref={routes.landlord.leases({ action: 'new' })}
                                />
                            ) : (
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Nieruchomość</th>
                                            <th>Najemca</th>
                                            <th>Czynsz</th>
                                            <th>Koniec umowy</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leases.map(lease => (
                                            <tr key={lease.id}>
                                                <td>
                                                    <Link className={styles.tableLink} href={routes.landlord.properties({ id: lease.property_id ?? undefined })}>
                                                        {lease.property_name}
                                                    </Link>
                                                </td>
                                                <td>
                                                    <Link className={styles.tableLink} href={routes.landlord.tenants({ id: lease.tenant_id ?? undefined })}>
                                                        {lease.tenant_name}
                                                    </Link>
                                                </td>
                                                <td className={styles.amount}>{formatCurrency(lease.monthly_rent ?? 0)}</td>
                                                <td>{lease.end_date ?? 'Bezterminowa'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {unpaid.length > 0 && (
                            <div className={styles.section}>
                                <h2 className={styles.sectionTitle}>Niezapłacone rachunki</h2>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Najemca</th>
                                            <th>Nieruchomość</th>
                                            <th>Kwota</th>
                                            <th>Przeterminowane</th>
                                            <th>Pozycji</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {unpaid.map(item => (
                                            <tr key={item.lease_id}>
                                                <td>{item.tenant_name}</td>
                                                <td>{item.property_name}</td>
                                                <td className={styles.amount}>{formatCurrency(item.total_unpaid_amount ?? 0)}</td>
                                                <td className={styles.overdue}>{formatCurrency(item.total_overdue_amount ?? 0)}</td>
                                                <td>{item.unpaid_items_count}</td>
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
