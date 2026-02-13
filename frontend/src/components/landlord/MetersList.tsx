'use client';

import { useState } from 'react';
import { useAsync } from 'react-use';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { routes } from '@/routes';
import { database } from '@/api/database';
import { Spinner } from '@/components/shared/Spinner';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { EmptyState } from '@/components/shared/EmptyState';
import { METER_TYPE_LABELS } from '@/constants/labels';
import { formatDate } from '@/utils/formatDate';

import styles from './ListPage.module.css';
import tableStyles from './tables/Tables.module.css';

export const MetersList = () => {
    const router = useRouter();
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

    const handleRowClick = (meterId: string) => router.push(routes.landlord.meters({ id: meterId }));

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Liczniki</h1>
                <div>
                    <Link href={routes.landlord.meters({ action: 'new-meter' })} className={styles.addButton}>
                        Dodaj licznik
                    </Link>
                    <Link href={routes.landlord.meters({ action: 'new-reading' })} className={styles.addButton}>
                        Dodaj odczyt
                    </Link>
                </div>
            </div>

            {state.error ? <ErrorBanner msg={state.error.message} retry={handleRefresh} /> :
                state.loading ? <Spinner /> :
                    state.value?.error ? <ErrorBanner msg={state.value.error.message} /> :
                        meters.length === 0 ? (
                            <EmptyState
                                message="Brak licznikow"
                                actionLabel="Dodaj pierwszy licznik"
                                actionHref={routes.landlord.meters({ action: 'new-meter' })}
                            />
                        ) : (
                            <div className={tableStyles.section}>
                                <table className={tableStyles.table}>
                                    <thead>
                                        <tr>
                                            <th>Nieruchomosc</th>
                                            <th>Typ</th>
                                            <th>Numer</th>
                                            <th>Jednostka</th>
                                            <th>Ostatni odczyt</th>
                                            <th>Aktywny</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {meters.map(meter => {
                                            const latest = getLatestReading(meter.id);
                                            return (
                                                <tr
                                                    key={meter.id}
                                                    className={tableStyles.clickableRow}
                                                    onClick={() => handleRowClick(meter.id)}
                                                >
                                                    <td>{(meter as any).properties?.name ?? meter.property_id}</td>
                                                    <td>{METER_TYPE_LABELS[meter.meter_type] ?? meter.meter_type}</td>
                                                    <td>{meter.meter_number}</td>
                                                    <td>{meter.unit}</td>
                                                    <td>
                                                        {latest
                                                            ? `${latest.reading_value} ${latest.unit} (${formatDate(latest.reading_date ?? '')})`
                                                            : 'Brak'
                                                        }
                                                    </td>
                                                    <td className={meter.active ? tableStyles.active : tableStyles.inactive}>
                                                        {meter.active ? 'Tak' : 'Nie'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
        </div>
    );
};
