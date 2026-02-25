'use client';
import { useState } from 'react';
import { useAsync } from 'react-use';

import { resolveColumnConfig } from '@/constants/columnRegistry';
import type { ColumnConfig } from '@/constants/columnRegistry';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { EmptyState } from '@/components/shared/EmptyState';
import styles from '@/components/styles/shared.module.css';
import type { Database } from '@/api/database.types';

// ── Types ───────────────────────────────────────────────────────────

interface ColumnOverrides {
    [key: string]: Partial<ColumnConfig>
}

// Query result type from Supabase
interface QueryResult<T> {
    data: T[] | null;
    error: { message: string } | null;
    count?: number | null;
}

// Type for the query builder that ManyRecords expects
// This is a minimal interface that captures the methods we need from the Supabase query builder
// The Supabase builder is "thenable" - it has a then method and can be awaited
interface ManyRecordsQueryBuilder<T = Record<string, unknown>> extends PromiseLike<QueryResult<T>> {
    order: (column: string, options?: { ascending?: boolean }) => ManyRecordsQueryBuilder<T>;
    range: (from: number, to: number) => ManyRecordsQueryBuilder<T>;
}

// Helper type to extract row type from table/view name (exported for consumers)
type TableName = keyof (Database['public']['Tables'] & Database['public']['Views']);
type TableRow<TName extends TableName> = (Database['public']['Tables'] & Database['public']['Views'])[TName] extends { Row: infer R } ? R : never;

interface ManyRecordsProps<T extends Record<string, unknown> = Record<string, unknown>> {
    query: () => ManyRecordsQueryBuilder<T>;
    hiddenColumns?: string[];
    columns?: ColumnOverrides;
    onRowClick?: (row: T) => void;
    onAdd?: () => void;
    onRowDelete?: (row: T) => Promise<{ error?: unknown }>;
    defaultSortKey?: string;
    defaultSortDirection?: 'asc' | 'desc';
    pageSize?: number;
    refreshKey?: number;
    emptyMessage?: string;
    label?: string;
    disabled?: boolean;
    disabledMessage?: string;
    totalCount?: number;
}

interface ResolvedColumn {
    key: string;
    config: ColumnConfig;
}

// ── Helpers ─────────────────────────────────────────────────────────

const resolveColumns = (
    keys: string[],
    hiddenColumns: string[],
    columnOverrides: ColumnOverrides,
): ResolvedColumn[] => {
    return keys
        .map((key) => {
            const config = resolveColumnConfig(key, columnOverrides[key]);
            return { key, config };
        })
        .filter((col) => !col.config.hidden && !hiddenColumns.includes(col.key));
};

const renderCellValue = (col: ResolvedColumn, value: unknown, row: Record<string, unknown>): React.ReactNode =>
    col.config.cellRender
        ? col.config.cellRender(value, row)
        : value == null
            ? <span className="cellNull">—</span>
            : String(value);

const getColumnLabel = (col: ResolvedColumn): string =>
    col.config.labelRender
        ? col.config.labelRender()
        : col.key;

// ── Table Skeleton ──────────────────────────────────────────────────

interface TableSkeletonProps {
    columns: ResolvedColumn[];
    rowCount: number;
    sortKey: string | null;
    sortDirection: 'asc' | 'desc';
    onSort: (key: string) => void;
}

