'use client';

import type { Database } from '@/api/database.types';
import { METER_TYPE_LABELS } from '@/constants/labels';
import styles from './Tables.module.css';

type Meter = Database['public']['Tables']['meters']['Row'];

interface MetersTableProps {
    data: Meter[];
    onRowClick?: (id: string) => void;
}

export const MetersTable = ({ data, onRowClick }: MetersTableProps) => (
    <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Liczniki ({data.length})</h2>

        {data.length === 0
            ? <div className={styles.emptyState}>Brak liczników dla tej nieruchomości</div>
            : (
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
                        {data.map(meter => (
                            <tr
                                key={meter.id}
                                className={onRowClick ? styles.clickableRow : ''}
                                onClick={() => onRowClick?.(meter.id)}
                            >
                                <td>{METER_TYPE_LABELS[meter.meter_type] ?? meter.meter_type}</td>
                                <td>{meter.meter_number}</td>
                                <td>{meter.unit}</td>
                                <td className={meter.active ? styles.active : styles.inactive}>
                                    {meter.active ? 'Tak' : 'Nie'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )
        }
    </div>
);
