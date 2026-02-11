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
        <div>
            <div>
                <Link href={routes.landlord.properties()}>← Powrót do listy</Link>
            </div>

            {error ? <ErrorBanner msg={error.message} retry={handleRefresh} /> :
                state.loading ? <Spinner /> :
                    !property ? <ErrorBanner msg="Nie znaleziono nieruchomości" /> :
                        <>
                            <div>
                                <h1>{property.name}</h1>
                                <Link href={routes.landlord.properties({ action: 'edit', id })}>
                                    <button>Edytuj</button>
                                </Link>
                            </div>

                            <div>
                                <div>
                                    <h3>Szczegóły</h3>
                                    <dl>
                                        <dt>Adres</dt>
                                        <dd>{property.address}</dd>
                                        <dt>Typ</dt>
                                        <dd>{TYPE_LABELS[property.property_type ?? ''] ?? property.property_type}</dd>
                                        <dt>Status</dt>
                                        <dd>{STATUS_LABELS[property.status ?? ''] ?? property.status}</dd>
                                        <dt>Czynsz miesięczny</dt>
                                        <dd>{formatCurrency(property.monthly_rent ?? 0)}</dd>
                                        <dt>Kaucja</dt>
                                        <dd>{formatCurrency(property.deposit_amount ?? 0)}</dd>
                                        {property.size_sqm && (
                                            <>
                                                <dt>Powierzchnia</dt>
                                                <dd>{property.size_sqm} m²</dd>
                                            </>
                                        )}
                                        {property.bedrooms && (
                                            <>
                                                <dt>Sypialnie</dt>
                                                <dd>{property.bedrooms}</dd>
                                            </>
                                        )}
                                        {property.notes && (
                                            <>
                                                <dt>Notatki</dt>
                                                <dd>{property.notes}</dd>
                                            </>
                                        )}
                                        <dt>Dodano</dt>
                                        <dd>{property.created_at ? formatDate(property.created_at) : '—'}</dd>
                                    </dl>
                                </div>

                                {property.current_lease_id && (
                                    <div>
                                        <h3>Aktualna umowa</h3>
                                        <dl>
                                            <dt>Najemca</dt>
                                            <dd>
                                                <Link href={routes.landlord.tenants({ id: property.tenant_id ?? undefined })}>
                                                    {property.current_tenant_name}
                                                </Link>
                                            </dd>
                                            <dt>Czynsz</dt>
                                            <dd>{formatCurrency(property.current_rent ?? 0)}</dd>
                                            <dt>Okres</dt>
                                            <dd>
                                                {property.lease_start} — {property.lease_end ?? 'Bezterminowa'}
                                            </dd>
                                        </dl>
                                        <Link href={routes.landlord.leases({ id: property.current_lease_id })}>
                                            Szczegóły umowy →
                                        </Link>
                                    </div>
                                )}
                            </div>

                            <div>
                                <h3>Liczniki ({meters.length})</h3>
                                {meters.length === 0 ? (
                                    <p>Brak liczników</p>
                                ) : (
                                    <table>
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
                                <div>
                                    <h3>Ostatnie wydatki</h3>
                                    <table>
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
                        </>
            }
        </div>
    );
};
