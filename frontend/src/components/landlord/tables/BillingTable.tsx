'use client';

import type { Database } from '@/api/database.types';
import { BILLING_STATUS_LABELS, ITEM_TYPE_LABELS } from '@/constants/labels';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import styles from './Tables.module.css';

type BillingItem = Database['public']['Tables']['billing_items']['Row'];
type Payment = Database['public']['Tables']['payments']['Row'];

interface BillingWithPayments extends BillingItem {
    payments?: Payment[];
}

interface BillingTableProps {
    data: BillingWithPayments[];
    onRowClick?: (id: string) => void;
}

const getStatusClass = (status: string) =>
    status === 'paid' ? styles.statusActive :
        status === 'overdue' ? styles.statusTerminated :
            styles.statusPending;

export const BillingTable = ({ data, onRowClick }: BillingTableProps) => (
    <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Rozliczenia ({data.length})</h2>

        {data.length === 0
            ? <div className={styles.emptyState}>Brak rozliczeń dla tej nieruchomości</div>
            : (
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Opis</th>
                            <th>Typ</th>
                            <th>Kwota</th>
                            <th>Opłacono</th>
                            <th>Saldo</th>
                            <th>Termin</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map(item => {
                            const paid = (item.payments ?? []).reduce((sum, p) => sum + p.amount, 0);
                            const balance = item.amount - paid;

                            return (
                                <tr
                                    key={item.id}
                                    className={onRowClick ? styles.clickableRow : ''}
                                    onClick={() => onRowClick?.(item.id)}
                                >
                                    <td>{item.description}</td>
                                    <td>{ITEM_TYPE_LABELS[item.item_type] ?? item.item_type}</td>
                                    <td>{formatCurrency(item.amount)}</td>
                                    <td>{formatCurrency(paid)}</td>
                                    <td className={balance > 0 ? styles.negative : styles.positive}>
                                        {formatCurrency(balance)}
                                    </td>
                                    <td>{formatDate(item.due_date)}</td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${getStatusClass(item.status)}`}>
                                            {BILLING_STATUS_LABELS[item.status] ?? item.status}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )
        }
    </div>
);
