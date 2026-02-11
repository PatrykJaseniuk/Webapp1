'use client';

import { useState } from 'react';
import { useAsync } from 'react-use';
import Link from 'next/link';

import { routes } from '@/routes';
import { database } from '@/api/database';
import { Spinner } from '@/components/shared/Spinner';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';

import styles from './PropertyDetail.module.css';

const STATUS_LABELS: Record<string, string> = {
    available: 'Wolna',
    occupied: 'Zajęta',
    inactive: 'Nieaktywna',
};

const TYPE_LABELS: Record<string, string> = {
    apartment: 'Mieszkanie',
    house: 'Dom',
    commercial: 'Lokal użytkowy',
    room: 'Pokój',
};

interface PropertyDetailProps {
    id: string;
}

export const PropertyDetail = ({ id }: PropertyDetailProps) => {
    const [refreshKey, setRefreshKey] = useState(0);
    const handleRefresh = () => setRefreshKey(prev => prev + 1);

    const state = useAsync(async () => {
        const { data, error } = await database
            .from('property_occupancy')
            .select('*')
            .eq('id', id)
            .single();
        return { data, error };
    }, [id, refreshKey]);

    const metersState = useAsync(async () => {
        const { data, error } = await database
            .from('meters')
            .select('*')
            .eq('property_id', id)
            .order('meter_type');
        return { data, error };
    }, [id, refreshKey]);

    const expensesState = useAsync(async () => {
        const { data, error } = await database
            .from('property_expenses')
            .select('*')
            .eq('property_id', id)
            .order('expense_date', { ascending: false })
            .limit(5);
        return { data, error };
    }, [id, refreshKey]);

    const property = state.value?.data;
    const meters = metersState.value?.data ?? [];
    const expenses = expensesState.value?.data ?? [];

    const error = state.error ?? state.value?.error;

    return (
        <div className={styles.page}>
            <Link href={routes.landlord.properties()} className={styles.backLink}>← Powrót do listy</Link>

            {error ? <ErrorBanner msg={error.message} retry={handleRefresh} /> :
                state.loading ? <Spinner /> :
                    !property ? <ErrorBanner msg="Nie znaleziono nieruchomości" /> :
                        <>
                            <div className={styles.header}>
                                <h1 className={styles.title}>{property.name}</h1>
                                <Link href={routes.landlord.properties({ action: 'edit', id })} className={styles.editButton}>
                                    Edytuj
                                </Link>
                            </div>

                            <div className={styles.content}>
                                <div className={styles.mainContent}>
                                    <div className={styles.section}>
                                        <h2 className={styles.sectionTitle}>Szczegóły nieruchomości</h2>
                                        <div className={styles.infoGrid}>
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Adres</span>
                                                <span className={styles.infoValueAddress}>{property.address}</span>
                                            </div>
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Typ</span>
                                                <span className={styles.infoValue}>
                                                    {TYPE_LABELS[property.property_type ?? ''] ?? property.property_type}
                                                </span>
                                            </div>
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Status</span>
                                                <span className={`${styles.statusBadge} ${property.status === 'available' ? styles.statusAvailable :
                                                    property.status === 'occupied' ? styles.statusOccupied :
                                                        styles.statusMaintenance
                                                    }`}>
                                                    {STATUS_LABELS[property.status ?? ''] ?? property.status}
                                                </span>
                                            </div>
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Czynsz miesięczny</span>
                                                <span className={styles.infoValueAmount}>{formatCurrency(property.monthly_rent ?? 0)}</span>
                                            </div>
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Kaucja</span>
                                                <span className={styles.infoValueAmount}>{formatCurrency(property.deposit_amount ?? 0)}</span>
                                            </div>
                                            {property.size_sqm && (
                                                <div className={styles.infoItem}>
                                                    <span className={styles.infoLabel}>Powierzchnia</span>
                                                    <span className={styles.infoValue}>{property.size_sqm} m²</span>
                                                </div>
                                            )}
                                            {property.bedrooms && (
                                                <div className={styles.infoItem}>
                                                    <span className={styles.infoLabel}>Sypialnie</span>
                                                    <span className={styles.infoValue}>{property.bedrooms}</span>
                                                </div>
                                            )}
                                            {property.notes && (
                                                <div className={styles.infoItem}>
                                                    <span className={styles.infoLabel}>Notatki</span>
                                                    <span className={styles.infoValue}>{property.notes}</span>
                                                </div>
                                            )}
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Dodano</span>
                                                <span className={styles.infoValue}>
                                                    {property.created_at ? formatDate(property.created_at) : '—'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {property.current_lease_id && (
                                        <div className={styles.section}>
                                            <h2 className={styles.sectionTitle}>Aktualna umowa</h2>
                                            <div className={styles.infoGrid}>
                                                <div className={styles.infoItem}>
                                                    <span className={styles.infoLabel}>Najemca</span>
                                                    <span className={styles.infoValue}>
                                                        <Link href={routes.landlord.tenants({ id: property.tenant_id ?? undefined })}>
                                                            {property.current_tenant_name}
                                                        </Link>
                                                    </span>
                                                </div>
                                                <div className={styles.infoItem}>
                                                    <span className={styles.infoLabel}>Czynsz</span>
                                                    <span className={styles.infoValueAmount}>{formatCurrency(property.current_rent ?? 0)}</span>
                                                </div>
                                                <div className={styles.infoItem}>
                                                    <span className={styles.infoLabel}>Okres</span>
                                                    <span className={styles.infoValue}>
                                                        {property.lease_start} — {property.lease_end ?? 'Bezterminowa'}
                                                    </span>
                                                </div>
                                            </div>
                                            <Link href={routes.landlord.leases({ id: property.current_lease_id })} className={styles.editButton}>
                                                Szczegóły umowy →
                                            </Link>
                                        </div>
                                    )}

                                    <div className={styles.section}>
                                        <h2 className={styles.sectionTitle}>Liczniki ({meters.length})</h2>
                                        {meters.length === 0 ? (
                                            <p>Brak liczników</p>
                                        ) : (
                                            <table className={styles.table}>
                                                <thead>
                                                    <tr>
                                                        <th>Typ</th>
                                                        <th>Numer</th>
                                                        <th>Jednostka</th>
                                                        <th>Aktywny</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {meters.map(meter => (
                                                        <tr key={meter.id}>
                                                            <td>{meter.meter_type}</td>
                                                            <td>{meter.meter_number}</td>
                                                            <td>{meter.unit}</td>
                                                            <td>{meter.active ? 'Tak' : 'Nie'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>

                                    {expenses.length > 0 && (
                                        <div className={styles.section}>
                                            <h2 className={styles.sectionTitle}>Ostatnie wydatki</h2>
                                            <table className={styles.table}>
                                                <thead>
                                                    <tr>
                                                        <th>Opis</th>
                                                        <th>Typ</th>
                                                        <th>Kwota</th>
                                                        <th>Data</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {expenses.map(expense => (
                                                        <tr key={expense.id}>
                                                            <td>{expense.description}</td>
                                                            <td>{expense.expense_type}</td>
                                                            <td>{formatCurrency(expense.amount)}</td>
                                                            <td>{formatDate(expense.expense_date)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                <div className={styles.sidebar}>
                                    <div className={styles.propertyStats}>
                                        <h3 className={styles.statsTitle}>Statystyki</h3>
                                        <div className={styles.statItem}>
                                            <span className={styles.statLabel}>Liczniki</span>
                                            <span className={styles.statValue}>{meters.length}</span>
                                        </div>
                                        <div className={styles.statItem}>
                                            <span className={styles.statLabel}>Wydatki (ostatnie 5)</span>
                                            <span className={styles.statValue}>{expenses.length}</span>
                                        </div>
                                        <div className={styles.statItem}>
                                            <span className={styles.statLabel}>Status</span>
                                            <span className={styles.statValue}>
                                                {STATUS_LABELS[property.status ?? ''] ?? property.status}
                                            </span>
                                        </div>
                                        {property.monthly_rent && (
                                            <div className={styles.statItem}>
                                                <span className={styles.statLabel}>Czynsz</span>
                                                <span className={styles.statValueAmount}>
                                                    {formatCurrency(property.monthly_rent)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
            }
        </div>
    );
};