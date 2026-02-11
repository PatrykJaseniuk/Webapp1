'use client';

import { useState } from 'react';
import { useAsync } from 'react-use';
import Link from 'next/link';

import { routes } from '@/routes';
import { database } from '@/api/database';
import { Spinner } from '@/components/shared/Spinner';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { EmptyState } from '@/components/shared/EmptyState';

const TYPE_LABELS: Record<string, string> = {
    electricity: 'Prąd',
    water: 'Woda',
    gas: 'Gaz',
    heating: 'Ogrzewanie',
};

export const MetersList = () => {
    const [refreshKey, setRefreshKey] = useState(0);
    const handleRefresh = () => setRefreshKey(prev => prev + 1);

    const state = useAsync(async () => {
        const { data, error } = await database
            .from('meters')
            .select('*, properties(name)')
            .order('property_id');
        return { data, error };
    }, [refreshKey]);

    const latestState = useAsync(async () => {
        const { data, error } = await database
            .from('latest_meter_readings')
            .select('*');
        return { data, error };
    }, [refreshKey]);

    const meters = state.value?.data ?? [];
    const latestReadings = latestState.value?.data ?? [];

    const getLatestReading = (meterId: string) =>
        latestReadings.find(r => r.meter_id === meterId);

    return (
        <div>
            <div>
                <h1>Liczniki</h1>
                <div>
                    <Link href={routes.landlord.meters({ action: 'new-meter' })}>
                        <button>Dodaj licznik</button>
                    </Link>
                    <Link href={routes.landlord.meters({ action: 'new-reading' })}>
                        <button>Dodaj odczyt</button>
                    </Link>
                </div>
            </div>

            {state.error ? <ErrorBanner msg={state.error.message} retry={handleRefresh} /> :
                state.loading ? <Spinner /> :
                    state.value?.error ? <ErrorBanner msg={state.value.error.message} /> :
                        meters.length === 0 ? (
                            <EmptyState
                                message="Brak liczników"
                                actionLabel="Dodaj pierwszy licznik"
                                actionHref={routes.landlord.meters({ action: 'new-meter' })}
                            />
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Nieruchomość</th>
                                        <th>Typ</th>
                                        <th>Numer</th>
                                        <th>Jednostka</th>
                                        <th>Ostatni odczyt</th>
                                        <th>Aktywny</th>
                                        <th>Akcje</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {meters.map(meter => {
                                        const latest = getLatestReading(meter.id);
                                        return (
                                            <tr key={meter.id}>
                                                <td>{(meter as any).properties?.name ?? meter.property_id}</td>
                                                <td>{TYPE_LABELS[meter.meter_type] ?? meter.meter_type}</td>
                                                <td>{meter.meter_number}</td>
                                                <td>{meter.unit}</td>
                                                <td>
                                                    {latest
                                                        ? `${latest.reading_value} ${latest.unit} (${latest.reading_date})`
                                                        : 'Brak'}
                                                </td>
                                                <td>{meter.active ? 'Tak' : 'Nie'}</td>
                                                <td>
                                                    <Link href={routes.landlord.meters({ meterId: meter.id })}>
                                                        Historia
                                                    </Link>
                                                    {' | '}
                                                    <Link href={routes.landlord.meters({ action: 'new-reading', meterId: meter.id })}>
                                                        Odczyt
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
        </div>
    );
};
