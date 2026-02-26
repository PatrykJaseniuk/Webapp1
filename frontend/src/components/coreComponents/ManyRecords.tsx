'use client';
import { useState } from 'react';
import { useAsync } from 'react-use';

import { resolveFieldConfig } from '@/components/fieldRegistry';
import type { FieldConfig } from '@/components/fieldRegistry';
import { ErrorBanner } from '@/components/coreComponents/ErrorBanner';
import { EmptyState } from '@/components/coreComponents/EmptyState';
import styles from '@/components/styles/shared.module.css';
import type { Database } from '@/api/database.types';

// ── Types ───────────────────────────────────────────────────────────

interface FieldOverrides {
    [key: string]: Partial<FieldConfig>
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
    columns?: FieldOverrides;
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

interface ResolvedField {
    key: string;
    config: FieldConfig;
}

// ── Helpers ─────────────────────────────────────────────────────────

const resolveFields = (
    keys: string[],
    hiddenColumns: string[],
    fieldOverrides: FieldOverrides,
): ResolvedField[] => {
    return keys
        .map((key) => {
            const config = resolveFieldConfig(key, fieldOverrides[key]);
            return { key, config };
        })
        .filter((field) => !field.config.hidden && !hiddenColumns.includes(field.key));
};

const renderCellValue = (field: ResolvedField, value: unknown, row: Record<string, unknown>): React.ReactNode =>
    field.config.fieldOutput
        ? field.config.fieldOutput(value, row)
        : value == null
            ? <span className="cellNull">—</span>
            : String(value);

const getFieldLabel = (field: ResolvedField): string =>
    field.config.label
        ? field.config.label()
        : field.key;

// ── Table Skeleton ──────────────────────────────────────────────────

interface TableSkeletonProps {
    fields: ResolvedField[];
    rowCount: number;
    sortKey: string | null;
    sortDirection: 'asc' | 'desc';
    onSort: (key: string) => void;
}

const TableSkeleton = ({ fields, rowCount, sortKey, sortDirection, onSort }: TableSkeletonProps) => (
    <div className={styles.tableWrapper}>
        <table className={styles.table}>
            <thead className={styles.tableHeader}>
                <tr>
                    {fields.map((field) => {
                        const isSortable = field.config.sortable !== false;
                        return (
                            <th
                                key={field.key}
                                scope="col"
                                className={`${styles.tableHeaderCell} ${isSortable ? styles.tableHeaderCellSortable : ''}`}
                                onClick={isSortable ? () => onSort(field.key) : undefined}
                                aria-sort={
                                    isSortable && sortKey === field.key
                                        ? sortDirection === 'asc'
                                            ? 'ascending'
                                            : 'descending'
                                        : 'none'
                                }
                            >
                                {getFieldLabel(field)}
                                {isSortable && (
                                    <span className={styles.sortIndicator}>
                                        {sortKey === field.key ? (sortDirection === 'asc' ? '↑' : '↓') : '⇅'}
                                    </span>
                                )}
                            </th>
                        );
                    })}
                </tr>
            </thead>
            <tbody>
                {Array.from({ length: rowCount }).map((_, index) => (
                    <tr key={index} className={styles.tableSkeletonRow}>
                        {fields.map((field) => (
                            <td key={field.key} className={styles.tableSkeletonCell}>
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
    columns: fieldOverrides = {},
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

    // Determine fields (ternary chain - no if/else per style guide)
    const resolvedFields = rows.length > 0 ?
        resolveFields(Object.keys(rows[0]), hiddenColumns, fieldOverrides)
        : [];

    const isInitialLoad = state.loading

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
                    resolvedFields.length > 0 ? (
                        <TableSkeleton
                            fields={resolvedFields}
                            rowCount={pageSize}
                            sortKey={sortKey}
                            sortDirection={sortDirection}
                            onSort={handleSort}
                        />
                    ) : (
                        <TableSkeleton
                            fields={[{ key: 'placeholder', config: { label: () => 'Ładowanie...' } }]}
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
                                            {resolvedFields.map((field) => {
                                                const isSortable = field.config.sortable !== false;
                                                return (
                                                    <th
                                                        key={field.key}
                                                        scope="col"
                                                        className={`${styles.tableHeaderCell} ${isSortable ? styles.tableHeaderCellSortable : ''}`}
                                                        onClick={isSortable ? () => handleSort(field.key) : undefined}
                                                        aria-sort={
                                                            isSortable && sortKey === field.key
                                                                ? sortDirection === 'asc'
                                                                    ? 'ascending'
                                                                    : 'descending'
                                                                : 'none'
                                                        }
                                                    >
                                                        {getFieldLabel(field)}
                                                        {isSortable && (
                                                            <span className={styles.sortIndicator}>
                                                                {sortKey === field.key ? (sortDirection === 'asc' ? '↑' : '↓') : '⇅'}
                                                            </span>
                                                        )}
                                                    </th>
                                                );
                                            })}
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
                                                {resolvedFields.map((field) => (
                                                    <td key={field.key} className={styles.tableCell}>
                                                        {renderCellValue(field, row[field.key], row)}
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