const TableSkeleton = ({ columns, rowCount, sortKey, sortDirection, onSort }: TableSkeletonProps) => (
    <div className={styles.tableWrapper}>
        <table className={styles.table}>
            <thead className={styles.tableHeader}>
                <tr>
                    {columns.map((col) => (
                        <th
                            key={col.key}
                            scope="col"
                            className={`${styles.tableHeaderCell} ${styles.tableHeaderCellSortable}`}
                            onClick={() => onSort(col.key)}
                            aria-sort={
                                sortKey === col.key
                                    ? sortDirection === 'asc'
                                        ? 'ascending'
                                        : 'descending'
                                    : 'none'
                            }
                        >
                            {getColumnLabel(col)}
                            <span className={styles.sortIndicator}>
                                {sortKey === col.key ? (sortDirection === 'asc' ? '↑' : '↓') : '⇅'}
                            </span>
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {Array.from({ length: rowCount }).map((_, index) => (
                    <tr key={index} className={styles.tableSkeletonRow}>
                        {columns.map((col) => (
                            <td key={col.key} className={styles.tableSkeletonCell}>
                                <div className={styles.tableSkeletonContent} />
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

// ── Pagination ──────────────────────────────────────────────────────

interface PaginationProps {
    page: number;
    pageSize: number;
    totalCount: number;
    onPageChange: (page: number) => void;
}

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
    columns: columnOverrides = {},
    onRowClick,
    onAdd,
    defaultSortKey,
    defaultSortDirection = 'asc',
    pageSize = 10,
    refreshKey = 0,
    emptyMessage = 'Brak danych',
    label,
    disabled = false,
    disabledMessage = 'Zapisz rekord, aby dodać powiązane dane',
    totalCount: totalCountProp = 0,
}: ManyRecordsProps) => {
    const [sortKey, setSortKey] = useState<string | null>(defaultSortKey ?? null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(defaultSortDirection);
    const [page, setPage] = useState(0);

    // Track previous data for display during refetch
    // const previousDataRef = useRef<Record<string, unknown>[]>([]);
    // const previousColumnsRef = useRef<ResolvedColumn[]>([]);
    // const previousTotalCountRef = useRef<number>(0);

    const handleSort = (key: string) => {
        setSortKey(key);
        setSortDirection((prev) => (sortKey === key ? (prev === 'asc' ? 'desc' : 'asc') : 'asc'));
        setPage(0);
    };

    const state = useAsync(async () => {
        const builder = query();
        const ordered = sortKey ?
            builder.order(sortKey, { ascending: sortDirection === 'asc' })
            : builder.order('created_at', { ascending: false });

        const from = page * (pageSize || 1000);
        const to = from + (pageSize || 1000) - 1;
        const result = await ordered.range(from, to);
        return result as unknown as { data: Record<string, unknown>[] | null; error: { message: string } | null };
    }, [sortKey, sortDirection, page, refreshKey]);

    const rows = (state.value?.data ?? []) as Record<string, unknown>[];
    const dataError = state.value?.error;
    const count = (state.value as any)?.count as number

    // Determine columns (ternary chain - no if/else per style guide)
    const resolvedColumns = rows.length > 0 ?
        resolveColumns(Object.keys(rows[0]), hiddenColumns, columnOverrides)
        : [];

    // // Update refs when we have data (immutable pattern)
    // useEffect(() => {
    //     previousDataRef.current = rows.length > 0 ? rows : previousDataRef.current;
    //     previousColumnsRef.current = rows.length > 0 ? resolvedColumns : previousColumnsRef.current;
    //     previousTotalCountRef.current = totalCountProp > 0 ? totalCountProp : previousTotalCountRef.current;
    // }, [rows, resolvedColumns, totalCountProp]);

    // // Determine display data - always show pageSize rows
    const isInitialLoad = state.loading
    // const displayRows = isInitialLoad ? [] : (rows.length > 0 ? rows : previousDataRef.current);
    // const displayTotalCount = totalCountProp > 0 ? totalCountProp : previousTotalCountRef.current;
    // const showEmptyState = !state.loading && !state.error && !dataError && displayRows.length === 0;

    // Calculate empty rows for padding
    // const emptyRowsCount = Math.max(0, pageSize - displayRows.length);
    // const emptyRows = Array.from({ length: emptyRowsCount });

    return (
        <div className={styles.manyRecordsWrapper}>
            {/* Header */}
            {(label ?? onAdd) && (
                <div className={styles.sectionHeader}>
                    {label && <h3 className={styles.sectionTitle}>{label}</h3>}
                    {onAdd && !disabled && (
                        <button className={styles.buttonPrimary} onClick={onAdd}>
                            Dodaj
                        </button>
                    )}
                </div>
            )}

            {/* Content */}
            <div
                className={styles.manyRecordsContent}
                style={{ '--page-size': pageSize } as React.CSSProperties}
            >
                {disabled ? (
                    <div className={styles.manyRecordsDisabled}>{disabledMessage}</div>
                ) : state.loading && rows.length == 0 ? (
                    resolvedColumns.length > 0 ? (
                        <TableSkeleton
                            columns={resolvedColumns}
                            rowCount={pageSize}
                            sortKey={sortKey}
                            sortDirection={sortDirection}
                            onSort={handleSort}
                        />
                    ) : (
                        <TableSkeleton
                            columns={[{ key: 'placeholder', config: { labelRender: () => 'Ładowanie...' } }]}
                            rowCount={pageSize}
                            sortKey={null}
                            sortDirection="asc"
                            onSort={() => { }}
                        />
                    )
                ) : state.error ? (
                    <ErrorBanner msg={state.error.message} />
                ) : dataError ? (
                    <ErrorBanner msg={dataError.message} />
                ) : rows.length < 1 ? (
                    <EmptyState message={emptyMessage} />
                ) :
                    (
                        <>
                            {/* Table Rendered Inline */}
                            <div className={styles.tableWrapper}>
                                <table className={styles.table}>
                                    <thead className={styles.tableHeader}>
                                        <tr>
                                            {resolvedColumns.map((col) => (
                                                <th
                                                    key={col.key}
                                                    scope="col"
                                                    className={`${styles.tableHeaderCell} ${styles.tableHeaderCellSortable}`}
                                                    onClick={() => handleSort(col.key)}
                                                    aria-sort={
                                                        sortKey === col.key
                                                            ? sortDirection === 'asc'
                                                                ? 'ascending'
                                                                : 'descending'
                                                            : 'none'
                                                    }
                                                >
                                                    {getColumnLabel(col)}
                                                    <span className={styles.sortIndicator}>
                                                        {sortKey === col.key ? (sortDirection === 'asc' ? '↑' : '↓') : '⇅'}
                                                    </span>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((row) => (
                                            <tr
                                                key={row.id as string ?? JSON.stringify(row)}
                                                className={`${styles.tableRow} ${onRowClick ? styles.tableRowClickable : ''}`}
                                                onClick={onRowClick ? () => onRowClick(row) : undefined}
                                                role={onRowClick ? 'button' : undefined}
                                                tabIndex={onRowClick ? 0 : undefined}
                                                onKeyDown={onRowClick ? (e) => (e.key === 'Enter' || e.key === ' ') && onRowClick(row) : undefined}
                                            >
                                                {resolvedColumns.map((col) => (
                                                    <td key={col.key} className={styles.tableCell}>
                                                        {renderCellValue(col, row[col.key], row)}
                                                    </td>
                                                ))}
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
                                    totalCount={count}
                                    onPageChange={setPage}
                                />
                            )}
                        </>
                    )}
            </div>
        </div>
    );
};