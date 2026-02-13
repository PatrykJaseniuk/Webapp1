'use client';

import type { Database } from '@/api/database.types';
import { EXPENSE_TYPE_LABELS } from '@/constants/labels';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import styles from './Tables.module.css';

type Expense = Database['public']['Tables']['property_expenses']['Row'];

interface ExpensesTableProps {
    data: Expense[];
    onRowClick?: (id: string) => void;
}

export const ExpensesTable = ({ data, onRowClick }: ExpensesTableProps) => (
    <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Wydatki ({data.length})</h2>

        {data.length === 0
            ? <div className={styles.emptyState}>Brak wydatków dla tej nieruchomooci</div>
            : (
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Typ</th>
                            <th>Opis</th>
                            <th>Kwota</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map(expense => (
                            <tr
                                key={expense.id}
                                className={onRowClick ? styles.clickableRow : ''}
                                onClick={() => onRowClick?.(expense.id)}
                            >
                                <td>{formatDate(expense.expense_date)}</td>
                                <td>{EXPENSE_TYPE_LABELS[expense.expense_type] ?? expense.expense_type}</td>
                                <td>{expense.description}</td>
                                <td className={styles.negative}>{formatCurrency(expense.amount)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )
        }
    </div>
);