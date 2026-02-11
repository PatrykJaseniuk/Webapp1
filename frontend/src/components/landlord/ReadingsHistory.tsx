'use client';

import { useState } from 'react';
import { useAsync } from 'react-use';
import Link from 'next/link';

import { routes } from '@/routes';
import { database } from '@/api/database';
import { Spinner } from '@/components/shared/Spinner';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDate } from '@/utils/formatDate';

import styles from './ListPage.module.css';

interface ReadingsHistoryProps {
    meterId: string;
}

export const ReadingsHistory = ({ meterId }: ReadingsHistoryProps) => {
    const [refreshKey, setRefreshKey] = useState(0);
    const handleRefresh = () => setRefreshKey(prev => prev + 1);

    const meterState = useAsync(async () => {
        const { data, error } = await database
            .from('meters')
            .select('*, properties(name)')
            .eq('id', meterId)
            .single();
        return { data, error };
    }, [meterId]);

    const state = useAsync(async () => {
        const { data, error } = await database
            .from('meter_readings')
            .select('*')
            .eq('meter_id', meterId)
            .order('reading_date', { ascending: false });
        return { data, error };
    }, [meterId, refreshKey]);

    const meter = meterState.value?.data;
    const readings = state.value?.data ?? [];

    const readingsWithDelta = readings.map((reading, index) => {
        const prevReading = readings[index + 1];
        const delta = prevReading
            ? reading.reading_value - prevReading.reading_value
            : null;
        return { ...reading, delta };
    });

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <Link href={routes.landlord.meters()}>← Powrót do listy</Link>
                </div>
                <h1 className={styles.title}>
                    Historia odczytów
                    {meter && ` — ${(meter as any).properties?.name} (${meter.meter_type}, ${meter.meter_number})`}
                </h1>

                <Link href={routes.landlord.meters({ action: 'new-reading', meterId })}>
                    <button>Dodaj odczyt</button>
                </Link>
            </div>


            {state.error ? <ErrorBanner msg={state.error.message} retry={handleRefresh} /> :
                state.loading ? <Spinner /> :
                    state.value?.error ? <ErrorBanner msg={state.value.error.message} /> :
                        readings.length === 0 ? (
                            <EmptyState
                                message="Brak odczytów dla tego licznika"
                                actionLabel="Dodaj odczyt"
                                actionHref={routes.landlord.meters({ action: 'new-reading', meterId })}
                            />
                        ) : (
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Data</th>
                                        <th>Wartość</th>
                                        <th>Zużycie</th>
                                        <th>Notatki</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {readingsWithDelta.map(reading => (
                                        <tr key={reading.id}>
                                            <td className={styles.date}>{formatDate(reading.reading_date)}</td>
                                            <td className={styles.readingValue}>
                                                {reading.reading_value} {meter?.unit ?? ''}
                                            </td>
                                            <td className={`${styles.consumption} ${reading.delta !== null && reading.delta >= 0
                                                ? styles.consumptionPositive
                                                : reading.delta !== null && reading.delta < 0
                                                    ? styles.consumptionNegative
                                                    : ''
                                                }`}>
                                                {reading.delta !== null ? `${reading.delta.toFixed(2)} ${meter?.unit ?? ''}` : '—'}
                                            </td>
                                            <td className={styles.notes}>{reading.notes ?? '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
        </div>
    );
};
