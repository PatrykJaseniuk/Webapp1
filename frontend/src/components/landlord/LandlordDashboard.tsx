'use client';

import { useState } from 'react';
import { useAsync } from 'react-use';
import Link from 'next/link';

import { database } from '@/api/database';
import { Spinner } from '@/components/shared/Spinner';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { EmptyState } from '@/components/shared/EmptyState';
import { AppLayout } from '@/components/shared/AppLayout';
import { formatCurrency } from '@/utils/formatCurrency';

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
        <div>
            <h1>Panel wynajmującego</h1>
            {error ? <ErrorBanner msg={error.message} retry={handleRefresh} /> :
                isLoading ? <Spinner /> :
                    <>
                        <div>
                            <div>
                                <h3>Nieruchomości</h3>
                                <p>{totalProperties}</p>
                                <span>Zajęte: {occupiedCount} · Wolne: {availableCount}</span>
                            </div>

                            <div>
                                <h3>Aktywne umowy</h3>
                                <p>{activeLeases}</p>
                            </div>

                            <div>
                                <h3>Do zapłaty</h3>
                                <p>{formatCurrency(totalUnpaid)}</p>
                                {totalOverdue > 0 && (
                                    <span>Przeterminowane: {formatCurrency(totalOverdue)}</span>
                                )}
                            </div>
                        </div>

                        <div>
                            <h2>Aktywne umowy najmu</h2>
                            {leases.length === 0 ? (
                                <EmptyState
                                    message="Brak aktywnych umów najmu"
                                    actionLabel="Dodaj umowę"
                                    actionHref="/landlord/leases?action=new"
                                />
                            ) : (
                                <table>
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
                                                    <Link href={`/landlord/properties?id=${lease.property_id}`}>
                                                        {lease.property_name}
                                                    </Link>
                                                </td>
                                                <td>
                                                    <Link href={`/landlord/tenants?id=${lease.tenant_id}`}>
                                                        {lease.tenant_name}
                                                    </Link>
                                                </td>
                                                <td>{formatCurrency(lease.monthly_rent ?? 0)}</td>
                                                <td>{lease.end_date ?? 'Bezterminowa'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {unpaid.length > 0 && (
                            <div>
                                <h2>Niezapłacone rachunki</h2>
                                <table>
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
                                                <td>{formatCurrency(item.total_unpaid_amount ?? 0)}</td>
                                                <td>{formatCurrency(item.total_overdue_amount ?? 0)}</td>
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
