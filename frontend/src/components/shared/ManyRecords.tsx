'use client';
import { useState } from 'react';
import { useAsync } from 'react-use';

import { resolveColumnConfig } from '@/constants/columnRegistry';
import type { ColumnConfig } from '@/constants/columnRegistry';
import { Spinner } from '@/components/shared/Spinner';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { EmptyState } from '@/components/shared/EmptyState';
import styles from '@/components/styles/shared.module.css';

// ── Types ───────────────────────────────────────────────────────────

interface ColumnOverride {
    key: string;
    label?: string;
    render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
}

interface ManyRecordsProps {
    tableName: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: () => any;
    mode?: 'table' | 'cards' | 'list';
    hiddenColumns?: string[];
    columns?: ColumnOverride[];
    onRowClick?: (row: Record<string, unknown>) => void;
    onAdd?: () => void;
    onRowDelete?: (row: Record<string, unknown>) => Promise<{ error?: unknown }>;
    defaultSortKey?: string;
    defaultSortDirection?: 'asc' | 'desc';
    pageSize?: number;
    refreshKey?: number;
    emptyMessage?: string;
    label?: string;
    disabled?: boolean;
    disabledMessage?: string;
}

interface ResolvedColumn {
    key: string;
    config: ColumnConfig;
    overrideRender?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
}

// ── Helpers ─────────────────────────────────────────────────────────

const resolveColumns = (
    tableName: string,
    keys: string[],
    hiddenColumns: string[],
    columnOverrides: ColumnOverride[],
): ResolvedColumn[] => {
    const overrideMap = Object.fromEntries(
        columnOverrides.map((c) => [c.key, c]),
    );

    return keys
        .map((key) => {
            const override = overrideMap[key];
            const config = resolveColumnConfig(tableName, key, {
                ...(override?.label ? { label: override.label } : {}),
            });
            return { key, config, overrideRender: override?.render };
        })
        .filter(
            (col) =>
                !col.config.hidden && !hiddenColumns.includes(col.key),
        );
};

const renderCellValue = (col: ResolvedColumn, value: unknown, row: Record<string, unknown>): React.ReactNode =>
    col.overrideRender
        ? col.overrideRender(value, row)
        : col.config.render
            ? col.config.render(value)
            : value === null || value === undefined
                ? '—'
                : String(value);

// ── Table Renderer ──────────────────────────────────────────────────

interface RendererProps {
    rows: Record<string, unknown>[];
    columns: ResolvedColumn[];
    sortKey: string | null;
    sortDirection: 'asc' | 'desc';
    onSort: (key: string) => void;
    onRowClick?: (row: Record<string, unknown>) => void;
}

const TableRenderer = ({ rows, columns, sortKey, sortDirection, onSort, onRowClick }: RendererProps) => (
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
                        {col.config.label ?? col.key}
                        {sortKey === col.key ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
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
                    {columns.map((col) => (
                        <td key={col.key} className={styles.tableCell}>
                            {renderCellValue(col, row[col.key], row)}
                        </td>
                    ))}
                </tr>
            ))}
        </tbody>
    </table>
);

// ── Cards Renderer ──────────────────────────────────────────────────

