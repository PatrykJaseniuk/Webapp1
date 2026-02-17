'use client';

import React from 'react';

import styles from './DataTable.module.css';

export interface ColumnDef<T> {
    key: string;
    label: string;
    render?: (value: unknown, row: T) => React.ReactNode;
    className?: string;
}

interface DataTableProps<T> {
    data: T[];
    columns: ColumnDef<T>[];
    onRowClick?: (row: T) => void;
    emptyMessage?: string;
    loading?: boolean;
}

export function DataTable<T extends { id?: string }>({
    data,
    columns,
    onRowClick,
    emptyMessage = 'Brak danych',
    loading = false,
}: DataTableProps<T>) {
    const isLoading = loading;
    const isEmpty = !data || data.length === 0;

    return (
        <div className={styles.section}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        {columns.map((column) => (
                            <th key={column.key}>{column.label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {isLoading ? (
                        <tr>
                            <td colSpan={columns.length} className={styles.emptyState}>Ładowanie...</td>
                        </tr>
                    ) : isEmpty ? (
                        <tr>
                            <td colSpan={columns.length} className={styles.emptyState}>{emptyMessage}</td>
                        </tr>
                    ) : (
                        data.map((row, index) => (
                            <tr
                                key={row.id ?? index}
                                className={onRowClick ? styles.clickableRow : undefined}
                                onClick={() => onRowClick?.(row)}
                            >
                                {columns.map((column) => {
                                    const value = getCellValue(row, column.key);
                                    return (
                                        <td key={column.key} className={column.className}>
                                            {column.render
                                                ? column.render(value, row)
                                                : String(value ?? '')}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

// Helper function to get cell value from nested keys
const getCellValue = <T,>(row: T, key: string): unknown => {
    const keys = key.split('.');
    const value = keys.reduce((acc: unknown, k: string) =>
        (acc && typeof acc === 'object') ? (acc as Record<string, unknown>)[k] : undefined
        , row);
    return value;
};

// Helper function to get status badge class
export const getStatusClass = (
    status: string | null | undefined,
    mapping?: Record<string, string>
): string => {
    const defaultMapping: Record<string, string> = {
        available: styles.statusActive,
        occupied: styles.statusPending,
        active: styles.statusActive,
        pending: styles.statusPending,
        paid: styles.statusActive,
        overdue: styles.statusTerminated,
        expired: styles.statusExpired,
        terminated: styles.statusTerminated,
        inactive: styles.statusTerminated,
    };
    const map = mapping || defaultMapping;
    return status ? (map[status] || '') : '';
};

// Helper function to format currency
export const formatCurrencyValue = (amount: number | null | undefined): string => {
    const formatter = new Intl.NumberFormat('pl-PL', {
        style: 'currency',
        currency: 'PLN',
    });
    return amount === null || amount === undefined ? '—' : formatter.format(amount);
};

// Helper function to format date
export const formatDateValue = (date: string | null | undefined): string => {
    const result = date ? new Date(date).toLocaleDateString('pl-PL') : '—';
    return result === 'Invalid Date' ? (date ?? '—') : result;
};
