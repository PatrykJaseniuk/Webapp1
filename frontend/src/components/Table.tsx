'use client';

import { ReactNode } from 'react';
import styles from './Table.module.css';

interface Column<T> {
    key: string;
    header: string;
    render?: (item: T) => ReactNode;
}

interface TableProps<T> {
    columns: Column<T>[];
    data: T[];
    onRowClick?: (item: T) => void;
    emptyMessage?: string;
}

export const Table = <T extends Record<string, any>>({
    columns,
    data,
    onRowClick,
    emptyMessage = 'No data available'
}: TableProps<T>) => (
    <div className={styles.tableWrapper}>
        <table className={styles.table}>
            <thead>
                <tr>
                    {columns.map((col) => (
                        <th key={col.key} className={styles.th}>
                            {col.header}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {data.length === 0 ? (
                    <tr>
                        <td colSpan={columns.length} className={styles.emptyCell}>
                            {emptyMessage}
                        </td>
                    </tr>
                ) : (
                    data.map((item, index) => (
                        <tr
                            key={item.id ?? index}
                            className={onRowClick ? styles.clickableRow : ''}
                            onClick={() => onRowClick?.(item)}
                        >
                            {columns.map((col) => (
                                <td key={col.key} className={styles.td}>
                                    {col.render ? col.render(item) : item[col.key]}
                                </td>
                            ))}
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    </div>
);
