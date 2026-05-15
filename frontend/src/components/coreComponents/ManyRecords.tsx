'use client';
import { useState } from 'react';
import { useAsync } from 'react-use';
import { ErrorBanner } from '@/components/coreComponents/ErrorBanner';
import { EmptyState } from '@/components/coreComponents/EmptyState';
import styles from '@/components/styles/manyRecords.module.css';
import pageStyles from '@/components/styles/pageLayout.module.css';
import { getFieldConfig } from '../fieldRegistry/registry';
import { PostgrestFilterBuilder } from '@supabase/postgrest-js';
import { database } from '@/api/database';

// ── Types ───────────────────────────────────────────────────────────

interface ManyRecordsProps<T extends Record<string, unknown> = Record<string, unknown>> {
    query: () => PostgrestFilterBuilder<any, any, any, any>
    hiddenColumns?: string[]
    onRowClick?: (row: T) => void
    defaultSortKey?: string
    defaultSortDirection?: 'asc' | 'desc'
    pageSize?: number
    refreshKey?: number
    emptyMessage?: string
    label?: string
    totalCount?: number
}

interface PaginationProps {
    page: number;
    pageSize: number;
    totalCount: number;
    onPageChange: (page: number) => void;
}


// ── Table Skeleton ──────────────────────────────────────────────────
const TableSkeleton = ({ rowCount, columnCount = 5 }: { rowCount: number; columnCount?: number }) => (
    <div className={styles.tableWrapper}>
        <table className={styles.table}>
            <thead className={styles.tableHeader}>
                <tr>
                    {Array.from({ length: columnCount }).map((_, i) => (
                        <th key={i} className={styles.tableHeaderCell}>
                            <div className={styles.tableSkeletonContent} style={{ width: '60%' }} />
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {Array.from({ length: rowCount }).map((_, rowIndex) => (
                    <tr key={rowIndex} className={styles.tableSkeletonRow}>
                        {Array.from({ length: columnCount }).map((_, colIndex) => (
                            <td key={colIndex} className={styles.tableSkeletonCell}>
                                <div
                                    className={styles.tableSkeletonContent}
                                    style={{ width: `${[50, 70, 40, 60, 55][colIndex % 5]}%` }}
                                />
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

// ── Pagination ──────────────────────────────────────────────────────

const Pagination = ({ page, pageSize, totalCount, onPageChange }: PaginationProps) => {
    const totalPages = Math.ceil(totalCount / pageSize);
    return totalPages <= 1 ? null : (
        <div className={styles.pagination}>
            <button
                className={styles.paginationButton}
                onClick={() => onPageChange(page - 1)}
                disabled={page === 0}
            >
                ← Poprzednia
            </button>
            <span className={styles.paginationInfo}>
                Strona {page + 1} z {totalPages}
            </span>
            <button
                className={styles.paginationButton}
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages - 1}
            >
                Następna →
            </button>
        </div>
    );
};


// ── ManyRecords Component ───────────────────────────────────────────

export const ManyRecords = ({
    query,
    hiddenColumns = [],
    onRowClick,
    defaultSortKey,
    defaultSortDirection = 'asc',
    pageSize = 10,
    refreshKey = 0,
    emptyMessage = 'Brak danych',
    label,
    totalCount = 0,
}: ManyRecordsProps) => {
    const [sortKey, setSortKey] = useState<string | null>(defaultSortKey ?? null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(defaultSortDirection);
    const [page, setPage] = useState(0);

    const handleSort = (key: string) => {
        setSortKey(key);
        setSortDirection((prev) => (sortKey === key ? (prev === 'asc' ? 'desc' : 'asc') : 'asc'));
        setPage(0);
    };

    const state = useAsync(async () => {
        const builder = query();
        const ordered = sortKey ?
            builder.order(sortKey, { ascending: sortDirection === 'asc' }) :
            builder.order('created_at', { ascending: false });

        const from = page * (pageSize || 1000);
        const to = from + (pageSize || 1000) - 1;
        const result = await ordered.range(from, to);
        return result as unknown as { data: Record<string, unknown>[] | null; error: { message: string } | null };
    }, [sortKey, sortDirection, page, refreshKey]);

    const rows = (state.value?.data ?? []);
    const error = state.error || state.value?.error




    return (
        <div className={styles.manyRecordsWrapper}>
            {/* Header */}
            <div className={pageStyles.sectionHeader}>
                {label && <h3 className={pageStyles.sectionTitle}>{label}</h3>}
            </div>


            <div
                className={styles.manyRecordsContent}
                style={{ '--page-size': pageSize } as React.CSSProperties}
            >
                {state.loading && rows.length == 0 ? ( // brackets in conditional expresion prevent from code indentation
                    <TableSkeleton
                        rowCount={pageSize + 1}
                    />
                ) : error ? (
                    <ErrorBanner msg={error.message} />
                ) : rows.length < 1 ? (
                    <EmptyState message={emptyMessage} />
                ) :
                    (
                        <>
                            <div className={styles.tableWrapper}>
                                <table className={styles.table}>
                                    <thead className={styles.tableHeader}>
                                        <tr>
                                            {Object.keys(rows[0]).map((fieldKey) => {
                                                const fieldConfig = getFieldConfig(fieldKey)
                                                return (
                                                    fieldConfig.isHidden ||
                                                    <th
                                                        key={fieldKey}
                                                        scope="col"
                                                        className={`${styles.tableHeaderCell} ${fieldConfig.isSortable ? styles.tableHeaderCellSortable : ''}`}
                                                        onClick={fieldConfig.isSortable ? () => handleSort(fieldKey) : undefined}
                                                        aria-sort={
                                                            fieldConfig.isSortable && sortKey === fieldKey ? (
                                                                sortDirection === 'asc' ? (
                                                                    'ascending'
                                                                ) : ('descending')
                                                            ) : ('none')
                                                        }
                                                    >
                                                        {fieldConfig.label}
                                                        {fieldConfig.isSortable && (
                                                            <span className={styles.sortIndicator}>
                                                                {sortKey === fieldKey ? (sortDirection === 'asc' ? '↑' : '↓') : '⇅'}
                                                            </span>
                                                        )}
                                                    </th>
                                                );
                                            })}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((row, index) => (
                                            <tr
                                                key={typeof row.id == "string" ? row.id : index}
                                                className={`${styles.tableRow} ${onRowClick ? styles.tableRowClickable : ''}`}
                                                onClick={onRowClick ? () => onRowClick(row) : undefined}
                                                role={onRowClick ? 'button' : undefined}
                                                tabIndex={onRowClick ? 0 : undefined}
                                                onKeyDown={onRowClick ? (e) => (e.key === 'Enter' || e.key === ' ') && onRowClick(row) : undefined}
                                            >
                                                {Object.keys(row).map((fieldKey) => {
                                                    const fieldConfig = getFieldConfig(fieldKey);
                                                    return (
                                                        fieldConfig.isHidden ||
                                                        <td key={fieldKey} className={styles.tableCell}>
                                                            {fieldConfig.fieldRenderer({
                                                                value: row[fieldKey],
                                                                mode: 'read',
                                                                context: 'table',
                                                                fieldKey,
                                                            })}
                                                        </td>)
                                                }

                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {pageSize > 0 && (
                                <Pagination
                                    page={page}
                                    pageSize={pageSize}
                                    totalCount={totalCount}
                                    onPageChange={setPage}
                                />
                            )}
                        </>
                    )}
            </div>
        </div>
    );
};