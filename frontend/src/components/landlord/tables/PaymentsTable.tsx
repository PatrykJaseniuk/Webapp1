'use client';

import type { Database } from '@/api/database.types';
import { PAYMENT_METHOD_LABELS } from '@/constants/labels';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import styles from './Tables.module.css';

type Payment = Database['public']['Tables']['payments']['Row'];

interface PaymentsTableProps {
    data: Payment[];
    onRowClick?: (id: string) => void;
}

export const PaymentsTable = ({ data, onRowClick }: PaymentsTableProps) => (
    <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Płatności ({data.length})</h2>

        {data.length === 0
            ? <div className={styles.emptyState}>Brak płatności dla tej nieruchomości</div>
            : (
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
                        {data.map(payment => (
                            <tr
                                key={payment.id}
                                className={onRowClick ? styles.clickableRow : ''}
                                onClick={() => onRowClick?.(payment.id)}
                            >
                                <td>{formatDate(payment.payment_date)}</td>
                                <td className={styles.positive}>{formatCurrency(payment.amount)}</td>
                                <td>{PAYMENT_METHOD_LABELS[payment.payment_method] ?? payment.payment_method}</td>
                                <td>{payment.notes ?? '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )
        }
    </div>
);