const CardsRenderer = ({ rows, columns, onRowClick }: RendererProps) => (
    <div className={styles.cardsGrid}>
        {rows.map((row) => (
            <div
                key={row.id as string ?? JSON.stringify(row)}
                className={`${styles.card} ${onRowClick ? styles.cardClickable : ''}`}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                role={onRowClick ? 'button' : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={onRowClick ? (e) => (e.key === 'Enter' || e.key === ' ') && onRowClick(row) : undefined}
            >
                {columns.map((col) => (
                    <div key={col.key} className={styles.cardField}>
                        <span className={styles.cardFieldLabel}>{col.config.label ?? col.key}</span>
                        <span className={styles.cardFieldValue}>
                            {renderCellValue(col, row[col.key], row)}
                        </span>
                    </div>
                ))}
            </div>
        ))}
    </div>
);

// ── List Renderer ───────────────────────────────────────────────────

const ListRenderer = ({ rows, columns, onRowClick }: RendererProps) => (
    <div className={styles.listContainer}>
        {rows.map((row) => {
            const primaryCol = columns[0];
            const secondaryCol = columns[1];
            return (
                <div
                    key={row.id as string ?? JSON.stringify(row)}
                    className={`${styles.listItem} ${onRowClick ? styles.listItemClickable : ''}`}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    role={onRowClick ? 'button' : undefined}
                    tabIndex={onRowClick ? 0 : undefined}
                    onKeyDown={onRowClick ? (e) => (e.key === 'Enter' || e.key === ' ') && onRowClick(row) : undefined}
                >
                    <span className={styles.listItemPrimary}>
                        {primaryCol ? renderCellValue(primaryCol, row[primaryCol.key], row) : '—'}
                    </span>
                    {secondaryCol && (
                        <span className={styles.listItemSecondary}>
                            {renderCellValue(secondaryCol, row[secondaryCol.key], row)}
                        </span>
                    )}
                </div>
            );
        })}
    </div>
);

// ── Sort Control for cards/list ─────────────────────────────────────

interface SortControlProps {
    columns: ResolvedColumn[];
    sortKey: string | null;
    sortDirection: 'asc' | 'desc';
    onSort: (key: string) => void;
}

const SortControl = ({ columns, sortKey, sortDirection, onSort }: SortControlProps) => (
    <div className={styles.manyRecordsSortControl}>
        <span>Sortuj:</span>
        <select
            value={sortKey ?? ''}
            onChange={(e) => e.target.value && onSort(e.target.value)}
        >
            <option value="">—</option>
            {columns.map((col) => (
                <option key={col.key} value={col.key}>
                    {col.config.label ?? col.key}
                </option>
            ))}
        </select>
        {sortKey && (
            <button
                className={styles.buttonSecondary}
                onClick={() => onSort(sortKey)}
                style={{ padding: '0.125rem 0.5rem', fontSize: '0.75rem' }}
            >
                {sortDirection === 'asc' ? '↑ Rosnąco' : '↓ Malejąco'}
            </button>
        )}
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
    tableName,
    query,
    mode = 'table',
    hiddenColumns = [],
    columns: columnOverrides = [],
    onRowClick,
    onAdd,
    defaultSortKey,
    defaultSortDirection = 'asc',
    pageSize = 25,
    refreshKey = 0,
    emptyMessage = 'Brak danych',
    label,
    disabled = false,
    disabledMessage = 'Zapisz rekord, aby dodać powiązane dane',
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
        const ordered = sortKey
            ? builder.order(sortKey, { ascending: sortDirection === 'asc' })
            : builder.order('created_at', { ascending: false });

        const from = page * (pageSize || 1000);
        const to = from + (pageSize || 1000) - 1;
        const result = await (ordered.range(from, to) as unknown as Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null; count?: number | null }>);
        return result;
    }, [sortKey, sortDirection, page, refreshKey]);

    const rows = (state.value?.data ?? []) as Record<string, unknown>[];
    const dataError = state.value?.error;
    const columnKeys = rows.length > 0 ? Object.keys(rows[0]) : [];
    const resolvedColumns = resolveColumns(tableName, columnKeys, hiddenColumns, columnOverrides);

    const rendererProps: RendererProps = {
        rows,
        columns: resolvedColumns,
        sortKey,
        sortDirection,
        onSort: handleSort,
        onRowClick,
    };

    const totalCount = (state.value as unknown as { count?: number })?.count ?? rows.length;

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

            {/* Disabled state */}
            {disabled ? (
                <div className={styles.manyRecordsDisabled}>{disabledMessage}</div>
            ) : /* Hook-level error */
                state.error ? (
                    <ErrorBanner msg={state.error.message} />
                ) : /* Loading */
                    state.loading ? (
                        <Spinner />
                    ) : /* Data-level error */
                        dataError ? (
                            <ErrorBanner msg={dataError.message} />
                        ) : /* Empty */
                            rows.length === 0 ? (
                                <EmptyState message={emptyMessage} />
                            ) : (
                                <>
                                    {/* Sort control for non-table modes */}
                                    {mode !== 'table' && (
                                        <div className={styles.manyRecordsToolbar}>
                                            <SortControl
                                                columns={resolvedColumns}
                                                sortKey={sortKey}
                                                sortDirection={sortDirection}
                                                onSort={handleSort}
                                            />
                                        </div>
                                    )}

                                    {/* Render mode */}
                                    {mode === 'table' ? (
                                        <TableRenderer {...rendererProps} />
                                    ) : mode === 'cards' ? (
                                        <CardsRenderer {...rendererProps} />
                                    ) : (
                                        <ListRenderer {...rendererProps} />
                                    )}

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
    );
};
